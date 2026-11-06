from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.db.models import AppVersion
from app.core.security import get_current_user, AuthUser
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/devices", tags=["Devices & App Versions"])


class VersionUpsertDto(BaseModel):
    platform: str
    version: str
    minSupportedVersion: Optional[str] = None
    minVersion: Optional[str] = None
    isForceUpdate: Optional[bool] = False
    forceUpdate: Optional[bool] = False
    releaseNotes: Optional[str] = None
    buildNumber: Optional[int] = None


def serialize_version(v: AppVersion) -> Dict[str, Any]:
    return {
        "id": v.id,
        "platform": v.platform,
        "version": v.version,
        "buildNumber": v.build_number,
        "minSupportedVersion": v.min_version,
        "minVersion": v.min_version,
        "isForceUpdate": bool(v.force_update),
        "forceUpdate": bool(v.force_update),
        "releaseNotes": v.release_notes or "",
        "createdAt": v.created_at.isoformat() if v.created_at else "",
    }


@router.get("/admin/versions")
async def list_versions_admin(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(AppVersion).order_by(desc(AppVersion.created_at))
    res = await db.execute(stmt)
    versions = res.scalars().all()
    items = [serialize_version(v) for v in versions]

    return {
        "success": True,
        "data": items,
        "items": items,
    }


@router.post("/admin/versions")
async def create_version_admin(
    dto: VersionUpsertDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    min_ver = dto.minSupportedVersion or dto.minVersion or dto.version
    force_up = dto.isForceUpdate if dto.isForceUpdate is not None else (dto.forceUpdate or False)
    build_num = dto.buildNumber
    if build_num is None:
        try:
            # derive build number from version string digits, e.g. "1.2.3" -> 10203
            parts = [int(p) for p in dto.version.split(".") if p.isdigit()]
            build_num = int("".join(str(p).zfill(2) for p in parts)) or 1
        except Exception:
            build_num = 1

    app_ver = AppVersion(
        platform=dto.platform.upper(),
        version=dto.version,
        build_number=build_num,
        min_version=min_ver,
        force_update=force_up,
        release_notes=dto.releaseNotes or "",
    )
    db.add(app_ver)
    await db.commit()
    await db.refresh(app_ver)

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="APP_VERSION_CREATE",
        entity_type="APP_VERSION",
        entity_id=app_ver.id,
        new_data=serialize_version(app_ver),
    )

    return {"success": True, "data": serialize_version(app_ver)}


@router.patch("/admin/versions/{version_id}")
async def update_version_admin(
    version_id: str,
    dto: VersionUpsertDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(AppVersion).where(AppVersion.id == version_id)
    app_ver = (await db.execute(stmt)).scalar_one_or_none()
    if not app_ver:
        raise HTTPException(status_code=404, detail="Version record not found.")

    if dto.platform:
        app_ver.platform = dto.platform.upper()
    if dto.version:
        app_ver.version = dto.version
    if dto.minSupportedVersion is not None or dto.minVersion is not None:
        app_ver.min_version = dto.minSupportedVersion or dto.minVersion
    if dto.isForceUpdate is not None or dto.forceUpdate is not None:
        app_ver.force_update = dto.isForceUpdate if dto.isForceUpdate is not None else dto.forceUpdate
    if dto.releaseNotes is not None:
        app_ver.release_notes = dto.releaseNotes
    if dto.buildNumber is not None:
        app_ver.build_number = dto.buildNumber

    await db.commit()
    await db.refresh(app_ver)

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="APP_VERSION_UPDATE",
        entity_type="APP_VERSION",
        entity_id=app_ver.id,
        new_data=serialize_version(app_ver),
    )

    return {"success": True, "data": serialize_version(app_ver)}


@router.delete("/admin/versions/{version_id}")
async def delete_version_admin(
    version_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(AppVersion).where(AppVersion.id == version_id)
    app_ver = (await db.execute(stmt)).scalar_one_or_none()
    if not app_ver:
        raise HTTPException(status_code=404, detail="Version record not found.")

    await db.delete(app_ver)
    await db.commit()

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="APP_VERSION_DELETE",
        entity_type="APP_VERSION",
        entity_id=version_id,
    )

    return {"success": True, "message": "App version deleted successfully."}

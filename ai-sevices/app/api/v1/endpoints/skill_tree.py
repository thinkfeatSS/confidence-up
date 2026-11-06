from typing import List, Dict, Any
from fastapi import APIRouter

router = APIRouter(prefix="/skill-tree", tags=["Skill Tree (Deprecated Compatibility)"])


@router.get("/admin/all")
@router.get("")
async def get_skill_tree_empty():
    """
    Skill Tree feature has been purged and superseded by the Gamification & Fear Matrix.
    Returns an empty array so legacy or cached client calls never encounter a 404.
    """
    return {
        "success": True,
        "data": [],
        "items": [],
        "message": "Skill Tree feature has been retired."
    }


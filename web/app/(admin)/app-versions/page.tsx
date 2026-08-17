'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '@/components/ui/form-select';
import { PLATFORMS, unwrapList } from '@/lib/constants';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface AppVersion {
  id: string;
  platform: string;
  version: string;
  minSupportedVersion: string;
  isForceUpdate: boolean;
  releaseNotes: string;
  createdAt: string;
}

const versionSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  version: z.string().min(1, 'Version is required'),
  minSupportedVersion: z.string().min(1, 'Min supported version is required'),
  isForceUpdate: z.boolean(),
  releaseNotes: z.string().optional(),
});

type VersionFormValues = z.infer<typeof versionSchema>;

function VersionForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<VersionFormValues>;
  onSubmit: (v: VersionFormValues) => void;
  loading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<VersionFormValues>({
    resolver: zodResolver(versionSchema),
    defaultValues: { isForceUpdate: false, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Platform</Label>
          <FormSelect {...register('platform')} options={PLATFORMS} />
          {errors.platform && <p className="text-xs text-destructive">{errors.platform.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Version</Label>
          <Input {...register('version')} placeholder="1.0.0" />
          {errors.version && <p className="text-xs text-destructive">{errors.version.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Min Supported Version</Label>
        <Input {...register('minSupportedVersion')} placeholder="0.9.0" />
        {errors.minSupportedVersion && <p className="text-xs text-destructive">{errors.minSupportedVersion.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Release Notes</Label>
        <Textarea {...register('releaseNotes')} rows={2} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isForceUpdate" {...register('isForceUpdate')} className="w-4 h-4 rounded accent-primary" />
        <Label htmlFor="isForceUpdate" className="cursor-pointer">Force Update</Label>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
          Save Version
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AppVersionsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editVersion, setEditVersion] = useState<AppVersion | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: versions, isLoading, isError } = useQuery<AppVersion[]>({
    queryKey: ['app-versions'],
    queryFn: async () => {
      const res = await api.get('/devices/admin/versions');
      return unwrapList<AppVersion>(res.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (v: VersionFormValues) => { await api.post('/devices/admin/versions', v); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['app-versions'] }); setCreateOpen(false); toast.success('Version created'); },
    onError: () => toast.error('Failed to create version'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: VersionFormValues }) => {
      await api.patch(`/devices/admin/versions/${id}`, values);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['app-versions'] }); setEditVersion(null); toast.success('Version updated'); },
    onError: () => toast.error('Failed to update version'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/devices/admin/versions/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['app-versions'] }); setDeleteId(null); toast.success('Version deleted'); },
    onError: () => toast.error('Failed to delete version'),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">App Versions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{versions?.length ?? 0} versions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Version
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Create App Version</DialogTitle></DialogHeader>
            <VersionForm onSubmit={(v) => createMutation.mutate(v)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isError && <div className="py-8 text-center text-sm text-destructive">Failed to load app versions.</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Min Supported</TableHead>
                <TableHead>Force Update</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : versions?.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v.platform === 'IOS' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {v.platform === 'IOS' ? 'iOS' : 'Android'}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono font-medium">{v.version}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{v.minSupportedVersion}</TableCell>
                      <TableCell>
                        {v.isForceUpdate ? (
                          <Badge variant="destructive">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditVersion(v)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(v.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!isLoading && !isError && !versions?.length && (
            <div className="py-12 text-center text-sm text-muted-foreground">No versions yet.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editVersion} onOpenChange={(o) => { if (!o) setEditVersion(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit App Version</DialogTitle></DialogHeader>
          {editVersion && (
            <VersionForm
              defaultValues={{
                platform: editVersion.platform,
                version: editVersion.version,
                minSupportedVersion: editVersion.minSupportedVersion,
                isForceUpdate: editVersion.isForceUpdate,
                releaseNotes: editVersion.releaseNotes,
              }}
              onSubmit={(v) => updateMutation.mutate({ id: editVersion.id, values: v })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Version</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

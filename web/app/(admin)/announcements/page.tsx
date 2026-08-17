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
import { ANNOUNCEMENT_TYPES, unwrapPaginated } from '@/lib/constants';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  type: z.string().min(1, 'Type is required'),
  startsAt: z.string().min(1, 'Start date is required'),
  endsAt: z.string().min(1, 'End date is required'),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

const typeStyles: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-700',
  WARNING: 'bg-amber-100 text-amber-700',
  UPDATE: 'bg-violet-100 text-violet-700',
};

function AnnouncementForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<AnnouncementFormValues>;
  onSubmit: (v: AnnouncementFormValues) => void;
  loading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { type: 'INFO', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Body</Label>
        <Textarea {...register('body')} rows={3} />
        {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Type</Label>
        <FormSelect {...register('type')} options={ANNOUNCEMENT_TYPES} />
        {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Starts At</Label>
          <Input type="datetime-local" {...register('startsAt')} />
          {errors.startsAt && <p className="text-xs text-destructive">{errors.startsAt.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Ends At</Label>
          <Input type="datetime-local" {...register('endsAt')} />
          {errors.endsAt && <p className="text-xs text-destructive">{errors.endsAt.message}</p>}
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
          Save Announcement
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AnnouncementsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editAnn, setEditAnn] = useState<Announcement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: announcements, isLoading, isError } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await api.get('/announcements', { params: { limit: 100 } });
      return unwrapPaginated<Announcement>(res.data).items;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (v: AnnouncementFormValues) => { await api.post('/announcements', v); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); setCreateOpen(false); toast.success('Announcement created'); },
    onError: () => toast.error('Failed to create announcement'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: AnnouncementFormValues }) => {
      await api.patch(`/announcements/${id}`, values);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); setEditAnn(null); toast.success('Announcement updated'); },
    onError: () => toast.error('Failed to update announcement'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/announcements/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); setDeleteId(null); toast.success('Announcement deleted'); },
    onError: () => toast.error('Failed to delete announcement'),
  });

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Announcements</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{announcements?.length ?? 0} announcements</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
            <AnnouncementForm onSubmit={(v) => createMutation.mutate(v)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isError && <div className="py-8 text-center text-sm text-destructive">Failed to load announcements.</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead>Ends</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : announcements?.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium max-w-xs truncate">{a.title}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeStyles[a.type] ?? 'bg-muted'}`}>
                          {a.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(a.startsAt)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(a.endsAt)}</TableCell>
                      <TableCell>
                        {a.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditAnn(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!isLoading && !isError && !announcements?.length && (
            <div className="py-12 text-center text-sm text-muted-foreground">No announcements yet.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editAnn} onOpenChange={(o) => { if (!o) setEditAnn(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Announcement</DialogTitle></DialogHeader>
          {editAnn && (
            <AnnouncementForm
              defaultValues={{
                title: editAnn.title,
                body: editAnn.body,
                type: editAnn.type,
                startsAt: editAnn.startsAt?.slice(0, 16),
                endsAt: editAnn.endsAt?.slice(0, 16),
              }}
              onSubmit={(v) => updateMutation.mutate({ id: editAnn.id, values: v })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Announcement</DialogTitle></DialogHeader>
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

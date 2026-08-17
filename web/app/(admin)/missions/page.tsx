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
import {
  CONTENT_CATEGORIES,
  DIFFICULTIES,
  difficultyColors,
  parseTips,
  unwrapList,
} from '@/lib/constants';
import { Plus, Pencil, Trash2, Loader2, Search, CalendarDays } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  xpReward: number;
  estimatedMinutes?: number;
  prompt?: string;
  tips?: string[];
  isActive: boolean;
}

const missionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.string().min(1, 'Difficulty is required'),
  xpReward: z.number().min(0),
  estimatedMinutes: z.number().min(1),
  prompt: z.string().min(1, 'Prompt is required'),
  tipsText: z.string().min(1, 'At least one tip is required'),
});

type MissionFormValues = z.infer<typeof missionSchema>;

const dailySchema = z.object({
  missionId: z.string().min(1, 'Mission is required'),
  date: z.string().min(1, 'Date is required'),
});
type DailyFormValues = z.infer<typeof dailySchema>;

function buildMissionPayload(values: MissionFormValues) {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    difficulty: values.difficulty,
    xpReward: values.xpReward,
    estimatedMinutes: values.estimatedMinutes,
    prompt: values.prompt,
    tips: parseTips(values.tipsText),
  };
}

function MissionForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<MissionFormValues>;
  onSubmit: (v: MissionFormValues) => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      xpReward: 50,
      estimatedMinutes: 10,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea {...register('description')} rows={3} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Speaking Prompt</Label>
        <Textarea {...register('prompt')} rows={2} placeholder="Hi, my name is..." />
        {errors.prompt && <p className="text-xs text-destructive">{errors.prompt.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <FormSelect {...register('category')} options={CONTENT_CATEGORIES} />
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Difficulty</Label>
          <FormSelect {...register('difficulty')} options={DIFFICULTIES} />
          {errors.difficulty && <p className="text-xs text-destructive">{errors.difficulty.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>XP Reward</Label>
          <Input type="number" {...register('xpReward', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Est. Minutes</Label>
          <Input type="number" {...register('estimatedMinutes', { valueAsNumber: true })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Tips (one per line)</Label>
        <Textarea {...register('tipsText')} rows={3} placeholder="Stand up while speaking&#10;Record yourself" />
        {errors.tipsText && <p className="text-xs text-destructive">{errors.tipsText.message}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
          Save Mission
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function MissionsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editMission, setEditMission] = useState<Mission | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('');

  const {
    register: registerDaily,
    handleSubmit: handleDailySubmit,
    formState: { errors: dailyErrors },
  } = useForm<DailyFormValues>({ resolver: zodResolver(dailySchema) });

  const { data: missions, isLoading, isError } = useQuery<Mission[]>({
    queryKey: ['missions', search, diffFilter],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '100' };
      if (search) params.search = search;
      if (diffFilter) params.difficulty = diffFilter;
      const res = await api.get('/missions/admin/all', { params });
      return unwrapList<Mission>(res.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (v: MissionFormValues) => { await api.post('/missions', buildMissionPayload(v)); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['missions'] }); setCreateOpen(false); toast.success('Mission created'); },
    onError: () => toast.error('Failed to create mission'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: MissionFormValues }) => {
      await api.patch(`/missions/${id}`, buildMissionPayload(values));
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['missions'] }); setEditMission(null); toast.success('Mission updated'); },
    onError: () => toast.error('Failed to update mission'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/missions/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['missions'] }); setDeleteId(null); toast.success('Mission deleted'); },
    onError: () => toast.error('Failed to delete mission'),
  });

  const setDailyMutation = useMutation({
    mutationFn: async (v: DailyFormValues) => {
      await api.post('/missions/daily', v);
    },
    onSuccess: () => { setDailyOpen(false); toast.success('Daily mission set'); },
    onError: () => toast.error('Failed to set daily mission'),
  });

  const toFormValues = (m: Mission): Partial<MissionFormValues> => ({
    title: m.title,
    description: m.description,
    category: m.category,
    difficulty: m.difficulty,
    xpReward: m.xpReward,
    estimatedMinutes: m.estimatedMinutes ?? 10,
    prompt: m.prompt ?? '',
    tipsText: Array.isArray(m.tips) ? m.tips.join('\n') : '',
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Missions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{missions?.length ?? 0} missions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDailyOpen(true)} className="gap-1.5">
            <CalendarDays className="w-4 h-4" /> Set Daily
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> New Mission
          </Button>
          <Dialog open={dailyOpen} onOpenChange={setDailyOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Set Daily Mission</DialogTitle></DialogHeader>
              <form onSubmit={handleDailySubmit((v) => setDailyMutation.mutate(v))} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" {...registerDaily('date')} />
                  {dailyErrors.date && <p className="text-xs text-destructive">{dailyErrors.date.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Mission</Label>
                  <FormSelect {...registerDaily('missionId')} options={(missions ?? []).map((m) => ({ value: m.id, label: m.title }))} placeholder="Select mission" />
                  {dailyErrors.missionId && <p className="text-xs text-destructive">{dailyErrors.missionId.message}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={setDailyMutation.isPending}>
                    {setDailyMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
                    Set Daily Mission
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Create Mission</DialogTitle></DialogHeader>
              <MissionForm onSubmit={(v) => createMutation.mutate(v)} loading={createMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search missions…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
            </div>
            <FormSelect
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              options={[{ value: '', label: 'All Difficulties' }, ...DIFFICULTIES]}
              placeholder="All Difficulties"
              className="w-auto min-w-[160px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isError && (
            <div className="py-8 text-center text-sm text-destructive">Failed to load missions.</div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : missions?.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium max-w-xs truncate">{m.title}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{m.category}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[m.difficulty] ?? 'bg-muted'}`}>
                          {m.difficulty}
                        </span>
                      </TableCell>
                      <TableCell>+{m.xpReward} XP</TableCell>
                      <TableCell>
                        {m.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditMission(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!isLoading && !isError && !missions?.length && (
            <div className="py-12 text-center text-sm text-muted-foreground">No missions found.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editMission} onOpenChange={(o) => { if (!o) setEditMission(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Mission</DialogTitle></DialogHeader>
          {editMission && (
            <MissionForm
              defaultValues={toFormValues(editMission)}
              onSubmit={(v) => updateMutation.mutate({ id: editMission.id, values: v })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Mission</DialogTitle></DialogHeader>
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

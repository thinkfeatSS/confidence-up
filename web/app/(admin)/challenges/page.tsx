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
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  xpReward: number;
  durationDays: number;
  tips?: string[];
  isActive: boolean;
}

const challengeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.string().min(1, 'Difficulty is required'),
  xpReward: z.number().min(0),
  durationDays: z.number().min(1),
  tipsText: z.string().min(1, 'At least one tip is required'),
});

type ChallengeFormValues = z.infer<typeof challengeSchema>;

function buildPayload(values: ChallengeFormValues) {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    difficulty: values.difficulty,
    xpReward: values.xpReward,
    durationDays: values.durationDays,
    tips: parseTips(values.tipsText),
  };
}

function ChallengeForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<ChallengeFormValues>;
  onSubmit: (v: ChallengeFormValues) => void;
  loading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeSchema),
    defaultValues: { xpReward: 50, durationDays: 7, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Label>Duration (days)</Label>
          <Input type="number" {...register('durationDays', { valueAsNumber: true })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Tips (one per line)</Label>
        <Textarea {...register('tipsText')} rows={3} />
        {errors.tipsText && <p className="text-xs text-destructive">{errors.tipsText.message}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
          Save Challenge
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ChallengesPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editChallenge, setEditChallenge] = useState<Challenge | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('');

  const { data: challenges, isLoading, isError } = useQuery<Challenge[]>({
    queryKey: ['challenges', search, diffFilter],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '100' };
      if (search) params.search = search;
      if (diffFilter) params.difficulty = diffFilter;
      const res = await api.get('/challenges/admin/all', { params });
      return unwrapList<Challenge>(res.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (v: ChallengeFormValues) => { await api.post('/challenges', buildPayload(v)); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); setCreateOpen(false); toast.success('Challenge created'); },
    onError: () => toast.error('Failed to create challenge'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ChallengeFormValues }) => {
      await api.patch(`/challenges/${id}`, buildPayload(values));
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); setEditChallenge(null); toast.success('Challenge updated'); },
    onError: () => toast.error('Failed to update challenge'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/challenges/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); setDeleteId(null); toast.success('Challenge deleted'); },
    onError: () => toast.error('Failed to delete challenge'),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Challenges</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{challenges?.length ?? 0} challenges</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Challenge
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Create Challenge</DialogTitle></DialogHeader>
            <ChallengeForm onSubmit={(v) => createMutation.mutate(v)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search challenges…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
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
          {isError && <div className="py-8 text-center text-sm text-destructive">Failed to load challenges.</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : challenges?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-xs truncate">{c.title}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{c.category}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[c.difficulty] ?? 'bg-muted'}`}>
                          {c.difficulty}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.durationDays}d</TableCell>
                      <TableCell>+{c.xpReward} XP</TableCell>
                      <TableCell>
                        {c.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditChallenge(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!isLoading && !isError && !challenges?.length && (
            <div className="py-12 text-center text-sm text-muted-foreground">No challenges found.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editChallenge} onOpenChange={(o) => { if (!o) setEditChallenge(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Challenge</DialogTitle></DialogHeader>
          {editChallenge && (
            <ChallengeForm
              defaultValues={{
                title: editChallenge.title,
                description: editChallenge.description,
                category: editChallenge.category,
                difficulty: editChallenge.difficulty,
                xpReward: editChallenge.xpReward,
                durationDays: editChallenge.durationDays,
                tipsText: Array.isArray(editChallenge.tips) ? editChallenge.tips.join('\n') : '',
              }}
              onSubmit={(v) => updateMutation.mutate({ id: editChallenge.id, values: v })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Challenge</DialogTitle></DialogHeader>
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

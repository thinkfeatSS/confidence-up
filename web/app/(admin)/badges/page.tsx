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
  BADGE_TIERS,
  BADGE_CATEGORIES,
  tierBadgeColors,
  unwrapList,
} from '@/lib/constants';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  category: string;
  xpReward: number;
  isActive: boolean;
  criteria: Record<string, unknown> | string;
}

const badgeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  icon: z.string().min(1, 'Icon is required'),
  tier: z.string().min(1, 'Tier is required'),
  category: z.string().min(1, 'Category is required'),
  xpReward: z.number().min(0, 'XP reward must be non-negative'),
  criteria: z.string().min(1, 'Criteria JSON is required'),
});

type BadgeFormValues = z.infer<typeof badgeSchema>;

function toCriteriaString(criteria: BadgeItem['criteria']): string {
  if (typeof criteria === 'string') return criteria;
  return JSON.stringify(criteria ?? { type: 'challenges_completed', value: 1 }, null, 2);
}

function buildPayload(values: BadgeFormValues) {
  let criteria: Record<string, unknown>;
  try {
    criteria = JSON.parse(values.criteria);
  } catch {
    throw new Error('Invalid criteria JSON');
  }
  return {
    name: values.name,
    description: values.description,
    icon: values.icon,
    tier: values.tier,
    category: values.category,
    xpReward: values.xpReward,
    criteria,
  };
}

function BadgeForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<BadgeFormValues>;
  onSubmit: (values: BadgeFormValues) => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BadgeFormValues>({
    resolver: zodResolver(badgeSchema),
    defaultValues: {
      criteria: '{"type": "challenges_completed", "value": 1}',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input {...register('name')} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Icon (emoji)</Label>
          <Input {...register('icon')} placeholder="🌱" />
          {errors.icon && (
            <p className="text-xs text-destructive">{errors.icon.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea {...register('description')} rows={2} />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Tier</Label>
          <FormSelect {...register('tier')} options={BADGE_TIERS} placeholder="Select tier" />
          {errors.tier && (
            <p className="text-xs text-destructive">{errors.tier.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <FormSelect {...register('category')} options={BADGE_CATEGORIES} placeholder="Select category" />
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>XP Reward</Label>
          <Input type="number" {...register('xpReward', { valueAsNumber: true })} />
          {errors.xpReward && (
            <p className="text-xs text-destructive">{errors.xpReward.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Criteria (JSON)</Label>
        <Textarea
          {...register('criteria')}
          className="font-mono text-xs"
          rows={4}
        />
        {errors.criteria && (
          <p className="text-xs text-destructive">{errors.criteria.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
          Save Badge
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function BadgesPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editBadge, setEditBadge] = useState<BadgeItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: badges, isLoading, isError } = useQuery<BadgeItem[]>({
    queryKey: ['badges'],
    queryFn: async () => {
      const res = await api.get('/badges/admin/all');
      return unwrapList<BadgeItem>(res.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: BadgeFormValues) => {
      await api.post('/badges', buildPayload(values));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['badges'] });
      setCreateOpen(false);
      toast.success('Badge created');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create badge'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: BadgeFormValues }) => {
      await api.patch(`/badges/${id}`, buildPayload(values));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['badges'] });
      setEditBadge(null);
      toast.success('Badge updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update badge'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/badges/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['badges'] });
      setDeleteId(null);
      toast.success('Badge deleted');
    },
    onError: () => toast.error('Failed to delete badge'),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Badges</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {badges?.length ?? 0} badges total
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Badge
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Badge</DialogTitle>
            </DialogHeader>
            <BadgeForm
              onSubmit={(v) => createMutation.mutate(v)}
              loading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isError && (
            <div className="py-8 text-center text-sm text-destructive">
              Failed to load badges. Check your login and API connection.
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Category</TableHead>
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
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : badges?.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{b.icon}</span>
                          <span className="font-medium">{b.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tierBadgeColors[b.tier] ?? 'bg-muted text-foreground'}`}
                        >
                          {b.tier}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                        {b.category}
                      </TableCell>
                      <TableCell>+{b.xpReward} XP</TableCell>
                      <TableCell>
                        {b.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditBadge(b)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(b.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!isLoading && !isError && !badges?.length && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No badges yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editBadge} onOpenChange={(o) => { if (!o) setEditBadge(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Badge</DialogTitle>
          </DialogHeader>
          {editBadge && (
            <BadgeForm
              defaultValues={{
                name: editBadge.name,
                description: editBadge.description,
                icon: editBadge.icon,
                tier: editBadge.tier,
                category: editBadge.category,
                xpReward: editBadge.xpReward,
                criteria: toCriteriaString(editBadge.criteria),
              }}
              onSubmit={(v) => updateMutation.mutate({ id: editBadge.id, values: v })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Badge</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

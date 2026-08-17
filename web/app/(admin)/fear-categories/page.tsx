'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '@/components/ui/form-select';
import { FEAR_COLORS, unwrapList } from '@/lib/constants';
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

interface FearLevel {
  id: string;
  levelNumber: number;
  title: string;
  description: string;
  xpReward: number;
}

interface FearCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  fearLevels: FearLevel[];
}

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().min(1, 'Color is required'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

function CategoryForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<CategoryFormValues>;
  onSubmit: (v: CategoryFormValues) => void;
  loading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { color: '#06B6D4', icon: '🎯', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Icon (emoji)</Label>
          <Input {...register('icon')} placeholder="🎤" />
          {errors.icon && <p className="text-xs text-destructive">{errors.icon.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Color</Label>
        <FormSelect {...register('color')} options={FEAR_COLORS} placeholder="Select color" />
        {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea {...register('description')} rows={2} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function FearCategoriesPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editCat, setEditCat] = useState<FearCategory | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: categories, isLoading, isError } = useQuery<FearCategory[]>({
    queryKey: ['fear-categories'],
    queryFn: async () => {
      const res = await api.get('/fears/admin/all');
      return unwrapList<FearCategory>(res.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (v: CategoryFormValues) => { await api.post('/fears', v); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fear-categories'] }); setCreateOpen(false); toast.success('Category created'); },
    onError: () => toast.error('Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CategoryFormValues }) => {
      await api.patch(`/fears/${id}`, values);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fear-categories'] }); setEditCat(null); toast.success('Category updated'); },
    onError: () => toast.error('Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/fears/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fear-categories'] }); setDeleteCatId(null); toast.success('Category deleted'); },
    onError: () => toast.error('Failed to delete category'),
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Fear Categories</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{categories?.length ?? 0} categories</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Category
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Category</DialogTitle></DialogHeader>
            <CategoryForm onSubmit={(v) => createMutation.mutate(v)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {isError && (
        <div className="py-4 text-center text-sm text-destructive">Failed to load fear categories.</div>
      )}

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))
          : categories?.map((cat) => {
              const expanded = expandedIds.has(cat.id);
              const levels = cat.fearLevels ?? [];
              return (
                <Card key={cat.id} className="shadow-sm">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <button
                        className="flex items-center gap-2 flex-1 text-left"
                        onClick={() => toggleExpand(cat.id)}
                      >
                        {expanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          {cat.icon}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{cat.name}</p>
                          {cat.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                          )}
                        </div>
                        <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {levels.length} levels
                        </span>
                      </button>
                      <div className="flex items-center gap-1 ml-2">
                        <Button size="icon-sm" variant="ghost" onClick={() => setEditCat(cat)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setDeleteCatId(cat.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {expanded && levels.length > 0 && (
                    <CardContent className="pt-0 pb-3">
                      <div className="border-t pt-3 space-y-2">
                        {[...levels]
                          .sort((a, b) => a.levelNumber - b.levelNumber)
                          .map((level) => (
                            <div key={level.id} className="flex items-start gap-3 px-2 py-2 bg-muted/50 rounded-lg">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">
                                {level.levelNumber}
                              </span>
                              <div>
                                <p className="text-sm font-medium">{level.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{level.description}</p>
                                <p className="text-xs text-primary mt-0.5">+{level.xpReward} XP</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
      </div>

      {!isLoading && !isError && !categories?.length && (
        <div className="py-16 text-center text-muted-foreground text-sm">No categories yet.</div>
      )}

      <Dialog open={!!editCat} onOpenChange={(o) => { if (!o) setEditCat(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          {editCat && (
            <CategoryForm
              defaultValues={{ name: editCat.name, description: editCat.description, icon: editCat.icon, color: editCat.color }}
              onSubmit={(v) => updateMutation.mutate({ id: editCat.id, values: v })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteCatId} onOpenChange={(o) => { if (!o) setDeleteCatId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Category</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete this category and all its levels?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCatId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteCatId && deleteMutation.mutate(deleteCatId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

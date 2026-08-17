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
import { SKILL_BRANCHES, SKILL_TIERS, unwrapList } from '@/lib/constants';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface SkillNode {
  id: string;
  name: string;
  branch: string;
  tier: number;
  xpRequired: number;
  parentNodeId: string | null;
  description: string;
  positionX?: number;
  positionY?: number;
}

const branchX: Record<string, number> = {
  speaking: 60,
  confidence: 160,
  communication: 260,
};

const nodeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  branch: z.string().min(1, 'Branch is required'),
  tier: z.string().min(1, 'Tier is required'),
  xpRequired: z.number().min(0),
  parentNodeId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
});

type NodeFormValues = z.infer<typeof nodeSchema>;

function buildPayload(values: NodeFormValues) {
  const tier = Number(values.tier);
  const branch = values.branch;
  return {
    name: values.name,
    description: values.description,
    branch,
    tier,
    xpRequired: values.xpRequired,
    parentNodeId: values.parentNodeId || undefined,
    positionX: branchX[branch] ?? 160,
    positionY: 600 - tier * 100,
  };
}

function NodeForm({
  defaultValues,
  nodes,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<NodeFormValues>;
  nodes: SkillNode[];
  onSubmit: (v: NodeFormValues) => void;
  loading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<NodeFormValues>({
    resolver: zodResolver(nodeSchema),
    defaultValues: { tier: '1', xpRequired: 0, ...defaultValues },
  });

  const tierOptions = SKILL_TIERS.map((t) => ({ value: String(t), label: `Tier ${t}` }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Branch</Label>
          <FormSelect {...register('branch')} options={SKILL_BRANCHES} />
          {errors.branch && <p className="text-xs text-destructive">{errors.branch.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tier</Label>
          <FormSelect {...register('tier')} options={tierOptions} />
        </div>
        <div className="space-y-1.5">
          <Label>XP Required</Label>
          <Input type="number" {...register('xpRequired')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Parent Node (optional)</Label>
        <FormSelect
          {...register('parentNodeId')}
          options={nodes.map((n) => ({ value: n.id, label: `${n.name} (T${n.tier})` }))}
          placeholder="None (root node)"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea {...register('description')} rows={2} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
          Save Node
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function SkillTreePage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editNode, setEditNode] = useState<SkillNode | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: nodes, isLoading, isError } = useQuery<SkillNode[]>({
    queryKey: ['skill-tree'],
    queryFn: async () => {
      const res = await api.get('/skill-tree/admin/all');
      return unwrapList<SkillNode>(res.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (v: NodeFormValues) => { await api.post('/skill-tree', buildPayload(v)); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skill-tree'] }); setCreateOpen(false); toast.success('Node created'); },
    onError: () => toast.error('Failed to create node'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: NodeFormValues }) => {
      await api.patch(`/skill-tree/${id}`, buildPayload(values));
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skill-tree'] }); setEditNode(null); toast.success('Node updated'); },
    onError: () => toast.error('Failed to update node'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/skill-tree/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skill-tree'] }); setDeleteId(null); toast.success('Node deleted'); },
    onError: () => toast.error('Failed to delete node'),
  });

  const parentName = (parentNodeId: string | null) =>
    nodes?.find((n) => n.id === parentNodeId)?.name ?? '—';

  const toFormValues = (node: SkillNode): Partial<NodeFormValues> => ({
    name: node.name,
    branch: node.branch,
    tier: String(node.tier),
    xpRequired: node.xpRequired,
    parentNodeId: node.parentNodeId ?? undefined,
    description: node.description,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Skill Tree</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{nodes?.length ?? 0} nodes</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Node
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Create Skill Node</DialogTitle></DialogHeader>
            <NodeForm nodes={nodes ?? []} onSubmit={(v) => createMutation.mutate(v)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isError && <div className="py-8 text-center text-sm text-destructive">Failed to load skill tree.</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>XP Required</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : nodes?.map((node) => (
                    <TableRow key={node.id}>
                      <TableCell className="font-medium">{node.name}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{node.branch}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          T{node.tier}
                        </span>
                      </TableCell>
                      <TableCell>{node.xpRequired?.toLocaleString()} XP</TableCell>
                      <TableCell className="text-muted-foreground">{parentName(node.parentNodeId)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditNode(node)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(node.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!isLoading && !isError && !nodes?.length && (
            <div className="py-12 text-center text-sm text-muted-foreground">No skill tree nodes yet.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editNode} onOpenChange={(o) => { if (!o) setEditNode(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Skill Node</DialogTitle></DialogHeader>
          {editNode && (
            <NodeForm
              nodes={(nodes ?? []).filter((n) => n.id !== editNode.id)}
              defaultValues={toFormValues(editNode)}
              onSubmit={(v) => updateMutation.mutate({ id: editNode.id, values: v })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Node</DialogTitle></DialogHeader>
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

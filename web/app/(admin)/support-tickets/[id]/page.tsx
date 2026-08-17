'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '@/components/ui/form-select';
import { ArrowLeft, User, Loader2 } from 'lucide-react';

interface TicketDetail {
  id: string;
  subject: string;
  body: string;
  status: string;
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
}

const responseSchema = z.object({
  adminResponse: z.string().min(1, 'Response is required'),
  status: z.string().min(1, 'Status is required'),
});

type ResponseFormValues = z.infer<typeof responseSchema>;

const statusStyles: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const statusOptions = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: ticket, isLoading, isError } = useQuery<TicketDetail>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await api.get<TicketDetail>(`/support/admin/tickets/${id}`);
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: { status: 'IN_PROGRESS' },
  });

  const respondMutation = useMutation({
    mutationFn: async (v: ResponseFormValues) => {
      await api.patch(`/support/admin/tickets/${id}`, v);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Response sent');
      reset({ adminResponse: '', status: 'RESOLVED' });
    },
    onError: () => toast.error('Failed to send response'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded-xl animate-pulse" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError || !ticket) {
    return <div className="text-center py-16 text-muted-foreground">Ticket not found.</div>;
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/support-tickets">
          <Button variant="ghost" size="icon-sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h2 className="text-2xl font-bold text-foreground">Support Ticket</h2>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-semibold">{ticket.subject}</CardTitle>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[ticket.status] ?? 'bg-muted'}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.body}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <User className="w-4 h-4" /> User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">{ticket.user.name}</p>
          <p className="text-xs text-muted-foreground">{ticket.user.email}</p>
        </CardContent>
      </Card>

      {ticket.adminResponse && (
        <Card className="shadow-sm border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Admin Response</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{ticket.adminResponse}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Updated {new Date(ticket.updatedAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Send Response</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => respondMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Response</Label>
              <Textarea {...register('adminResponse')} placeholder="Type your response…" rows={4} />
              {errors.adminResponse && <p className="text-xs text-destructive">{errors.adminResponse.message}</p>}
            </div>
            <div className="flex items-end gap-3">
              <div className="space-y-1.5 flex-1">
                <Label>Update Status</Label>
                <FormSelect {...register('status')} options={statusOptions} placeholder="Select status" />
              </div>
              <Button type="submit" disabled={respondMutation.isPending}>
                {respondMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
                Send
              </Button>
            </div>
            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

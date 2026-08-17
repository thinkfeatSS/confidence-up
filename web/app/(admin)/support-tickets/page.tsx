'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormSelect } from '@/components/ui/form-select';
import { unwrapPaginated } from '@/lib/constants';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  user?: { email: string; name: string };
}

const statusStyles: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function SupportTicketsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['support-tickets', page, statusFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/support/admin/tickets', { params });
      return unwrapPaginated<SupportTicket>(res.data);
    },
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Support Tickets</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} tickets</p>
        </div>
        <FormSelect
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          options={statusOptions}
          placeholder="All Statuses"
          className="w-auto min-w-[160px]"
        />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isError && <div className="py-8 text-center text-sm text-destructive">Failed to load tickets.</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.items?.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell className="text-muted-foreground">{ticket.user?.email ?? '—'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[ticket.status] ?? 'bg-muted'}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/support-tickets/${ticket.id}`}>
                          <Button size="icon-sm" variant="ghost"><Eye className="w-3.5 h-3.5" /></Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!isLoading && !isError && !data?.items?.length && (
            <div className="py-12 text-center text-sm text-muted-foreground">No tickets found.</div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

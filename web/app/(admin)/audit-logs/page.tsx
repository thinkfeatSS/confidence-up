'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
import { Card, CardContent } from '@/components/ui/card';
import { unwrapPaginated } from '@/lib/constants';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  createdAt: string;
  admin?: { name: string; email: string };
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [adminSearch, setAdminSearch] = useState('');
  const limit = 25;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-logs', page, adminSearch],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (adminSearch) params.adminId = adminSearch;
      const res = await api.get('/audit/logs', { params });
      return unwrapPaginated<AuditLog>(res.data);
    },
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Audit Logs</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} entries</p>
        </div>
        <div className="relative w-60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter by admin ID…"
            value={adminSearch}
            onChange={(e) => { setAdminSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isError && <div className="py-8 text-center text-sm text-destructive">Failed to load audit logs.</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Type</TableHead>
                <TableHead>Target ID</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.items?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.admin?.name ?? log.admin?.email ?? '—'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{log.targetType}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs truncate max-w-[120px]">
                        {log.targetId || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!isLoading && !isError && !data?.items?.length && (
            <div className="py-12 text-center text-sm text-muted-foreground">No audit logs found.</div>
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

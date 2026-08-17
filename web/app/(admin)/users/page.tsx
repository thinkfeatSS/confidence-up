'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ChevronLeft, ChevronRight, Eye, Ban, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  createdAt: string;
  isBlocked: boolean;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isBlockedFilter, setIsBlockedFilter] = useState<string>('');
  const limit = 20;

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['users', page, search, isBlockedFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (isBlockedFilter !== '') params.isBlocked = isBlockedFilter;
      const res = await api.get<UsersResponse>('/users/admin', { params });
      return res.data;
    },
  });

  const blockMutation = useMutation({
    mutationFn: async ({ id, block }: { id: string; block: boolean }) => {
      await api.patch(`/users/admin/${id}/${block ? 'block' : 'unblock'}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
    },
    onError: () => toast.error('Failed to update user'),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Users</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.total ?? 0} total users
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-[#1a1a2e] border-white/10">
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 bg-white/5 border-white/10 h-9"
              />
            </div>
            <select
              value={isBlockedFilter}
              onChange={(e) => { setIsBlockedFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-white/10 bg-white/5 text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="">All Users</option>
              <option value="false">Active</option>
              <option value="true">Blocked</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#1a1a2e] border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Level</TableHead>
                <TableHead className="text-muted-foreground">XP</TableHead>
                <TableHead className="text-muted-foreground">Streak</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-white/10">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-white/10 rounded animate-pulse w-16" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.data?.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <TableCell className="font-medium text-foreground">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {user.level}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {user.xp?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {user.streak}d
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.isBlocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/users/${user.id}`}>
                            <Button size="icon-sm" variant="ghost">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() =>
                              blockMutation.mutate({
                                id: user.id,
                                block: !user.isBlocked,
                              })
                            }
                            className={
                              user.isBlocked
                                ? 'text-emerald-400 hover:text-emerald-300'
                                : 'text-destructive hover:text-destructive/80'
                            }
                          >
                            {user.isBlocked ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {!isLoading && !data?.data?.length && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No users found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="border-white/10 bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="border-white/10 bg-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

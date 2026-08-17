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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { unwrapPaginated } from '@/lib/constants';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: { email: string; name: string };
}

interface AggregateData {
  averageRating: number;
  totalCount: number;
  ratingDistribution: Record<number, number>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
        />
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: listData, isLoading, isError } = useQuery({
    queryKey: ['feedback', page],
    queryFn: async () => {
      const res = await api.get('/feedback/admin', { params: { page, limit } });
      return unwrapPaginated<FeedbackItem>(res.data);
    },
  });

  const { data: aggregate } = useQuery<AggregateData>({
    queryKey: ['feedback-aggregate'],
    queryFn: async () => {
      const res = await api.get<AggregateData>('/feedback/admin/aggregate');
      return res.data;
    },
  });

  const totalPages = Math.ceil((listData?.total ?? 0) / limit);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Feedback</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{listData?.total ?? 0} entries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-primary">
                {isLoading ? '—' : (aggregate?.averageRating?.toFixed(1) ?? '—')}
              </span>
              <div>
                {aggregate?.averageRating != null && (
                  <StarRating rating={Math.round(aggregate.averageRating)} />
                )}
                <p className="text-xs text-muted-foreground mt-0.5">out of 5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = aggregate?.ratingDistribution?.[star] ?? 0;
                  const total = aggregate?.totalCount ?? 1;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{star}★</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isError && <div className="py-8 text-center text-sm text-destructive">Failed to load feedback.</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : listData?.items?.map((fb) => (
                    <TableRow key={fb.id}>
                      <TableCell className="text-muted-foreground">{fb.user?.email ?? '—'}</TableCell>
                      <TableCell><StarRating rating={fb.rating} /></TableCell>
                      <TableCell className="max-w-sm truncate">{fb.comment || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!isLoading && !isError && !listData?.items?.length && (
            <div className="py-12 text-center text-sm text-muted-foreground">No feedback yet.</div>
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

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { unwrapList } from '../utils/apiHelpers';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  expiresAt?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

const normalizeAnnouncementType = (type: unknown): Announcement['type'] => {
  const t = String(type ?? 'info').toLowerCase();
  if (t === 'warning' || t === 'update') return t === 'update' ? 'info' : 'warning';
  if (t === 'success' || t === 'promo') return t;
  return 'info';
};

const fetchActiveAnnouncements = async (): Promise<Announcement[]> => {
  const res = await apiClient.get<any, any>('/announcements/active');
  return unwrapList<any>(res).map((a: any): Announcement => ({
    id: a.id,
    title: a.title,
    body: a.body ?? a.message ?? '',
    type: normalizeAnnouncementType(a.type),
    expiresAt: a.endsAt ?? a.expiresAt,
    ctaLabel: a.ctaLabel,
    ctaUrl: a.ctaUrl,
  }));
};

export const useAnnouncements = () =>
  useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: fetchActiveAnnouncements,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

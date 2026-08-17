import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { SkillNode, SkillBranch } from '../types';
import { useUser } from './useUser';

const normalizeBranch = (branch: string): SkillBranch => {
  const b = branch.toLowerCase();
  if (b.includes('confidence')) return 'confidence';
  if (b.includes('communication')) return 'communication';
  return 'speaking';
};

const mapSkillNode = (n: any, userXp: number): SkillNode => {
  const unlocked = n.isUnlocked ?? n.unlocked ?? false;
  const canUnlock = n.canUnlock ?? (!(n.isUnlocked ?? n.unlocked) && userXp >= (n.xpRequired ?? 0));
  const available = n.available ?? canUnlock;

  return {
    id: n.id,
    title: n.name ?? n.title ?? '',
    description: n.description ?? '',
    branch: normalizeBranch(n.branch ?? 'speaking'),
    nodeLevel: n.tier ?? n.nodeLevel ?? 1,
    unlocked,
    available,
    canUnlock,
    blockReason: n.blockReason ?? null,
    requirement: n.blockReason ?? (n.xpRequired ? `${n.xpRequired} XP required` : (n.requirement ?? '')),
    requirementProgress: Math.min(userXp, n.xpRequired ?? 0),
    requirementTotal: n.xpRequired ?? 100,
    x: n.positionX ?? n.x ?? 60,
    y: n.positionY ?? n.y ?? 100,
  };
};

const fetchSkillTree = async (userXp: number): Promise<SkillNode[]> => {
  const res = await apiClient.get<any, any>('/skill-tree');
  const branches = unwrapApiData<Record<string, any[]>>(res);
  const nodes: SkillNode[] = [];

  for (const branchNodes of Object.values(branches ?? {})) {
    if (!Array.isArray(branchNodes)) continue;
    for (const n of branchNodes) {
      nodes.push(mapSkillNode(n, userXp));
    }
  }

  return nodes;
};

export const useSkillTree = () => {
  const { data: user } = useUser();
  const userXp = user?.totalXP ?? 0;

  return useQuery({
    queryKey: ['skill-tree', userXp],
    queryFn: () => fetchSkillTree(userXp),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUnlockSkillNode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nodeId: string) => {
      const res = await apiClient.post<any, any>(`/skill-tree/${nodeId}/unlock`);
      return unwrapApiData<any>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-tree'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

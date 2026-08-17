import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { mockSkillTree, SKILL_TREE_CANVAS } from '../../data/mockSkillTree';
import { useSkillTree, useUnlockSkillNode } from '../../hooks/useSkillTree';
import { SkillNode } from '../../types';

type Props = StackScreenProps<MainStackParamList, 'SkillTree'>;

const NODE_R = 22;

export const SkillTreeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const branchColors: Record<string, string> = {
    speaking: colors.accentCyan,
    confidence: colors.accentPurpleLight,
    communication: colors.xpGold,
  };
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const { data: apiNodes, refetch } = useSkillTree();
  const unlockNode = useUnlockSkillNode();

  const nodes = apiNodes?.length ? apiNodes : mockSkillTree;

  // Build edges: connect consecutive nodes in same branch
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; color: string }> = [];
  const branches = ['speaking', 'confidence', 'communication'];
  branches.forEach(branch => {
    const branchNodes = nodes.filter(n => n.branch === branch).sort((a, b) => a.nodeLevel - b.nodeLevel);
    for (let i = 0; i < branchNodes.length - 1; i++) {
      edges.push({
        x1: branchNodes[i].x,
        y1: branchNodes[i].y,
        x2: branchNodes[i + 1].x,
        y2: branchNodes[i + 1].y,
        color: branchColors[branch],
      });
    }
  });

  const handlePrimaryAction = async () => {
    if (!selectedNode) return;

    if (selectedNode.unlocked) {
      navigation.navigate('Tabs', {
        screen: 'Practice',
        params: { prompt: `${selectedNode.title}: ${selectedNode.description}` },
      });
      setSelectedNode(null);
      return;
    }

    if (selectedNode.canUnlock) {
      try {
        const result = await unlockNode.mutateAsync(selectedNode.id);
        if (result?.success === false) {
          Alert.alert('Cannot unlock', result.message ?? 'Requirements not met.');
          return;
        }
        Alert.alert('Unlocked!', `${selectedNode.title} is now available.`);
        await refetch();
        setSelectedNode(null);
      } catch (err: any) {
        Alert.alert('Error', err?.message ?? 'Failed to unlock skill.');
      }
      return;
    }

    setSelectedNode(null);
  };

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>🗺️ Skill Tree</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Legend */}
        <View style={styles.legend}>
          {branches.map(b => (
            <View key={b} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: branchColors[b] }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{b.charAt(0).toUpperCase() + b.slice(1)}</Text>
            </View>
          ))}
        </View>

        {/* SVG Canvas */}
        <GlassCard noPadding style={styles.canvasCard}>
          <Svg width={SKILL_TREE_CANVAS.width} height={SKILL_TREE_CANVAS.height} style={styles.canvas}>
            {/* Edges */}
            {edges.map((e, i) => (
              <Line
                key={i}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={e.color}
                strokeWidth={2}
                strokeOpacity={0.4}
                strokeDasharray="5,4"
              />
            ))}
            {/* Nodes */}
            {nodes.map(node => {
              const color = branchColors[node.branch];
              const isLocked = !node.unlocked && !node.available;
              return (
                <React.Fragment key={node.id}>
                  {node.unlocked && (
                    <Circle
                      cx={node.x}
                      cy={node.y}
                      r={NODE_R + 6}
                      fill={color}
                      opacity={0.12}
                    />
                  )}
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_R}
                    fill={node.unlocked ? color + '30' : (node.available ? color + '15' : colors.bgCard)}
                    stroke={node.unlocked ? color : (node.available ? color + '80' : colors.border)}
                    strokeWidth={node.unlocked ? 2.5 : 1.5}
                    onPress={() => setSelectedNode(node)}
                  />
                  <SvgText
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    fill={isLocked ? colors.textMuted : colors.textPrimary}
                    fontSize={14}>
                    {isLocked ? '🔒' : node.unlocked ? '✅' : '○'}
                  </SvgText>
                  <SvgText
                    x={node.x}
                    y={node.y + NODE_R + 14}
                    textAnchor="middle"
                    fill={isLocked ? colors.textMuted : colors.textSecondary}
                    fontSize={9}>
                    {node.title.length > 10 ? node.title.slice(0, 10) + '…' : node.title}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </GlassCard>

        {/* Branch Labels */}
        <View style={styles.branchLabels}>
          {branches.map(b => (
            <View key={b} style={styles.branchLabel}>
              <Text style={[styles.branchTitle, { color: branchColors[b] }]}>
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </Text>
              <Text style={[styles.branchCount, { color: colors.textMuted }]}>
                {nodes.filter(n => n.branch === b && n.unlocked).length}/{nodes.filter(n => n.branch === b).length} unlocked
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Node Detail Sheet */}
      <Modal visible={!!selectedNode} transparent animationType="slide" onRequestClose={() => setSelectedNode(null)}>
        <TouchableOpacity style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setSelectedNode(null)} activeOpacity={1} />
        {selectedNode && (
          <View style={[styles.sheet, { backgroundColor: colors.bgSecondary, borderTopColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetMeta}>
              <View style={[styles.branchPill, { backgroundColor: branchColors[selectedNode.branch] + '20', borderColor: branchColors[selectedNode.branch] + '50' }]}>
                <Text style={[styles.branchPillText, { color: branchColors[selectedNode.branch] }]}>
                  {selectedNode.branch}
                </Text>
              </View>
              <Text style={[styles.nodeLevelText, { color: colors.textMuted }]}>Level {selectedNode.nodeLevel}</Text>
            </View>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{selectedNode.title}</Text>
            <Text style={[styles.sheetDesc, { color: colors.textSecondary }]}>{selectedNode.description}</Text>
            {selectedNode.requirement && (
              <Text style={[styles.requirementText, { color: colors.xpGold }]}>
                📋 {selectedNode.blockReason ?? selectedNode.requirement}
                {selectedNode.requirementTotal && !selectedNode.blockReason
                  ? ` (${selectedNode.requirementProgress ?? 0}/${selectedNode.requirementTotal})`
                  : ''}
              </Text>
            )}
            <PrimaryButton
              label={
                selectedNode.unlocked
                  ? 'Start Practice →'
                  : selectedNode.canUnlock
                    ? 'Unlock Skill'
                    : selectedNode.available
                      ? 'Requirements not met'
                      : '🔒 Locked'
              }
              onPress={handlePrimaryAction}
              loading={unlockNode.isPending}
              variant={selectedNode.unlocked ? 'primary' : selectedNode.canUnlock ? 'primary' : 'outline'}
            />
          </View>
        )}
      </Modal>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 22 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.lg, paddingBottom: 60 },
  legend: { flexDirection: 'row', gap: Spacing.lg, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '500' },
  canvasCard: { alignSelf: 'center' },
  canvas: {},
  branchLabels: { flexDirection: 'row', justifyContent: 'space-around' },
  branchLabel: { alignItems: 'center', gap: 4 },
  branchTitle: { fontSize: 13, fontWeight: '700' },
  branchCount: { fontSize: 11 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    paddingBottom: 40,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center' },
  sheetMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  branchPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  branchPillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  nodeLevelText: { fontSize: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetDesc: { ...(Typography.body as object), lineHeight: 24 },
  requirementText: { ...(Typography.bodySmall as object) },
});

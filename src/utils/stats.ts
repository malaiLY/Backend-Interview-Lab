import type { Question, Module, StudyStatus } from '@/types/question';

// ==================== 类型 ====================

interface HasStatus {
  status: string;
}

export interface ModuleStat {
  module: Module;
  total: number;
  known: number;
  vague: number;
  unknown: number;
  newCount: number;
  mastered: number;
  rate: number; // 0-1
}

export interface GlobalStat {
  total: number;
  known: number;
  vague: number;
  unknown: number;
  mastered: number;
  newCount: number;
  byModule: ModuleStat[];
}

// ==================== 单模块统计 ====================

export function calcModuleStat(
  module: Module,
  questions: Question[],
  progressMap: Record<string, HasStatus>,
): ModuleStat {
  const qs = questions.filter((q) => q.module === module);
  let known = 0, vague = 0, unknown = 0, mastered = 0, newCount = 0;

  for (const q of qs) {
    const s = (progressMap[q.id]?.status ?? 'new') as StudyStatus;
    if (s === 'new')     { newCount++; unknown++; continue; }
    if (s === 'mastered') { mastered++; known++; continue; }
    if (s === 'known')   { known++; continue; }
    if (s === 'vague')   { vague++; continue; }
    unknown++;
  }

  return {
    module,
    total: qs.length,
    known,
    vague,
    unknown,
    newCount,
    mastered,
    rate: qs.length > 0 ? known / qs.length : 0,
  };
}

// ==================== 全局统计 ====================

export function calcGlobalStat(
  questions: Question[],
  progressMap: Record<string, HasStatus>,
): GlobalStat {
  const modules = [...new Set(questions.map((q) => q.module))];
  const byModule = modules.map((m) => calcModuleStat(m, questions, progressMap));

  return {
    total: questions.length,
    known:    byModule.reduce((s, m) => s + m.known, 0),
    vague:    byModule.reduce((s, m) => s + m.vague, 0),
    unknown:  byModule.reduce((s, m) => s + m.unknown, 0),
    mastered: byModule.reduce((s, m) => s + m.mastered, 0),
    newCount: byModule.reduce((s, m) => s + m.newCount, 0),
    byModule,
  };
}

// ==================== 推荐复习 ====================

export function getRecommendedReview(
  questions: Question[],
  progressMap: Record<string, HasStatus>,
  count = 5,
): Question[] {
  const scored = questions.map((q) => {
    const s = progressMap[q.id]?.status ?? 'new';
    let score = 0;
    if (s === 'unknown')  score = 4;
    else if (s === 'vague') score = 3;
    else if (q.difficulty === '高' && s !== 'mastered') score = 2;
    else if (s === 'new') score = 1;
    return { q, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || Math.random() - 0.5)
    .slice(0, count)
    .map((s) => s.q);
}

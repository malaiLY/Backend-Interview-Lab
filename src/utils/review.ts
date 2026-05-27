import type { Question, Difficulty } from '@/types/question';

const HIGH_DIFFICULTY: Difficulty = '高';

interface HasStatus {
  status: string;
}

/**
 * 构建复习队列：
 * 1. unknown + vague 优先
 * 2. 不足 count 条时，补充 difficulty=高 的题
 * 3. 剩余名额由 new 填充
 * 4. 随机打乱
 */
export function buildReviewQueue(
  questions: Question[],
  progressMap: Record<string, HasStatus>,
  count = 20,
): Question[] {
  const unknown: Question[] = [];
  const vague: Question[] = [];
  const hard: Question[] = [];
  const fresh: Question[] = [];

  for (const q of questions) {
    const status = progressMap[q.id]?.status ?? 'new';
    if (status === 'unknown') { unknown.push(q); continue; }
    if (status === 'vague')  { vague.push(q);  continue; }
    if (q.difficulty === HIGH_DIFFICULTY && status !== 'mastered') { hard.push(q); continue; }
    if (status === 'new')    { fresh.push(q); }
  }

  shuffle(unknown);
  shuffle(vague);
  shuffle(hard);
  shuffle(fresh);

  const merged = [...unknown, ...vague, ...hard, ...fresh];

  const seen = new Set<string>();
  const result: Question[] = [];
  for (const q of merged) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    result.push(q);
    if (result.length >= count) break;
  }
  return result;
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

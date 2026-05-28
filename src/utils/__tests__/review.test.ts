import { describe, it, expect } from 'vitest';
import { buildReviewQueue } from '../review';
import type { Question } from '@/types/question';

const makeQ = (id: string, difficulty: Question['difficulty'] = '中'): Question => ({
  id,
  module: 'JavaSE',
  title: id,
  difficulty,
  tags: [],
  answer: 'answer',
  summary: 'summary',
  source: 'test',
  relatedQuestionIds: [],
});

describe('buildReviewQueue', () => {
  it('unknown 优先于 vague', () => {
    const qs = [makeQ('a'), makeQ('b'), makeQ('c')];
    const pm = { a: { status: 'vague' }, b: { status: 'unknown' }, c: { status: 'new' } };
    const queue = buildReviewQueue(qs, pm, 10);
    expect(queue[0]!.id).toBe('b');
    expect(queue[1]!.id).toBe('a');
  });

  it('高难度新题优先进于普通新题', () => {
    const qs = [makeQ('easy', '低'), makeQ('hard', '高')];
    const queue = buildReviewQueue(qs, {}, 10);
    expect(queue[0]!.id).toBe('hard');
  });

  it('mastered 的高难度不进 hard 队列', () => {
    const qs = [makeQ('m', '高'), makeQ('n')];
    const pm = { m: { status: 'mastered' } };
    const queue = buildReviewQueue(qs, pm, 10);
    // m 是 mastered 高难度，不进 hard；n 是 new 低难度进 fresh
    expect(queue).toHaveLength(1);
    expect(queue[0]!.id).toBe('n');
  });

  it('结果不超过 count', () => {
    const qs = Array.from({ length: 50 }, (_, i) => makeQ(`q${i}`));
    const queue = buildReviewQueue(qs, {}, 5);
    expect(queue).toHaveLength(5);
  });

  it('无重复 id', () => {
    const qs = Array.from({ length: 20 }, (_, i) => makeQ(`q${i}`));
    const queue = buildReviewQueue(qs, {}, 20);
    const ids = new Set(queue.map((q) => q.id));
    expect(ids.size).toBe(queue.length);
  });
});

import { describe, it, expect } from 'vitest';
import { calcModuleStat, calcGlobalStat } from '../stats';
import type { Question } from '@/types/question';

const makeQ = (id: string, module: string): Question => ({
  id,
  module: module as Question['module'],
  title: id,
  difficulty: '中',
  tags: [],
  answer: 'answer',
  summary: 'summary',
  source: 'test',
  relatedQuestionIds: [],
});

describe('calcModuleStat', () => {
  const questions = [makeQ('a', 'JavaSE'), makeQ('b', 'JavaSE'), makeQ('c', 'JavaSE')];

  it('new 计入 newCount，不计入 unknown', () => {
    const stat = calcModuleStat('JavaSE', questions, {});
    expect(stat.newCount).toBe(3);
    expect(stat.unknown).toBe(0);
    expect(stat.known).toBe(0);
  });

  it('mastered 和 known 互斥统计', () => {
    const pm = { a: { status: 'mastered' } };
    const stat = calcModuleStat('JavaSE', questions, pm);
    expect(stat.mastered).toBe(1);
    expect(stat.known).toBe(0);
    expect(stat.newCount).toBe(2);
  });

  it('rate = (known + mastered) / total', () => {
    const pm = { a: { status: 'known' }, b: { status: 'mastered' } };
    const stat = calcModuleStat('JavaSE', questions, pm);
    expect(stat.rate).toBeCloseTo(2 / 3);
  });

  it('vague 独立计数', () => {
    const pm = { a: { status: 'vague' } };
    const stat = calcModuleStat('JavaSE', questions, pm);
    expect(stat.vague).toBe(1);
    expect(stat.known).toBe(0);
    expect(stat.unknown).toBe(0);
    expect(stat.newCount).toBe(2);
  });
});

describe('calcGlobalStat', () => {
  it('聚合各模块统计', () => {
    const qs = [makeQ('a', 'JavaSE'), makeQ('b', 'JUC')];
    const pm = { a: { status: 'known' } };
    const stat = calcGlobalStat(qs, pm);
    expect(stat.total).toBe(2);
    expect(stat.known).toBe(1);
    expect(stat.newCount).toBe(1);
    expect(stat.byModule).toHaveLength(2);
  });
});

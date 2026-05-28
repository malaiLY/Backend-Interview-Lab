import { describe, it, expect } from 'vitest';
import { filterQuestions } from '../search';
import type { Question } from '@/types/question';
import type { StudyStatus } from '@/types/question';

const makeQ = (id: string, module: string, difficulty: Question['difficulty'] = '中'): Question => ({
  id,
  module: module as Question['module'],
  title: `${id} title`,
  difficulty,
  tags: [],
  answer: 'answer about HashMap and collections',
  summary: 'summary',
  source: 'test',
  relatedQuestionIds: [],
});

const qs: Question[] = [
  makeQ('a', 'JavaSE', '低'),
  makeQ('b', 'JUC', '高'),
  makeQ('c', 'MySQL', '中'),
];

const getStatus = (id: string): StudyStatus => {
  const map: Record<string, StudyStatus> = { a: 'known', b: 'vague' };
  return map[id] ?? 'new';
};

describe('filterQuestions', () => {
  it('空筛选返回全部', () => {
    const result = filterQuestions(qs, { keyword: '', module: '', difficulty: '', status: '' }, getStatus);
    expect(result).toHaveLength(3);
  });

  it('按模块筛选', () => {
    const result = filterQuestions(qs, { keyword: '', module: 'JUC', difficulty: '', status: '' }, getStatus);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('b');
  });

  it('按难度筛选', () => {
    const result = filterQuestions(qs, { keyword: '', module: '', difficulty: '高', status: '' }, getStatus);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('b');
  });

  it('按状态筛选', () => {
    const result = filterQuestions(qs, { keyword: '', module: '', difficulty: '', status: 'vague' }, getStatus);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('b');
  });

  it('组合筛选：模块 + 难度', () => {
    const result = filterQuestions(qs, { keyword: '', module: 'JavaSE', difficulty: '低', status: '' }, getStatus);
    expect(result).toHaveLength(1);
  });

  it('关键词搜索命中', () => {
    const result = filterQuestions(qs, { keyword: 'HashMap', module: '', difficulty: '', status: '' }, getStatus);
    expect(result.length).toBeGreaterThan(0);
  });
});

import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Question, Module, Difficulty } from '@/types/question';
import type { StudyStatus } from '@/types/question';

// ==================== Fuse 搜索 ====================

const fuseOptions: IFuseOptions<Question> = {
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'answer', weight: 0.3 },
    { name: 'summary', weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
};

let fuseSource: Question[] | null = null;
let fuseInstance: Fuse<Question> | null = null;

export function getFuse(questions: Question[]): Fuse<Question> {
  if (fuseSource !== questions) {
    fuseSource = questions;
    fuseInstance = new Fuse(questions, fuseOptions);
  }
  return fuseInstance!;
}

export function searchQuestions(questions: Question[], keyword: string): Question[] {
  if (!keyword.trim()) return questions;
  return getFuse(questions).search(keyword).map((r) => r.item);
}

// ==================== 组合筛选 ====================

export interface QuestionFilters {
  keyword: string;
  module: Module | '';
  difficulty: Difficulty | '';
  status: StudyStatus | '';
}

export function filterQuestions(
  questions: Question[],
  filters: QuestionFilters,
  getStatus: (id: string) => StudyStatus,
): Question[] {
  let result = questions;

  // 1. 关键词搜索
  if (filters.keyword.trim()) {
    result = searchQuestions(result, filters.keyword);
  }

  // 2. 模块筛选
  if (filters.module) {
    result = result.filter((q) => q.module === filters.module);
  }

  // 3. 难度筛选
  if (filters.difficulty) {
    result = result.filter((q) => q.difficulty === filters.difficulty);
  }

  // 4. 状态筛选
  if (filters.status) {
    result = result.filter((q) => getStatus(q.id) === filters.status);
  }

  return result;
}

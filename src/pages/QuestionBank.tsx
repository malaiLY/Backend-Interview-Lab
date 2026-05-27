import { useState, useMemo } from 'react';
import questionsData from '@/data/questions.json';
import type { Question, Module, Difficulty, StudyStatus } from '@/types/question';
import { MODULES } from '@/types/question';
import { useStudyStore } from '@/store/useStudyStore';
import { filterQuestions, type QuestionFilters } from '@/utils/search';
import QuestionCard from '@/components/QuestionCard';

const questions = questionsData as Question[];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: '低', label: '简单' },
  { value: '中', label: '中等' },
  { value: '高', label: '困难' },
];

const STATUSES: { value: StudyStatus; label: string }[] = [
  { value: 'new',     label: '未学习' },
  { value: 'known',   label: '我会' },
  { value: 'vague',   label: '模糊' },
  { value: 'unknown', label: '不会' },
  { value: 'mastered',label: '已掌握' },
];

export default function QuestionBank() {
  const getQuestionStatus = useStudyStore((s) => s.getQuestionStatus);

  const [filters, setFilters] = useState<QuestionFilters>({
    keyword: '',
    module: '',
    difficulty: '',
    status: '',
  });

  const set = <K extends keyof QuestionFilters>(key: K, value: QuestionFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const filtered = useMemo(
    () => filterQuestions(questions, filters, getQuestionStatus),
    [filters, getQuestionStatus],
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">题库</h1>

      {/* 搜索 + 筛选栏 */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="搜索题目..."
          value={filters.keyword}
          onChange={(e) => set('keyword', e.target.value)}
          className="flex-1 min-w-[200px] h-10 bg-white border border-gray-200 rounded-lg px-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
        />
        <select
          value={filters.module}
          onChange={(e) => set('module', e.target.value as Module | '')}
          className="h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-blue-400 transition-colors"
        >
          <option value="">全部模块</option>
          {MODULES.map((m) => (
            <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
          ))}
        </select>
        <select
          value={filters.difficulty}
          onChange={(e) => set('difficulty', e.target.value as Difficulty | '')}
          className="h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-blue-400 transition-colors"
        >
          <option value="">全部难度</option>
          {DIFFICULTIES.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => set('status', e.target.value as StudyStatus | '')}
          className="h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-blue-400 transition-colors"
        >
          <option value="">全部状态</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* 结果统计 */}
      <div className="text-sm text-gray-500">
        共 {filtered.length} 道题
      </div>

      {/* 题目列表 */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              status={getQuestionStatus(q.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-gray-500 font-medium">没有找到匹配的题目</div>
          <div className="text-sm text-gray-400 mt-1">试试调整搜索关键词或筛选条件</div>
        </div>
      )}
    </div>
  );
}

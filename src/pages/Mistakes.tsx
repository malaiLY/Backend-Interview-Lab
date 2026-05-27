import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import questionsData from '@/data/questions.json';
import type { Question, Module, StudyStatus } from '@/types/question';
import { MODULES } from '@/types/question';
import { useStudyStore } from '@/store/useStudyStore';
import QuestionCard from '@/components/QuestionCard';

const questions = questionsData as Question[];

type StatusFilter = 'all' | 'unknown' | 'vague';

export default function Mistakes() {
  const navigate = useNavigate();
  const progressMap = useStudyStore((s) => s.progressMap);

  const [module, setModule] = useState<Module | ''>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // 错题列表（unknown + vague）
  const mistakes = useMemo(() => {
    return questions.filter((q) => {
      const s = progressMap[q.id]?.status;
      if (s !== 'unknown' && s !== 'vague') return false;
      if (module && q.module !== module) return false;
      if (statusFilter !== 'all' && s !== statusFilter) return false;
      return true;
    });
  }, [progressMap, module, statusFilter]);

  // 统计
  const unknownCount = useMemo(
    () => questions.filter((q) => progressMap[q.id]?.status === 'unknown').length,
    [progressMap],
  );
  const vagueCount = useMemo(
    () => questions.filter((q) => progressMap[q.id]?.status === 'vague').length,
    [progressMap],
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">错题本</h1>
        {mistakes.length > 0 && (
          <button
            onClick={() => navigate('/review')}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            开始错题复习
          </button>
        )}
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* 状态筛选 */}
        <div className="flex gap-2">
          {([['all', '全部'], ['unknown', `不会 (${unknownCount})`], ['vague', `模糊 (${vagueCount})`]] as const).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === key
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>

        {/* 模块筛选 */}
        <select
          value={module}
          onChange={(e) => setModule(e.target.value as Module | '')}
          className="h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-blue-400 transition-colors"
        >
          <option value="">全部模块</option>
          {MODULES.map((m) => (
            <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
          ))}
        </select>
      </div>

      {/* 列表 / 空状态 */}
      {mistakes.length > 0 ? (
        <div className="space-y-3">
          {mistakes.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              status={progressMap[q.id]!.status as StudyStatus}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <div className="text-lg font-medium text-gray-700 mb-2">没有错题，继续保持！</div>
          <div className="text-sm text-gray-400">
            在题库或复习中标记"不会"或"模糊"的题目会出现在这里
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import questionsData from '@/data/questions.json';
import type { Question } from '@/types/question';
import { useStudyStore } from '@/store/useStudyStore';
import { calcGlobalStat, getRecommendedReview } from '@/utils/stats';

const questions = questionsData as Question[];

// ==================== 样式常量 ====================

const STAT_CARDS = [
  { key: 'total',    label: '总题数', color: 'bg-blue-50 text-blue-700',   border: 'border-blue-100' },
  { key: 'mastered', label: '已掌握', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100' },
  { key: 'known',    label: '我会',   color: 'bg-green-50 text-green-700', border: 'border-green-100' },
  { key: 'vague',    label: '模糊',   color: 'bg-yellow-50 text-yellow-700', border: 'border-yellow-100' },
  { key: 'unknown',  label: '不会',   color: 'bg-red-50 text-red-700',    border: 'border-red-100' },
  { key: 'newCount', label: '未学习', color: 'bg-gray-50 text-gray-600',  border: 'border-gray-200' },
] as const;

const BAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#f97316', '#22c55e',
  '#06b6d4', '#ef4444', '#eab308', '#6366f1',
];

// ==================== 页面 ====================

export default function Dashboard() {
  const progressMap = useStudyStore((s) => s.progressMap);

  const stat = useMemo(() => calcGlobalStat(questions, progressMap), [progressMap]);
  const recommended = useMemo(() => getRecommendedReview(questions, progressMap), [progressMap]);

  // Recharts 数据
  const chartData = useMemo(
    () =>
      stat.byModule.map((m) => ({
        name: m.module,
        rate: Math.round(m.rate * 100),
        total: m.total,
        known: m.known,
      })),
    [stat.byModule],
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`rounded-xl p-4 border ${card.color} ${card.border}`}
          >
            <div className="text-xs opacity-70">{card.label}</div>
            <div className="text-2xl font-bold mt-1">{stat[card.key]}</div>
          </div>
        ))}
      </div>

      {/* 模块掌握率图表 */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">模块掌握率</h2>
        {stat.total > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip
                formatter={(value: number, _name: string, item: { payload?: { total?: number; known?: number } }) => [
                  `${value}%  (${item.payload?.known ?? 0}/${item.payload?.total ?? 0})`,
                  '掌握率',
                ]}
              />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((_entry, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            开始学习后这里会显示掌握率图表
          </div>
        )}
      </section>

      {/* 各模块详情卡片 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">各模块进度</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stat.byModule.map((m) => (
            <div
              key={m.module}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow transition-shadow"
            >
              <div className="font-medium text-gray-800 mb-2">{m.module}</div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(m.rate * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{m.known} / {m.total} 题</span>
                <span>{Math.round(m.rate * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 今日推荐 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">今日推荐复习</h2>
          {recommended.length > 0 && (
            <Link to="/review" className="text-sm text-blue-600 hover:underline">
              开始复习 →
            </Link>
          )}
        </div>
        {recommended.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommended.map((q) => {
              const s = progressMap[q.id]?.status;
              return (
                <Link
                  key={q.id}
                  to={`/questions/${q.id}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {q.module}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      q.difficulty === '高' ? 'bg-red-50 text-red-700' :
                      q.difficulty === '中' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {q.difficulty}
                    </span>
                    {s && s !== 'new' && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ml-auto ${
                        s === 'unknown' ? 'bg-red-50 text-red-600' :
                        s === 'vague'   ? 'bg-yellow-50 text-yellow-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {s === 'unknown' ? '不会' : s === 'vague' ? '模糊' : s === 'known' ? '我会' : '已掌握'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-800 line-clamp-2">
                    {q.title}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl py-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-gray-600 font-medium">全部掌握，没有需要复习的题目</div>
          </div>
        )}
      </section>

      {/* 快捷入口 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">快速开始</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link to="/review" className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:shadow transition-all text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="font-medium">题卡复习</div>
          </Link>
          <Link to="/questions" className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:shadow transition-all text-center">
            <div className="text-2xl mb-2">📚</div>
            <div className="font-medium">浏览题库</div>
          </Link>
          <Link to="/interview" className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:shadow transition-all text-center">
            <div className="text-2xl mb-2">🎤</div>
            <div className="font-medium">模拟面试</div>
          </Link>
        </div>
      </section>
    </div>
  );
}

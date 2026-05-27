import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import questionsData from '@/data/questions.json';
import type { Question, Module, Difficulty, StudyStatus } from '@/types/question';
import { MODULES } from '@/types/question';
import { useStudyStore } from '@/store/useStudyStore';
import { loadInterviewHistory, saveInterviewHistory, type InterviewRecord } from '@/utils/interviewHistory';

const questions = questionsData as Question[];

// ==================== 类型 ====================

type Assessment = 'known' | 'vague' | 'unknown';
type Phase = 'config' | 'session' | 'report';

interface Answer {
  assessment: Assessment;
  timeSpent: number; // 秒
}

const ASSESS_MAP: Record<Assessment, StudyStatus> = {
  known: 'known',
  vague: 'vague',
  unknown: 'unknown',
};

const ASSESS_LABEL: Record<Assessment, string> = {
  known: '会',
  vague: '模糊',
  unknown: '不会',
};

const ASSESS_STYLE: Record<Assessment, string> = {
  known:   'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
  vague:   'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
  unknown: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
};

const DIFFICULTIES: { value: Difficulty | ''; label: string }[] = [
  { value: '',  label: '全部' },
  { value: '高', label: '高' },
  { value: '中', label: '中' },
  { value: '低', label: '低' },
];

const COUNTS = [5, 10, 20];

// ==================== 工具函数 ====================

function shufflePick<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i]!, copy[j]!] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, count);
}

// ==================== 页面 ====================

export default function Interview() {
  const markQuestionStatus = useStudyStore((s) => s.markQuestionStatus);

  // 配置
  const [selectedModule, setSelectedModule] = useState<Module | ''>('');
  const [selectedDiff, setSelectedDiff] = useState<Difficulty | ''>('');
  const [count, setCount] = useState(5);

  // 会话
  const [phase, setPhase] = useState<Phase>('config');
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [startTime, setStartTime] = useState(0);
  const [history, setHistory] = useState<InterviewRecord[]>(loadInterviewHistory);

  // 当前题
  const current: Question | undefined = queue[index];

  // 开始面试
  const handleStart = () => {
    let pool = questions;
    if (selectedModule) pool = pool.filter((q) => q.module === selectedModule);
    if (selectedDiff)   pool = pool.filter((q) => q.difficulty === selectedDiff);

    const picked = shufflePick(pool, count);
    if (picked.length === 0) return;

    setQueue(picked);
    setIndex(0);
    setShowAnswer(false);
    setAnswers({});
    setStartTime(Date.now());
    setPhase('session');
  };

  // 自评
  const handleAssess = (assessment: Assessment) => {
    if (!current) return;

    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    // 保存答案
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { assessment, timeSpent: elapsed },
    }));

    // 同步到学习状态
    markQuestionStatus(current.id, ASSESS_MAP[assessment]);

    // 下一题或结束
    if (index + 1 >= queue.length) {
      setPhase('report');
    } else {
      setIndex((i) => i + 1);
      setShowAnswer(false);
      setStartTime(Date.now());
    }
  };

  // 完成后保存历史
  useEffect(() => {
    if (phase !== 'report') return;
    const record: InterviewRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('zh-CN'),
      total: queue.length,
      known:   Object.values(answers).filter((a) => a.assessment === 'known').length,
      vague:   Object.values(answers).filter((a) => a.assessment === 'vague').length,
      unknown: Object.values(answers).filter((a) => a.assessment === 'unknown').length,
    };
    const updated = saveInterviewHistory(record);
    setHistory(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ==================== 配置阶段 ====================

  if (phase === 'config') {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-800">模拟面试</h1>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-700">面试配置</h2>

          {/* 模块 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">模块</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedModule('')}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  selectedModule === '' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600 hover:border-blue-400'
                }`}
              >
                全部
              </button>
              {MODULES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModule(m.id)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    selectedModule === m.id ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600 hover:border-blue-400'
                  }`}
                >
                  {m.icon} {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* 难度 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">难度</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.label}
                  onClick={() => setSelectedDiff(d.value)}
                  className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    selectedDiff === d.value ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600 hover:border-blue-400'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* 数量 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">题目数量</label>
            <div className="flex gap-2">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-5 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    count === n ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600 hover:border-blue-400'
                  }`}
                >
                  {n} 题
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            开始面试
          </button>
        </div>

        {/* 历史记录 */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">历史记录</h2>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{h.date}</span>
                  <span className="text-gray-800 font-medium">{h.total} 题</span>
                  <span className="text-green-600">会 {h.known}</span>
                  <span className="text-yellow-600">模糊 {h.vague}</span>
                  <span className="text-red-600">不会 {h.unknown}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
              暂无面试记录
            </div>
          )}
        </section>
      </div>
    );
  }

  // ==================== 答题阶段 ====================

  if (phase === 'session' && current) {
    const progress = (index / queue.length) * 100;

    const diffStyle =
      current.difficulty === '高' ? 'bg-red-50 text-red-700' :
      current.difficulty === '中' ? 'bg-yellow-50 text-yellow-700' :
      'bg-green-50 text-green-700';

    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">模拟面试</h1>
          <span className="text-sm text-gray-400">{index + 1} / {queue.length}</span>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 题卡 */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 pt-5">
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
              {current.module}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${diffStyle}`}>
              {current.difficulty}
            </span>
          </div>

          <div className="px-6 py-4">
            <p className="text-lg font-medium text-gray-800 leading-relaxed">
              {current.title}
            </p>
            {current.tags.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {current.tags.map((tag) => (
                  <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {showAnswer ? (
            <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50">
              <article className="markdown-body prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {current.answer}
                </ReactMarkdown>
              </article>
            </div>
          ) : (
            <div className="border-t border-gray-100 px-6 py-6 text-center">
              <button
                onClick={() => setShowAnswer(true)}
                className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                查看答案
              </button>
            </div>
          )}
        </div>

        {/* 自评按钮 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 mr-1">自评：</span>
          {(['known', 'vague', 'unknown'] as Assessment[]).map((a) => (
            <button
              key={a}
              onClick={() => handleAssess(a)}
              className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${ASSESS_STYLE[a]}`}
            >
              {ASSESS_LABEL[a]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ==================== 报告阶段 ====================

  if (phase === 'report') {
    const known   = Object.values(answers).filter((a) => a.assessment === 'known').length;
    const vague   = Object.values(answers).filter((a) => a.assessment === 'vague').length;
    const unknown = Object.values(answers).filter((a) => a.assessment === 'unknown').length;
    const total   = queue.length;
    const score   = total > 0 ? Math.round((known / total) * 100) : 0;

    // 薄弱模块
    const weakMap: Record<string, { total: number; unknown: number }> = {};
    for (const q of queue) {
      const a = answers[q.id];
      if (!a) continue;
      if (!weakMap[q.module]) weakMap[q.module] = { total: 0, unknown: 0 };
      weakMap[q.module]!.total++;
      if (a.assessment === 'unknown') weakMap[q.module]!.unknown++;
    }
    const weakModules = Object.entries(weakMap)
      .filter(([, v]) => v.unknown > 0)
      .sort((a, b) => b[1].unknown - a[1].unknown)
      .map(([mod, v]) => ({ module: mod, ...v }));

    // 推荐复习：本次标记为 vague/unknown 的题
    const reviewQuestions = queue.filter((q) => {
      const a = answers[q.id];
      return a && (a.assessment === 'vague' || a.assessment === 'unknown');
    });

    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-800">面试报告</h1>

        {/* 得分概览 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center space-y-2">
          <div className="text-5xl font-bold text-blue-600">{score}%</div>
          <div className="text-sm text-gray-500">掌握率（会 / 总数）</div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{known}</div>
            <div className="text-xs text-green-600 mt-1">会</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{vague}</div>
            <div className="text-xs text-yellow-600 mt-1">模糊</div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{unknown}</div>
            <div className="text-xs text-red-600 mt-1">不会</div>
          </div>
        </div>

        {/* 薄弱模块 */}
        {weakModules.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">薄弱模块</h2>
            <div className="space-y-2">
              {weakModules.map((w) => (
                <div key={w.module} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="font-medium text-gray-800">{w.module}</span>
                  <span className="text-sm text-red-600">{w.unknown} / {w.total} 不会</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 推荐复习 */}
        {reviewQuestions.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">推荐复习</h2>
            <div className="space-y-2">
              {reviewQuestions.map((q) => (
                <Link
                  key={q.id}
                  to={`/questions/${q.id}`}
                  className="block bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{q.module}</span>
                    <span className="text-sm font-medium text-gray-800 truncate">{q.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 操作 */}
        <div className="flex gap-3">
          <button
            onClick={() => setPhase('config')}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            再来一次
          </button>
          <Link
            to="/review"
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center"
          >
            去复习错题
          </Link>
        </div>
      </div>
    );
  }

  // fallback
  return null;
}

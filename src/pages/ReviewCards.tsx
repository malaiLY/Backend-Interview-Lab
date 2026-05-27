import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import questionsData from '@/data/questions.json';
import type { Question, StudyStatus } from '@/types/question';
import { useStudyStore } from '@/store/useStudyStore';
import { buildReviewQueue } from '@/utils/review';
import StatusButtons from '@/components/StatusButtons';

const questions = questionsData as Question[];
const QUEUE_SIZE = 20;

export default function ReviewCards() {
  const progressMap = useStudyStore((s) => s.progressMap);
  const markQuestionStatus = useStudyStore((s) => s.markQuestionStatus);
  const getQuestionStatus = useStudyStore((s) => s.getQuestionStatus);

  const [round, setRound] = useState(0);
  const [queue, setQueue] = useState<Question[]>(() =>
    buildReviewQueue(questions, progressMap, QUEUE_SIZE),
  );
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // round=0 是初始态，懒初始化已处理；round>0 时重建队列
  useEffect(() => {
    if (round === 0) return;
    setQueue(buildReviewQueue(questions, progressMap, QUEUE_SIZE));
    setIndex(0);
    setShowAnswer(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const isFinished = index >= queue.length;
  const current: Question | undefined = queue[index];

  const handleSelect = useCallback(
    (status: StudyStatus) => {
      if (!current || isAdvancing) return;
      setIsAdvancing(true);
      markQuestionStatus(current.id, status);
      setShowAnswer(false);
      setIndex((i) => i + 1);
      requestAnimationFrame(() => setIsAdvancing(false));
    },
    [current, markQuestionStatus, isAdvancing],
  );

  const handleRestart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setShowAnswer(false);
    setIsAdvancing(false);
  };

  // ===== 空状态 =====
  if (queue.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">题卡复习</h1>
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <div className="text-gray-600 font-medium mb-2">暂无可复习的题目</div>
          <div className="text-sm text-gray-400">题库尚未加载或所有题目已掌握</div>
        </div>
      </div>
    );
  }

  // ===== 完成 =====
  if (isFinished || !current) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">题卡复习</h1>
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <div className="text-xl font-semibold text-gray-700">本轮复习完成！</div>
          <div className="text-gray-500">共复习了 {queue.length} 道题</div>
          <button
            onClick={handleRestart}
            className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            再来一轮
          </button>
        </div>
      </div>
    );
  }

  // ===== 复习中 =====
  const status = getQuestionStatus(current.id);
  const progress = (index / queue.length) * 100;

  const diffStyle =
    current.difficulty === '高' ? 'bg-red-50 text-red-700' :
    current.difficulty === '中' ? 'bg-yellow-50 text-yellow-700' :
    'bg-green-50 text-green-700';

  const statusLabel: Record<StudyStatus, string> = {
    new: '未学习', known: '我会', vague: '模糊', unknown: '不会', mastered: '已掌握',
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">题卡复习</h1>
        <button
          onClick={handleRestart}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          重新开始
        </button>
      </div>

      {/* 进度条 */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 font-medium tabular-nums w-20">
          已完成 {index}/{queue.length}
        </span>
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 题卡 */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* 卡片信息栏 */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-2">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
            {current.module}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded ${diffStyle}`}>
            {current.difficulty}
          </span>
          {status !== 'new' && (
            <span className="text-xs text-gray-400 ml-auto">
              上次：{statusLabel[status]}
            </span>
          )}
        </div>

        {/* 题目 */}
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

        {/* 答案 / 查看按钮 */}
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

      {/* 标记按钮 */}
      <StatusButtons current={status} onSelect={handleSelect} disabled={isAdvancing} />
    </div>
  );
}

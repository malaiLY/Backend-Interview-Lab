import { useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import questionsData from '@/data/questions.json';
import type { Question, StudyStatus } from '@/types/question';
import { useStudyStore } from '@/store/useStudyStore';
import StatusButtons from '@/components/StatusButtons';

const questions = questionsData as Question[];

// ==================== 样式映射 ====================

const DIFFICULTY_STYLE: Record<string, string> = {
  '低': 'bg-green-50 text-green-700',
  '中': 'bg-yellow-50 text-yellow-700',
  '高': 'bg-red-50 text-red-700',
};

// ==================== 页面 ====================

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();

  const question = useMemo(() => questions.find((q) => q.id === id), [id]);

  const getQuestionStatus = useStudyStore((s) => s.getQuestionStatus);
  const setQuestionStatus = useStudyStore((s) => s.setQuestionStatus);

  const currentStatus = id ? getQuestionStatus(id) : 'new';

  // 标记反馈
  const [flash, setFlash] = useState(false);

  const handleSelect = (status: StudyStatus) => {
    if (!id || status === currentStatus) return;
    setQuestionStatus(id, status);
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

  // ===== 404 =====
  if (!question) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link to="/questions" className="text-sm text-blue-600 hover:underline">← 返回题库</Link>
        <div className="mt-16 text-center">
          <div className="text-5xl mb-4">🤔</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">题目不存在</div>
          <div className="text-gray-400">可能已被删除或链接有误</div>
        </div>
      </div>
    );
  }

  // ===== 正常渲染 =====
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* 返回 */}
      <Link to="/questions" className="inline-block text-sm text-blue-600 hover:underline">
        ← 返回题库
      </Link>

      {/* 头部 */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-gray-800 leading-relaxed">
          {question.title}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
            {question.module}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_STYLE[question.difficulty]}`}>
            {question.difficulty}
          </span>
          {question.tags.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 一句话总结 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        💡 {question.summary}
      </div>

      {/* 答案 */}
      <div className={`bg-white border rounded-xl p-6 transition-all ${flash ? 'border-blue-400 shadow-md' : 'border-gray-200'}`}>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">参考答案</h2>
        <article className="markdown-body prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {question.answer}
          </ReactMarkdown>
        </article>
      </div>

      {/* 状态按钮 */}
      <div className={`transition-all ${flash ? 'scale-[1.02]' : ''}`}>
        <StatusButtons current={currentStatus} onSelect={handleSelect} />
      </div>

      {/* 当前状态提示 */}
      {currentStatus !== 'new' && (
        <div className="text-xs text-gray-400">
          当前状态已保存，返回题库可查看
        </div>
      )}
    </div>
  );
}

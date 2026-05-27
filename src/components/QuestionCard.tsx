import { Link } from 'react-router-dom';
import type { Question, StudyStatus } from '@/types/question';

// ==================== 样式映射 ====================

const DIFFICULTY_STYLE: Record<string, string> = {
  '低': 'bg-green-50 text-green-700',
  '中': 'bg-yellow-50 text-yellow-700',
  '高': 'bg-red-50 text-red-700',
};

const STATUS_STYLE: Record<StudyStatus, string> = {
  new:     'bg-gray-100 text-gray-500',
  known:   'bg-green-50 text-green-700',
  vague:   'bg-yellow-50 text-yellow-700',
  unknown: 'bg-red-50 text-red-700',
  mastered:'bg-blue-50 text-blue-700',
};

const STATUS_LABEL: Record<StudyStatus, string> = {
  new:     '未学习',
  known:   '我会',
  vague:   '模糊',
  unknown: '不会',
  mastered:'已掌握',
};

// ==================== 组件 ====================

interface Props {
  question: Question;
  status: StudyStatus;
}

export default function QuestionCard({ question, status }: Props) {
  return (
    <Link
      to={`/questions/${question.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between gap-4">
        {/* 左侧：模块 + 标题 + 标签 */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
            {question.module}
          </span>
          <span className="font-medium text-gray-800 truncate">{question.title}</span>
        </div>

        {/* 右侧：难度 + 状态 */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_STYLE[question.difficulty]}`}>
            {question.difficulty}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLE[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      {/* 标签行 */}
      {question.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          {question.tags.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

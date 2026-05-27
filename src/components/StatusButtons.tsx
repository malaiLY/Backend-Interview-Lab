import type { StudyStatus } from '@/types/question';

// ==================== 配置 ====================

interface ButtonDef {
  status: StudyStatus;
  label: string;
  icon: string;
  base: string;
  active: string;
}

const BUTTONS: ButtonDef[] = [
  { status: 'known',    label: '我会',   icon: '✓', base: 'bg-green-50 text-green-700 border-green-200',   active: 'bg-green-600 text-white border-green-600' },
  { status: 'vague',    label: '模糊',   icon: '?', base: 'bg-yellow-50 text-yellow-700 border-yellow-200', active: 'bg-yellow-500 text-white border-yellow-500' },
  { status: 'unknown',  label: '不会',   icon: '✗', base: 'bg-red-50 text-red-700 border-red-200',         active: 'bg-red-600 text-white border-red-600' },
  { status: 'mastered', label: '已掌握', icon: '★', base: 'bg-blue-50 text-blue-700 border-blue-200',      active: 'bg-blue-600 text-white border-blue-600' },
];

// ==================== 组件 ====================

interface Props {
  current: StudyStatus;
  onSelect: (status: StudyStatus) => void;
}

export default function StatusButtons({ current, onSelect }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 mr-1">我的掌握：</span>
      {BUTTONS.map((btn) => {
        const isActive = current === btn.status;
        return (
          <button
            key={btn.status}
            onClick={() => onSelect(btn.status)}
            className={`
              px-4 py-2 rounded-lg border text-sm font-medium transition-all
              ${isActive ? btn.active : btn.base}
              ${isActive ? 'shadow-sm scale-105' : 'hover:shadow-sm'}
            `}
          >
            {btn.icon} {btn.label}
          </button>
        );
      })}
    </div>
  );
}

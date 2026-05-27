import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard', icon: '📊' },
  { to: '/questions', label: '题库',      icon: '📚' },
  { to: '/review',    label: '题卡复习',  icon: '🔄' },
  { to: '/mistakes',  label: '错题本',    icon: '❌' },
  { to: '/interview', label: '模拟面试',  icon: '🎤' },
];

interface Props {
  onClose: () => void;
}

export default function Sidebar({ onClose }: Props) {
  return (
    <aside className="h-full w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
        <span className="text-lg font-bold text-gray-800">Interview Lab</span>
        <button
          className="lg:hidden p-1 rounded text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* 导航 */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* 底部 */}
      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
        v0.1.0
      </div>
    </aside>
  );
}

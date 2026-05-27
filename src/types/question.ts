// ==================== 枚举 ====================

/** 模块 */
export type Module =
  | 'JavaSE'
  | 'JUC'
  | 'JVM'
  | 'Spring'
  | 'MySQL'
  | 'Redis'
  | 'MQ'
  | 'Network';

/** 难度 */
export type Difficulty = '低' | '中' | '高';

/** 学习状态 */
export type StudyStatus = 'new' | 'known' | 'vague' | 'unknown' | 'mastered';

// ==================== 核心：题目 ====================

export interface Question {
  id: string;
  module: Module;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  answer: string;
  summary: string;
  source: string;
  relatedQuestionIds: string[];
}

// ==================== 模块元数据 ====================

export interface ModuleMeta {
  id: Module;
  name: string;
  icon: string;
}

export const MODULES: ModuleMeta[] = [
  { id: 'JavaSE',   name: 'JavaSE',   icon: '☕' },
  { id: 'JUC',      name: 'JUC 并发', icon: '🧵' },
  { id: 'JVM',      name: 'JVM',      icon: '⚙️' },
  { id: 'Spring',   name: 'Spring',   icon: '🌱' },
  { id: 'MySQL',    name: 'MySQL',    icon: '🐬' },
  { id: 'Redis',    name: 'Redis',    icon: '🔴' },
  { id: 'MQ',       name: '消息队列', icon: '📨' },
  { id: 'Network',  name: '计算机网络', icon: '🌐' },
];

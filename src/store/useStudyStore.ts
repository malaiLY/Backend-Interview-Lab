import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudyStatus } from '@/types/question';

// ==================== 类型 ====================

/** 单道题的学习进度 */
export interface Progress {
  status: StudyStatus;
  reviewCount: number;
  wrongCount: number;
  lastReviewedAt: string;
}

interface StudyState {
  /** questionId → 进度 */
  progressMap: Record<string, Progress>;

  /** 标记题目状态，自动 +1 reviewCount，unknown/vague 同时 +1 wrongCount */
  markQuestionStatus: (questionId: string, status: StudyStatus) => void;

  /** 获取题目当前状态，未操作过返回 'new' */
  getQuestionStatus: (questionId: string) => StudyStatus;

  /** 获取完整进度记录 */
  getProgress: (questionId: string) => Progress;

  /** 单独 +1 复习次数 */
  incrementReviewCount: (questionId: string) => void;

  /** 单独 +1 错误次数 */
  incrementWrongCount: (questionId: string) => void;

  /** 重置全部进度 */
  resetProgress: () => void;
}

// ==================== 初始值 ====================

function defaultProgress(): Progress {
  return {
    status: 'new',
    reviewCount: 0,
    wrongCount: 0,
    lastReviewedAt: '',
  };
}

const INITIAL_STATE: Pick<StudyState, 'progressMap'> = {
  progressMap: {},
};

// ==================== Store ====================

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      markQuestionStatus: (questionId, status) =>
        set((state) => {
          const prev = state.progressMap[questionId] ?? defaultProgress();
          return {
            progressMap: {
              ...state.progressMap,
              [questionId]: {
                status: prev.status === status ? prev.status : status,
                reviewCount: prev.reviewCount + 1,
                wrongCount:
                  prev.wrongCount + (status === 'unknown' || status === 'vague' ? 1 : 0),
                lastReviewedAt: new Date().toISOString(),
              },
            },
          };
        }),

      getQuestionStatus: (questionId) =>
        get().progressMap[questionId]?.status ?? 'new',

      getProgress: (questionId) =>
        get().progressMap[questionId] ?? defaultProgress(),

      incrementReviewCount: (questionId) =>
        set((state) => {
          const prev = state.progressMap[questionId] ?? defaultProgress();
          return {
            progressMap: {
              ...state.progressMap,
              [questionId]: { ...prev, reviewCount: prev.reviewCount + 1 },
            },
          };
        }),

      incrementWrongCount: (questionId) =>
        set((state) => {
          const prev = state.progressMap[questionId] ?? defaultProgress();
          return {
            progressMap: {
              ...state.progressMap,
              [questionId]: { ...prev, wrongCount: prev.wrongCount + 1 },
            },
          };
        }),

      resetProgress: () => set(INITIAL_STATE),
    }),
    {
      name: 'interview-lab-progress',
      // 只持久化 progressMap，不持久化函数
      partialize: (state) => ({ progressMap: state.progressMap }),
    },
  ),
);

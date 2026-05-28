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

  /** 只设置状态，不计复习次数（详情页手动标记用） */
  setQuestionStatus: (questionId: string, status: StudyStatus) => void;

  /** 记录一次复习结果，同时更新状态（题卡/面试用） */
  recordReviewResult: (questionId: string, status: StudyStatus) => void;

  /** 获取题目当前状态，未操作过返回 'new' */
  getQuestionStatus: (questionId: string) => StudyStatus;

  /** 获取完整进度记录 */
  getProgress: (questionId: string) => Progress;

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

      setQuestionStatus: (questionId, status) =>
        set((state) => {
          const prev = state.progressMap[questionId] ?? defaultProgress();
          if (prev.status === status) return state;
          return {
            progressMap: {
              ...state.progressMap,
              [questionId]: { ...prev, status, lastReviewedAt: new Date().toISOString() },
            },
          };
        }),

      recordReviewResult: (questionId, status) =>
        set((state) => {
          const prev = state.progressMap[questionId] ?? defaultProgress();
          return {
            progressMap: {
              ...state.progressMap,
              [questionId]: {
                status,
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

      resetProgress: () => set(INITIAL_STATE),
    }),
    {
      name: 'interview-lab-progress',
      partialize: (state) => ({ progressMap: state.progressMap }),
    },
  ),
);

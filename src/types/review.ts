import type { StudyStatus } from './question';

/** 单条复习记录 — 每次复习一道题产生一条 */
export interface ReviewRecord {
  questionId: string;
  status: StudyStatus;
  reviewCount: number;
  wrongCount: number;
  lastReviewedAt: string;
}

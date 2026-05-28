import { describe, it, expect, beforeEach } from 'vitest';
import { useStudyStore } from '../useStudyStore';

beforeEach(() => {
  useStudyStore.setState({ progressMap: {} });
});

describe('useStudyStore', () => {
  it('setQuestionStatus 更新状态但不计 reviewCount', () => {
    const store = useStudyStore.getState();
    store.setQuestionStatus('q1', 'known');
    const p = useStudyStore.getState().getProgress('q1');
    expect(p.status).toBe('known');
    expect(p.reviewCount).toBe(0);
  });

  it('setQuestionStatus 同状态不更新', () => {
    const store = useStudyStore.getState();
    store.setQuestionStatus('q1', 'known');
    store.setQuestionStatus('q1', 'known');
    expect(useStudyStore.getState().getProgress('q1').status).toBe('known');
  });

  it('recordReviewResult 更新状态并计 reviewCount', () => {
    const store = useStudyStore.getState();
    store.recordReviewResult('q1', 'unknown');
    const p = useStudyStore.getState().getProgress('q1');
    expect(p.status).toBe('unknown');
    expect(p.reviewCount).toBe(1);
    expect(p.wrongCount).toBe(1);
  });

  it('recordReviewResult 同状态仍计 reviewCount', () => {
    const store = useStudyStore.getState();
    store.recordReviewResult('q1', 'unknown');
    store.recordReviewResult('q1', 'unknown');
    expect(useStudyStore.getState().getProgress('q1').reviewCount).toBe(2);
  });

  it('recordReviewResult known 不计 wrongCount', () => {
    const store = useStudyStore.getState();
    store.recordReviewResult('q1', 'known');
    expect(useStudyStore.getState().getProgress('q1').wrongCount).toBe(0);
  });

  it('resetProgress 清空所有进度', () => {
    useStudyStore.getState().setQuestionStatus('q1', 'known');
    useStudyStore.getState().resetProgress();
    expect(useStudyStore.getState().progressMap).toEqual({});
  });
});

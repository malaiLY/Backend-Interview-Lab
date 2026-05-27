/** 单题作答 */
export interface InterviewAnswer {
  questionId: string;
  selfScore: number;   // 1-5 自评
  timeSpent: number;   // 秒
  note: string;
}

/** 模拟面试会话 */
export interface InterviewSession {
  id: string;
  questionIds: string[];
  answers: Record<string, InterviewAnswer>;
  startedAt: string;
  endedAt: string;
  summary: {
    totalQuestions: number;
    answeredCount: number;
    avgScore: number;
    totalTime: number;  // 秒
  };
}

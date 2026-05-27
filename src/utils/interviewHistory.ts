const HISTORY_KEY = 'interview-lab-history';
const MAX_HISTORY = 20;

export interface InterviewRecord {
  id: string;
  date: string;
  total: number;
  known: number;
  vague: number;
  unknown: number;
}

export function loadInterviewHistory(): InterviewRecord[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveInterviewHistory(record: InterviewRecord): InterviewRecord[] {
  const history = loadInterviewHistory();
  const updated = [record, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

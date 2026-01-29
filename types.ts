
export interface StudyContent {
  text: string;
  sourceType: 'pdf' | 'image' | 'text';
  summary?: string;
  keyPoints?: string[];
  insights?: string;
}

export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CBTData {
  questions: Question[];
}

export interface TestAttempt {
  id?: string;
  userId: string;
  sourceType: string;
  originalContentSnippet: string;
  summary: string;
  keyPoints: string[];
  questionCount: number;
  questions: Question[];
  userAnswers: number[];
  score: number;
  totalMarks: number;
  timeAllowed: number;
  timeSpent: number;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

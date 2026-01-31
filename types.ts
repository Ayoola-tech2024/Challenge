
export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudySession {
  id?: string;
  userId: string;
  sourceType: 'pdf' | 'image' | 'text';
  title: string;
  summary: string;
  keyPoints: string[];
  insights: string;
  questions: Question[];
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

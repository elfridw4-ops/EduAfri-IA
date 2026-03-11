export type ContentType = 
  | "lesson_plan" 
  | "exercises" 
  | "quiz" 
  | "simplification" 
  | "activity" 
  | "evaluation" 
  | "revision_sheet";

export interface PedagogicalContent {
  id: string;
  userId: string;
  type: ContentType;
  title: string;
  subject: string;
  level: string;
  country: string;
  content: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "teacher" | "admin";
  createdAt: string;
}

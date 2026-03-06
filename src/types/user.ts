export type UserRole = 'teacher' | 'admin';
export type TeacherType = 'lead' | 'assistant';

export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  teacherType: TeacherType;
  approved: boolean;
  createdAt: number;
}

export interface AuthSession {
  userId: string;
  username: string;
  displayName: string;
  role: UserRole;
  approved: boolean;
}

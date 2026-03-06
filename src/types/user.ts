export type UserRole = 'teacher' | 'admin';

export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  createdAt: number;
}

export interface AuthSession {
  userId: string;
  username: string;
  displayName: string;
  role: UserRole;
}

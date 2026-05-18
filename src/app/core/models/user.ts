export type Role = 'admin' | 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

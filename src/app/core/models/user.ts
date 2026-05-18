import { ApiResponse, IsoDateString, PaginatedApiResponse, PaginationQuery } from './api-response';

export type Role = 'admin' | 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

export interface AuthUserData {
  user: User;
}

export type AuthUserResponse = ApiResponse<AuthUserData>;

export type UserResponse = ApiResponse<User>;

export type UsersResponse = PaginatedApiResponse<User>;

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

export interface UserListQuery extends PaginationQuery {
  search?: string;
  role?: Role;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: Role;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  role: Role;
  password?: string | null;
  password_confirmation?: string | null;
}

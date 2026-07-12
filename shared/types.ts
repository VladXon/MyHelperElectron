export interface User {
  id: number;
  login: string;
  name: string;
  email: string;
  is_dev: number;
  created_at: string;
}

export interface UserRow {
  id: number;
  login: string;
  name: string;
  email: string;
  password: string;
  is_dev: number;
  created_at: string;
}

export interface DataRecord {
  id: number;
  user_id: number;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: number;
  user_id: number;
  token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: Omit<UserRow, 'password'>;
}

export interface Note {
  id: number;
  user_id: number;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  completed: boolean;
  reminder_at: number | null;
  created_at: string;
  updated_at: string;
}

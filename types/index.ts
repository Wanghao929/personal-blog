export interface User {
  id: string;
  username: string;
  password: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

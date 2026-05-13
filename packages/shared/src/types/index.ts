export enum Module {
  CALENDAR = "CALENDAR",
  WORK = "WORK",
  TRAINING = "TRAINING",
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

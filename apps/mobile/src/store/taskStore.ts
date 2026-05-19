import { create } from 'zustand';

export interface Task {
  id: string;
  title: string;
  date: string;        // 'yyyy-MM-dd'
  completed: boolean;
  completedAt?: string;
  position: number;
  createdAt: string;
}

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  setTasks: (tasks: Task[]) => void;
  setLoading: (loading: boolean) => void;
  addTask: (task: Task) => void;
  updateTaskById: (id: string, task: Task) => void;
  removeTask: (id: string) => void;
  mergeTasksForDate: (date: string, newTasks: Task[]) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  isLoading: false,
  setTasks: (tasks) => set({ tasks }),
  setLoading: (isLoading) => set({ isLoading }),
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.position - b.position;
    }),
  })),
  updateTaskById: (id, task) => set((state) => ({
    tasks: state.tasks
      .map((t) => (t.id === id ? task : t))
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.position - b.position;
      }),
  })),
  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id),
  })),
  mergeTasksForDate: (date, newTasks) => set((state) => ({
    tasks: [
      ...state.tasks.filter((t) => t.date !== date),
      ...newTasks,
    ].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.position - b.position;
    }),
  })),
}));

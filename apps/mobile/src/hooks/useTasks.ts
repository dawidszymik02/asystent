import { useCallback } from 'react';
import { api } from '../lib/api';
import { useTaskStore, Task } from '../store/taskStore';

export const useTasks = () => {
  const { tasks, isLoading, addTask, updateTaskById, removeTask } = useTaskStore();

  const fetchTasks = useCallback(async (date: string): Promise<void> => {
    try {
      const response = await api.get('/tasks', { params: { date } });
      const fetched: Task[] = response.data.data ?? [];
      useTaskStore.getState().mergeTasksForDate(date, fetched);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  }, []);

  const createTask = useCallback(async (title: string, date: string): Promise<Task> => {
    const response = await api.post('/tasks', { title, date });
    const task: Task = response.data.data;
    addTask(task);
    return task;
  }, [addTask]);

  const updateTask = useCallback(async (id: string, data: Partial<Pick<Task, 'title' | 'date' | 'completed' | 'position'>>): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, data);
    const task: Task = response.data.data;
    updateTaskById(id, task);
    return task;
  }, [updateTaskById]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
    removeTask(id);
  }, [removeTask]);

  const toggleComplete = useCallback(async (id: string): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}/complete`);
    const task: Task = response.data.data;
    updateTaskById(id, task);
    return task;
  }, [updateTaskById]);

  return { tasks, isLoading, fetchTasks, createTask, updateTask, deleteTask, toggleComplete };
};

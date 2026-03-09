import type { Metadata } from 'next';
import { TodoApp } from '@/components/todo/TodoApp';

export const metadata: Metadata = {
  title: 'Goal Todos',
  description: 'Chat about your goals to generate actionable todos with time estimates and a built-in timer.',
};

export default function TodoPage() {
  return <TodoApp />;
}

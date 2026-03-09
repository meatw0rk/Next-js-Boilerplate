'use client';

import type { TodoItemData } from './TodoItem';
import { TodoItem } from './TodoItem';

type Props = {
  todos: TodoItemData[];
  onUpdate: (id: string, updates: Partial<TodoItemData>) => void;
  onDelete: (id: string) => void;
};

export function TodoList({ todos, onUpdate, onDelete }: Props) {
  if (todos.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-center">
        <p className="text-sm text-gray-400">No todos yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Chat about your goals to generate todo items
        </p>
      </div>
    );
  }

  const pending = todos.filter(t => !t.completed);
  const completed = todos.filter(t => t.completed);
  const totalEstimated = todos.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalElapsed = Math.floor(todos.reduce((sum, t) => sum + t.elapsedSeconds, 0) / 60);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {pending.length}
          {' '}
          remaining ·
          {' '}
          {completed.length}
          {' '}
          done
        </span>
        <span>
          {totalElapsed}
          /
          {totalEstimated}
          {' '}
          min spent
        </span>
      </div>

      {pending.map(todo => (
        <TodoItem
          key={todo.id}
          item={todo}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}

      {completed.length > 0 && (
        <>
          <p className="mt-2 text-xs font-medium text-gray-400">Completed</p>
          {completed.map(todo => (
            <TodoItem
              key={todo.id}
              item={todo}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </>
      )}
    </div>
  );
}

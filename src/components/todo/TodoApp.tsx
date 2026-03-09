'use client';

import type { ChatMessage } from './ChatInterface';
import type { TodoItemData } from './TodoItem';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatInterface } from './ChatInterface';
import { TodoList } from './TodoList';

type NewTodo = {
  title: string;
  description: string;
  estimatedMinutes: number;
};

type ApiResponse = {
  reply: string;
  todos: NewTodo[];
};

const STORAGE_KEY = 'todo-app-data';

type StoredData = {
  messages: ChatMessage[];
  todos: TodoItemData[];
};

function loadFromStorage(): StoredData {
  if (typeof window === 'undefined') {
    return { messages: [], todos: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { messages: [], todos: [] };
    }
    return JSON.parse(raw) as StoredData;
  } catch {
    return { messages: [], todos: [] };
  }
}

function saveToStorage(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function TodoApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [todos, setTodos] = useState<TodoItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Load from localStorage once on mount
  useEffect(() => {
    if (hydrated.current) {
      return;
    }
    const stored = loadFromStorage();
    if (stored.messages.length > 0) {
      setMessages(stored.messages);
    }
    if (stored.todos.length > 0) {
      setTodos(stored.todos);
    }
    hydrated.current = true;
  }, []);

  // Persist to localStorage whenever state changes (after initial hydration)
  useEffect(() => {
    if (!hydrated.current) {
      return;
    }
    saveToStorage({ messages, todos });
  }, [messages, todos]);

  const handleSend = useCallback(async (text: string) => {
    const newMessage: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/todo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json() as ApiResponse;

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

      if (data.todos && data.todos.length > 0) {
        const newTodos: TodoItemData[] = data.todos.map(t => ({
          id: crypto.randomUUID(),
          title: t.title,
          description: t.description,
          estimatedMinutes: t.estimatedMinutes,
          completed: false,
          elapsedSeconds: 0,
        }));
        setTodos(prev => [...prev, ...newTodos]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleUpdate = useCallback((id: string, updates: Partial<TodoItemData>) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t)),
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleClearAll = () => {
    setTodos([]);
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goal Todos</h1>
          <p className="text-sm text-gray-500">Chat about your goals, get actionable todos with time estimates</p>
        </div>
        {(todos.length > 0 || messages.length > 0) && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            Clear all
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-1/2">
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
          />
        </div>
        <div className="lg:w-1/2">
          <TodoList
            todos={todos}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}

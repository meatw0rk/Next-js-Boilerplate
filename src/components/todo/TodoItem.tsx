'use client';

import { useEffect, useRef, useState } from 'react';

export type TodoItemData = {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  completed: boolean;
  elapsedSeconds: number;
};

type Props = {
  item: TodoItemData;
  onUpdate: (id: string, updates: Partial<TodoItemData>) => void;
  onDelete: (id: string) => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function TodoItem({ item, onUpdate, onDelete }: Props) {
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(item.elapsedSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!timerRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        onUpdate(item.id, { elapsedSeconds: next });
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerRunning, item.id, onUpdate]);

  const handleToggleComplete = () => {
    if (timerRunning) {
      setTimerRunning(false);
    }
    onUpdate(item.id, { completed: !item.completed });
  };

  const handleReset = () => {
    setTimerRunning(false);
    setElapsed(0);
    onUpdate(item.id, { elapsedSeconds: 0 });
  };

  const estimatedSeconds = item.estimatedMinutes * 60;
  const progress = estimatedSeconds > 0 ? Math.min(elapsed / estimatedSeconds, 1) : 0;
  const overTime = elapsed > estimatedSeconds && estimatedSeconds > 0;

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        item.completed
          ? 'border-gray-200 bg-gray-50 opacity-70'
          : 'border-gray-300 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={handleToggleComplete}
          className="mt-1 size-4 cursor-pointer accent-blue-500"
          aria-label={`Mark "${item.title}" as ${item.completed ? 'incomplete' : 'complete'}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-semibold text-gray-900 ${item.completed ? 'line-through' : ''}`}
            >
              {item.title}
            </h3>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="shrink-0 text-xs text-gray-400 hover:text-red-500"
              aria-label={`Delete "${item.title}"`}
            >
              ✕
            </button>
          </div>

          {item.description && (
            <p className="mt-1 text-sm text-gray-600">{item.description}</p>
          )}

          <div className="mt-3">
            {/* Progress bar */}
            <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full transition-all ${
                  overTime ? 'bg-red-400' : 'bg-blue-500'
                }`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Est:
                {' '}
                {item.estimatedMinutes}
                {' '}
                min
              </span>
              <span className={`font-mono font-semibold ${overTime ? 'text-red-500' : 'text-gray-700'}`}>
                {formatTime(elapsed)}
                {overTime && ' ⚠'}
              </span>
            </div>

            {!item.completed && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    timerRunning
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {timerRunning ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
                </button>
                {elapsed > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

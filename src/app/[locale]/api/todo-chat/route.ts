import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { Env } from '@/libs/Env';

const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1),
    }),
  ).min(1),
});

type NewTodo = {
  title: string;
  description: string;
  estimatedMinutes: number;
};

const SYSTEM_PROMPT = `You are a helpful productivity assistant. Your job is to help users break down their goals into concrete, actionable todo items with realistic time estimates.

Have a natural, supportive conversation about the user's goals. Ask clarifying questions to understand what they want to accomplish. When you have identified clear action items from the conversation, include them as a JSON array inside a <todos> block at the END of your response.

Each todo item must have:
- title: a short, action-oriented title (under 60 characters)
- description: 1-2 sentences explaining what needs to be done
- estimatedMinutes: realistic time estimate as an integer (e.g. 15, 30, 60, 90, 120)

Only include the <todos> block when you have new, concrete todo items to suggest. Do not repeat todos you've already suggested. If the user is still describing their goals or you need more information, just have a conversation without the <todos> block.

Example format (only include at end of response when you have todos to suggest):
<todos>[{"title":"Set up project folder","description":"Create a new directory and initialize it with the necessary configuration files.","estimatedMinutes":15}]</todos>`;

export const POST = async (request: Request) => {
  const json = await request.json();
  const parse = RequestSchema.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const client = new Anthropic({ apiKey: Env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: parse.data.messages,
  });

  const rawReply = response.content[0]?.type === 'text' ? response.content[0].text : '';

  const todoMatch = rawReply.match(/<todos>([\s\S]*?)<\/todos>/);
  let todos: NewTodo[] = [];

  if (todoMatch?.[1]) {
    try {
      const parsed = JSON.parse(todoMatch[1]);
      if (Array.isArray(parsed)) {
        todos = parsed as NewTodo[];
      }
    } catch {
      // If JSON parsing fails, return no todos
    }
  }

  const reply = rawReply.replace(/<todos>[\s\S]*?<\/todos>/g, '').trim();

  return NextResponse.json({ reply, todos });
};

import { NextResponse } from 'next/server';
import type { z } from 'zod';

export async function parseBody<T>(request: Request, schema: z.ZodType<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { success: false as const, response: NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }) };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false as const,
      response: NextResponse.json({
        error: 'Check the submitted information.',
        fields: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }, { status: 400 }),
    };
  }

  return { success: true as const, data: parsed.data };
}

export function apiFailure(error: unknown) {
  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    const candidate = error as { status: number; message: string; code?: string };
    if (candidate.status >= 400 && candidate.status < 500) {
      return NextResponse.json(
        { error: candidate.message, code: candidate.code },
        { status: candidate.status, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }

  console.error('API request failed:', error);
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.' },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  );
}

export function unauthorized() {
  return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'You do not have permission to do that.' }, { status: 403 });
}


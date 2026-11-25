import { NextResponse } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

type Context = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { path: segments } = await context.params;
    const fileName = segments.join('/');
    const root = path.resolve(process.cwd(), 'public', 'uploads');
    const target = path.resolve(root, ...segments);

    if (!target.startsWith(root + path.sep) && target !== root) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const stats = await stat(target).catch(() => null);
    if (!stats || !stats.isFile()) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    const file = await readFile(target);
    const ext = path.extname(target).toLowerCase();
    const contentType =
      ext === '.webp' ? 'image/webp' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.png' ? 'image/png' :
      'application/octet-stream';

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}

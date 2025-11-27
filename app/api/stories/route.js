import { getStories } from '@/lib/stories';
import { NextResponse } from 'next/server';

export async function GET() {
  const stories = getStories();
  return NextResponse.json(stories);
}

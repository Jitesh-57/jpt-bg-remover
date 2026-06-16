import { NextRequest, NextResponse } from 'next/server'
import { getPageConfig, savePageConfig } from '@/lib/page-config'

const ADMIN_EMAILS = ['jiteshpatil@gofynd.com', 'patil.jitesh866@gmail.com']

async function getSessionEmail(req: NextRequest): Promise<string | null> {
  try {
    const baseUrl = req.nextUrl.origin
    const res = await fetch(`${baseUrl}/api/auth/google/me`, {
      headers: { cookie: req.headers.get('cookie') ?? '' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { email?: string }
    return data?.email ?? null
  } catch {
    return null
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const config = await getPageConfig(params.pageId)
  return NextResponse.json(config)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const email = await getSessionEmail(req)
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as Record<string, unknown>
  await savePageConfig(params.pageId, body)
  return NextResponse.json({ ok: true })
}

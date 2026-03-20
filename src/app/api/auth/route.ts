import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { user, pass } = await request.json()
  if (user === 'admin' && pass === 'crm2024') {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('crm_auth', 'ok', {
      httpOnly: true,
      secure: true,
      maxAge: 86400,
      path: '/',
    })
    return response
  }
  return NextResponse.json({ ok: false }, { status: 401 })
}

import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('crm_auth', '', {
    httpOnly: true,
    secure: true,
    maxAge: 0,
    path: '/',
  })
  return response
}

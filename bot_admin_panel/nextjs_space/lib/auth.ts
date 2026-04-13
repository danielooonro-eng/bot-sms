import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production-min-32-chars'

export type Session = {
  email: string
  iat: number
  exp: number
}

export function createSession(email: string): string {
  const token = jwt.sign({ email }, secret, { expiresIn: '24h' })
  return token
}

export function verifySession(token: string): Session | null {
  try {
    const verified = jwt.verify(token, secret) as Session
    return verified
  } catch (err) {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('session')?.value
  
  if (!token) return null
  
  return verifySession(token)
}

export async function setSession(token: string) {
  const cookieStore = cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 24 hours
  })
}

export async function clearSession() {
  const cookieStore = cookies()
  cookieStore.delete('session')
}

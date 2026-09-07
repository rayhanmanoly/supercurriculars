import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { getFirstTime, updateGoogleTokens } from '@/lib/actions'
import { debugLog } from '@/lib/debug'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  debugLog("Code received:", !!code)
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      try {
        const count = await getFirstTime()
        if (count === 0) {
          return NextResponse.redirect(`${origin}/login/onboarding`)
        } else {
          await updateGoogleTokens()
          return NextResponse.redirect(`${origin}${next}`)
        }
      } catch (error) {
        console.error('Callback error:', error)
        return NextResponse.redirect(`${origin}/login`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
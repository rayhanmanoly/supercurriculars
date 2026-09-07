import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Authentication Error</h1>
      <p className="text-muted-foreground max-w-md">
        Something went wrong during sign-in. This can happen if the OAuth callback
        URL is misconfigured or the authorisation code has expired.
      </p>
      <p className="text-sm text-muted-foreground max-w-md">
        Make sure the redirect URI in your Supabase Auth settings and Google Cloud
        Console matches <code className="font-mono">http://localhost:3000/auth/callback</code>.
      </p>
      <Link href="/login" className="underline text-sm mt-2">
        Back to Login
      </Link>
    </div>
  )
}

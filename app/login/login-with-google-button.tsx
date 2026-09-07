'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'
import { Button } from '../../components/ui/button'

export default function LoginWithGoogleButton() {
  const router = useRouter()

  const loginWithGoogle = async () => {
    const supabase = createClient()
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              scopes: 'https://www.googleapis.com/auth/calendar',
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
              redirectTo: `${location.origin}/auth/callback?next=/dashboard`,
            },
          })
      
    } catch (error) {
        return error
    }
  }
  return (
  <Button variant="outline" className="w-full" onClick={loginWithGoogle}>
<img src = '/img/google.svg' className="mr-2 h-5 w-5"/>
Login with Google
</Button>
  )
}
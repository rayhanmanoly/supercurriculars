import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import LoginWithGoogleButton from "./login-with-google-button"

export default function LoginForm() {
  return (
    <div className="flex w-full items-center justify-center min-h-screen">
    <Card className="mx-auto max-w-sm text-center">
      <CardHeader>
        <CardTitle className="text-2xl">Login to your account</CardTitle>
        <CardDescription>
          Sign in with Google to continue. New accounts choose Student or Teacher on the next screen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <LoginWithGoogleButton />
        </div>

      </CardContent>
    </Card>
    </div>
  )
}

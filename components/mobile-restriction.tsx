import { useIsMobile } from "@/hooks/use-mobile"

// Set NEXT_PUBLIC_DISABLE_MOBILE_RESTRICTION=true in .env.local to bypass
// this check during local development.
const DEV_BYPASS = process.env.NEXT_PUBLIC_DISABLE_MOBILE_RESTRICTION === 'true'

export default function MobileRestriction({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()

  if (!DEV_BYPASS && isMobile) {
    return (
      <div className="flex flex-col justify-center items-center h-screen p-8 text-center bg-background">
        <h2 className="text-2xl font-semibold mb-4">Please Use a Larger Screen</h2>
        <p className="text-muted-foreground max-w-md">
          This application is optimized for desktop viewing. Please access it from a device with a larger screen for the best experience.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
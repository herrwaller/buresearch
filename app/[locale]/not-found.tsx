import { Link } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <p className="text-xs tracking-widest text-muted-foreground uppercase mb-3">404</p>
        <h1 className="text-3xl font-light mb-4">Page not found</h1>
        <p className="text-muted-foreground text-sm mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="outline" className="border-border text-sm">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}

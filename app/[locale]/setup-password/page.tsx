import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetupPasswordForm } from './setup-password-form'

export default async function SetupPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-primary" />

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-8 h-0.5 bg-primary mx-auto mb-5" />
          <h1 className="text-xl font-bold">Set your password</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Choose a password for future logins — you won't need a magic link again.
          </p>
        </div>

        <SetupPasswordForm locale={locale} />
      </div>
    </div>
  )
}

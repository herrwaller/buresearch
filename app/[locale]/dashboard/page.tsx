import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProfileEditor } from './profile-editor'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Profile – BU Research' }

export default async function DashboardProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If no profile row exists yet, create one now (trigger may have missed first login)
  if (!profile) {
    const admin = createAdminClient()
    await admin.from('profiles').insert({
      id: user.id,
      email: user.email ?? '',
      role: 'professor',
      is_published: false,
    })
    const { data: fresh } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = fresh
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit your public research profile. Changes are visible after publishing.
        </p>
      </div>
      <ProfileEditor profile={profile} userId={user.id} />
    </div>
  )
}

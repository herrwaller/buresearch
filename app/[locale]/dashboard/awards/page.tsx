import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AwardsManager } from './awards-manager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Awards – BU Research' }

export default async function DashboardAwardsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: awards } = await supabase
    .from('awards')
    .select('*')
    .eq('profile_id', user.id)
    .order('year', { ascending: false })

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light">Awards & Distinctions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your awards and honours. They appear in the &quot;Awards &amp; Distinctions&quot; section of your public profile.
        </p>
      </div>
      <AwardsManager awards={awards ?? []} profileId={user.id} />
    </div>
  )
}

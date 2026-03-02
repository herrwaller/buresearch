import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublicationsManager } from './publications-manager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Publications – BU Research' }

export default async function DashboardPublicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: publications } = await supabase
    .from('publications')
    .select('*')
    .eq('profile_id', user.id)
    .order('year', { ascending: false })

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light">Publications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your research publications. They appear on your profile and in the repository.
        </p>
      </div>
      <PublicationsManager publications={publications ?? []} profileId={user.id} />
    </div>
  )
}

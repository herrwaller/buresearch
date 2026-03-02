import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExhibitionsManager } from './exhibitions-manager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Exhibitions – BU Research' }

export default async function DashboardExhibitionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: exhibitions } = await supabase
    .from('exhibitions')
    .select('*')
    .eq('profile_id', user.id)
    .order('year', { ascending: false })

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light">Exhibitions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your solo and group exhibitions. They appear in the &quot;Exhibitions&quot; section of your public profile.
        </p>
      </div>
      <ExhibitionsManager exhibitions={exhibitions ?? []} profileId={user.id} />
    </div>
  )
}

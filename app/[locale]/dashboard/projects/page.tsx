import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectsManager } from './projects-manager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Research Projects – BU Research' }

export default async function DashboardProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('profile_id', user.id)
    .order('start_year', { ascending: false })

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light">Research Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your current and past research projects. They appear in the &quot;Current Research&quot; section of your public profile.
        </p>
      </div>
      <ProjectsManager projects={projects ?? []} profileId={user.id} />
    </div>
  )
}

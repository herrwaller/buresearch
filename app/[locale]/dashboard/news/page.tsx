import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewsManager } from './news-manager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'News – BU Research' }

export default async function DashboardNewsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: posts } = await supabase
    .from('news_posts')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light">News & Activities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share exhibitions, keynotes, projects, and publications.
        </p>
      </div>
      <NewsManager posts={posts ?? []} profileId={user.id} />
    </div>
  )
}

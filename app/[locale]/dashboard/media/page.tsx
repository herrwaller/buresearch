import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MediaUploader } from './media-uploader'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Media – BU Research' }

export default async function DashboardMediaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: items } = await supabase
    .from('media_items')
    .select('*')
    .eq('profile_id', user.id)
    .order('sort_order', { ascending: true })

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light">Media</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload images and PDF documents for your profile.
        </p>
      </div>
      <MediaUploader items={items ?? []} profileId={user.id} />
    </div>
  )
}

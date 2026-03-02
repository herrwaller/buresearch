import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PAGE_SCHEMA, PAGE_LABELS } from '@/lib/page-content'
import { Nav } from '@/components/nav'
import { ContentEditor } from './content-editor'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Page Content – BU Research Admin' }

export default async function ContentPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) redirect(`/${locale}/dashboard`)

  // Load hub partners
  const { data: hubPartners } = await supabase
    .from('hub_partners')
    .select('*')
    .order('sort_order', { ascending: true })

  // Load research clusters
  const { data: researchClusters } = await supabase
    .from('research_clusters')
    .select('*')
    .order('sort_order', { ascending: true })

  // Load all existing content
  const { data: rows } = await supabase
    .from('page_content')
    .select('page, locale, key, value')

  // Build initial values map: { [page]: { [locale]: { [key]: value } } }
  const initial: Record<string, Record<string, Record<string, string>>> = {}
  for (const row of rows ?? []) {
    if (!initial[row.page]) initial[row.page] = {}
    if (!initial[row.page][row.locale]) initial[row.page][row.locale] = {}
    initial[row.page][row.locale][row.key] = row.value ?? ''
  }

  return (
    <>
      <Nav />
      <main className="pt-14">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs tracking-widest text-primary uppercase mb-2">Administration</p>
              <h1 className="text-3xl font-light">Page Content</h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Edit public page texts in all three languages.
              </p>
            </div>
            <a
              href={`/${locale}/admin`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Admin
            </a>
          </div>
          <ContentEditor
            schema={PAGE_SCHEMA}
            pageLabels={PAGE_LABELS}
            initial={initial}
            hubPartners={hubPartners ?? []}
            researchClusters={researchClusters ?? []}
          />
        </div>
      </main>
    </>
  )
}

import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/nav'
import { RepositoryFilters } from './repository-filters'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('repository')
  return { title: `${t('title')} – BU Research` }
}

export default async function RepositoryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; author?: string; discipline?: string; type?: string }>
}) {
  const t = await getTranslations('repository')
  const filters = await searchParams

  const supabase = await createClient()

  // Fetch all published profile ids
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name_en, name_de, slug')
    .eq('is_published', true)

  const profileIds = (profiles ?? []).map((p) => p.id)

  let query = supabase
    .from('publications')
    .select('*, profiles(name_en, name_de, slug)')
    .in('profile_id', profileIds.length > 0 ? profileIds : ['none'])
    .order('year', { ascending: false })

  if (filters.year) query = query.eq('year', parseInt(filters.year))
  if (filters.discipline) query = query.eq('discipline', filters.discipline)
  if (filters.type) query = query.eq('type', filters.type)

  const { data: publications } = await query

  // Get unique years for filter
  const { data: allPubs } = await supabase
    .from('publications')
    .select('year, authors, profile_id')
    .in('profile_id', profileIds.length > 0 ? profileIds : ['none'])

  const years = [...new Set((allPubs ?? []).map((p) => p.year))].sort((a, b) => b - a)

  const filteredPubs = filters.author
    ? (publications ?? []).filter((p) =>
        p.authors.some((a: string) =>
          a.toLowerCase().includes(filters.author!.toLowerCase())
        )
      )
    : (publications ?? [])

  return (
    <>
      <Nav />
      <main className="pt-14">
        {/* Header */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs tracking-widest text-primary uppercase mb-2">Repository</p>
            <h1 className="text-4xl font-light">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredPubs.length} publication{filteredPubs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-10">
          <RepositoryFilters years={years} currentFilters={filters} />

          {filteredPubs.length === 0 ? (
            <p className="mt-12 text-center text-muted-foreground text-sm">{t('noResults')}</p>
          ) : (
            <div className="mt-8 divide-y divide-border">
              {filteredPubs.map((pub) => {
                const profile = pub.profiles as { name_en: string | null; name_de: string | null; slug: string | null } | null
                return (
                  <div key={pub.id} className="py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-snug">
                          {pub.url ? (
                            <a
                              href={pub.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors"
                            >
                              {pub.title}
                            </a>
                          ) : (
                            pub.title
                          )}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pub.authors.join(', ')}
                        </p>
                        {pub.journal && (
                          <p className="mt-0.5 text-xs text-muted-foreground italic">{pub.journal}</p>
                        )}
                        {pub.abstract && (
                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {pub.abstract}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-foreground/70">{pub.year}</span>
                          <span>·</span>
                          <span className="capitalize">{pub.type}</span>
                          <span>·</span>
                          <span className="capitalize">{pub.discipline}</span>
                          {pub.doi && (
                            <>
                              <span>·</span>
                              <a
                                href={`https://doi.org/${pub.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                DOI: {pub.doi}
                              </a>
                            </>
                          )}
                          {profile?.slug && (
                            <>
                              <span>·</span>
                              <a
                                href={`/${profile.slug}`}
                                className="text-primary hover:underline"
                              >
                                {profile.name_en ?? profile.name_de}
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Brand University · research.brand-university.de</p>
      </footer>
    </>
  )
}

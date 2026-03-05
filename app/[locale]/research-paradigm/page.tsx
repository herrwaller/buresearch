import { getTranslations } from 'next-intl/server'
import { Nav } from '@/components/nav'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { getPageContent } from '@/lib/page-content'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('paradigm')
  return { title: `${t('title')} – BU Research` }
}

export default async function ResearchParadigmPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'paradigm' })
  const supabase = await createClient()

  const [c, { data: clusters }, { data: latestNews }] = await Promise.all([
    getPageContent('paradigm', locale),
    supabase.from('research_clusters').select('*').order('sort_order', { ascending: true }),
    supabase
      .from('news_posts')
      .select('*, profiles(slug, name_en, name_de, name_cn)')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3),
  ])

  const title    = c.headline    || t('title')
  const subtitle = c.subheadline || t('subtitle')
  const body1    = c.transdisciplinary_body  || 'Brand University operates at the intersection of creative practice and scientific inquiry. Our research paradigm is grounded in the conviction that disciplinary boundaries — while necessary for depth — must remain permeable to enable genuine innovation.'
  const body2    = c.transdisciplinary_body2 || 'We pursue questions that no single discipline can answer alone: How does aesthetic perception shape market behaviour? How do cultural frameworks determine technological adoption? How can design thinking accelerate scientific communication?'
  const qualityBody = c.quality_body || 'All research outputs are subject to peer review and registered with a DOI through CrossRef. We maintain open-access publishing wherever possible and participate in international accreditation frameworks including FIBAA and AACSB.'

  return (
    <>
      <Nav />
      <main className="pt-16">
        <section className="border-b border-border px-6 py-20 md:py-28">
          <div className="mx-auto max-w-4xl">
            <div className="w-10 h-1 bg-primary mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">{title}</h1>
            <p className="mt-4 max-w-xl text-muted-foreground text-base leading-relaxed">{subtitle}</p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-16 lg:grid-cols-[1fr_260px]">

            {/* Main content */}
            <div className="space-y-14">
              <section>
                <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-6">
                  Transdisciplinary Approach
                </h2>
                <p className="text-sm leading-relaxed text-foreground/80">{body1}</p>
                <p className="mt-4 text-sm leading-relaxed text-foreground/80">{body2}</p>
              </section>

              {clusters && clusters.length > 0 && (
                <>
                  <Separator className="bg-border" />
                  <section id="research-clusters">
                    <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-6">
                      Research Clusters
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-3">
                      {clusters.map((cluster) => (
                        <div key={cluster.id} className="border border-border rounded-sm p-4">
                          <h3 className="text-sm font-medium mb-2 text-primary">{cluster.title}</h3>
                          {cluster.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{cluster.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              <Separator className="bg-border" />

              <section>
                <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-6">
                  Quality Standards
                </h2>
                <p className="text-sm leading-relaxed text-foreground/80">{qualityBody}</p>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:pt-0">
              <div className="lg:sticky lg:top-24 space-y-5">
                <h2 className="text-xs tracking-widest text-muted-foreground uppercase">
                  Recent News &amp; Activities
                </h2>

                {latestNews && latestNews.length > 0 ? (
                  <div className="space-y-5">
                    {latestNews.map((post) => {
                      const profile = post.profiles as { slug: string | null; name_en: string | null; name_de: string | null; name_cn: string | null } | null
                      const title =
                        (locale === 'cn' ? post.title_cn : locale === 'de' ? post.title_de : post.title_en)
                        ?? post.title_en ?? post.title_de ?? ''
                      const content =
                        (locale === 'cn' ? post.content_cn : locale === 'de' ? post.content_de : post.content_en)
                        ?? post.content_en ?? post.content_de ?? ''
                      const authorName =
                        (locale === 'de' ? profile?.name_de : profile?.name_en)
                        ?? profile?.name_en ?? ''
                      const url = (post.url as string | null) ?? null

                      return (
                        <div key={post.id} className="border border-border rounded-sm p-3 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground capitalize">
                              {post.category}
                            </Badge>
                            {post.published_at && (
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(post.published_at).toLocaleDateString(
                                  locale === 'de' ? 'de-DE' : locale === 'cn' ? 'zh-CN' : 'en-GB',
                                  { year: 'numeric', month: 'short', day: 'numeric' }
                                )}
                              </span>
                            )}
                          </div>

                          {url ? (
                            <a
                              href={url.startsWith('http') ? url : `https://${url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium leading-snug hover:text-primary transition-colors hover:underline block"
                            >
                              {title} ↗
                            </a>
                          ) : (
                            <p className="text-xs font-medium leading-snug">{title}</p>
                          )}

                          {content && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{content}</p>
                          )}

                          {profile?.slug && authorName && (
                            <a
                              href={`/${locale}/${profile.slug}`}
                              className="text-[10px] text-primary hover:underline block"
                            >
                              {authorName}
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No recent activity.</p>
                )}
              </div>
            </aside>

          </div>
        </div>
      </main>
      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Brand University · research.brand-university.de</p>
      </footer>
    </>
  )
}

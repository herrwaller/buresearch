import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/nav'
import { Link } from '@/lib/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import type { Metadata } from 'next'
import type { Profile, Publication, NewsPost, MediaItem, Project, Exhibition, Award, AcademicEntry } from '@/lib/types/database'

type Params = { locale: string; slug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  const prof = data as Profile | null
  if (!prof) return { title: 'Not Found' }

  const orcidIdMeta = prof.orcid?.replace(/^https?:\/\/orcid\.org\//i, '').trim() || null
  const sameAs: string[] = []
  if (orcidIdMeta) sameAs.push(`https://orcid.org/${orcidIdMeta}`)
  if (prof.google_scholar_url) sameAs.push(prof.google_scholar_url)
  if (prof.researchgate_url) sameAs.push(prof.researchgate_url)

  return {
    title: `${prof.name_en ?? prof.name_de} – BU Research`,
    description: prof.bio_en?.slice(0, 160) ?? undefined,
    openGraph: {
      title: `${prof.name_en ?? prof.name_de} – BU Research`,
      description: prof.bio_en?.slice(0, 160) ?? undefined,
      images: prof.photo_url ? [{ url: prof.photo_url }] : [],
    },
  }
}

export default async function ProfessorPage({ params }: { params: Promise<Params> }) {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'professor' })

  const supabase = await createClient()

  // Fetch profile
  const { data: profData } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  const prof = profData as Profile | null
  if (!prof) notFound()

  // Fetch related data in parallel
  const [
    { data: pubsData },
    { data: newsData },
    { data: mediaData },
    { data: projectsData },
    { data: exhibitionsData },
    { data: awardsData },
  ] = await Promise.all([
    supabase
      .from('publications')
      .select('*')
      .eq('profile_id', prof.id)
      .order('year', { ascending: false }),
    supabase
      .from('news_posts')
      .select('*')
      .eq('profile_id', prof.id)
      .eq('is_published', true)
      .order('published_at', { ascending: false }),
    supabase
      .from('media_items')
      .select('*')
      .eq('profile_id', prof.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('projects')
      .select('*')
      .eq('profile_id', prof.id)
      .order('start_year', { ascending: false }),
    supabase
      .from('exhibitions')
      .select('*')
      .eq('profile_id', prof.id)
      .order('year', { ascending: false }),
    supabase
      .from('awards')
      .select('*')
      .eq('profile_id', prof.id)
      .order('year', { ascending: false }),
  ])

  const publications = (pubsData ?? []) as Publication[]
  const featuredPubs = publications.filter((p) => p.is_featured)
  const news = (newsData ?? []) as NewsPost[]
  const media = (mediaData ?? []) as MediaItem[]
  const projects = (projectsData ?? []) as Project[]
  const exhibitions = (exhibitionsData ?? []) as Exhibition[]
  const awards = (awardsData ?? []) as Award[]

  const name =
    (locale === 'cn' ? prof.name_cn : locale === 'de' ? prof.name_de : prof.name_en)
    ?? prof.name_en ?? prof.name_de ?? ''
  const position =
    (locale === 'cn' ? prof.position_cn : locale === 'de' ? prof.position_de : prof.position_en)
    ?? prof.position_en ?? prof.position_de ?? ''
  const bio =
    (locale === 'cn' ? prof.bio_cn : locale === 'de' ? prof.bio_de : prof.bio_en)
    ?? prof.bio_en ?? prof.bio_de ?? ''

  const images = media.filter((m) => m.type === 'image')
  const pdfs = media.filter((m) => m.type === 'pdf')
  const academicBg = (prof.academic_background as AcademicEntry[] | null) ?? []
  const profileLinks = (prof.links as { label: string; url: string }[] | null) ?? []

  // Normalize ORCID: strip any leading URL so we always have just the ID
  const orcidId = prof.orcid?.replace(/^https?:\/\/orcid\.org\//i, '').trim() || null

  // JSON-LD sameAs
  const sameAs: string[] = []
  if (orcidId) sameAs.push(`https://orcid.org/${orcidId}`)
  if (prof.google_scholar_url) sameAs.push(prof.google_scholar_url)
  if (prof.researchgate_url) sameAs.push(prof.researchgate_url)
  if (prof.scopus_id) sameAs.push(`https://www.scopus.com/authid/detail.uri?authorId=${prof.scopus_id}`)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: name,
    jobTitle: position,
    worksFor: { '@type': 'Organization', name: 'Brand University' },
    email: prof.email ?? undefined,
    image: prof.photo_url ?? undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  }

  return (
    <>
      <Nav />
      <main className="pt-14">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Header */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/"
              locale={locale as 'en' | 'de' | 'cn'}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {t('backToFaculty')}
            </Link>

            <div className="mt-6 flex gap-8 items-start">
              <div className="shrink-0">
                <div className="h-28 w-28 overflow-hidden rounded-sm bg-muted">
                  {prof.photo_url ? (
                    <Image
                      src={prof.photo_url}
                      alt={name}
                      width={112}
                      height={112}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-3xl font-light text-muted-foreground">
                      {name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{prof.title}</p>
                <h1 className="mt-1 text-3xl font-light">{name}</h1>
                <p className="mt-1 text-muted-foreground">{position}</p>
                {prof.email && (
                  <a
                    href={`mailto:${prof.email}`}
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    {prof.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-12 grid gap-16 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-12">
            {bio && (
              <section>
                <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">About</h2>
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{bio}</p>
              </section>
            )}

            {/* Academic Background */}
            {academicBg.length > 0 && (
              <>
                <Separator className="bg-border" />
                <section>
                  <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
                    Academic Background
                  </h2>
                  <div className="space-y-3">
                    {academicBg.map((entry, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        {entry.year && (
                          <span className="text-xs text-muted-foreground w-10 shrink-0 pt-0.5">{entry.year}</span>
                        )}
                        <div>
                          <p className="text-sm font-medium">{entry.degree}</p>
                          <p className="text-xs text-muted-foreground">{entry.institution}</p>
                          {entry.dissertation_title && (
                            <p className="text-xs text-muted-foreground/70 italic mt-0.5">{entry.dissertation_title}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Selected Publications */}
            {featuredPubs.length > 0 && (
              <>
                <Separator className="bg-border" />
                <section>
                  <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
                    {locale === 'de' ? 'Publikationen (Auswahl)' : locale === 'cn' ? '出版物（精选）' : 'Publications (selected)'}
                  </h2>
                  <div className="space-y-4">
                    {featuredPubs.map((pub) => (
                      <PublicationItem key={pub.id} pub={pub} />
                    ))}
                  </div>
                  {publications.length > featuredPubs.length && (
                    <p className="mt-4 text-xs text-muted-foreground">
                      + {publications.length - featuredPubs.length} more publications
                    </p>
                  )}
                </section>
              </>
            )}


            {/* Current Research / Projects */}
            {projects.length > 0 && (
              <>
                <Separator className="bg-border" />
                <section>
                  <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
                    Current Research
                  </h2>
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <ProjectItem key={project.id} project={project} />
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Exhibitions */}
            {exhibitions.length > 0 && (
              <>
                <Separator className="bg-border" />
                <section>
                  <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
                    {locale === 'de' ? 'Ausstellungen' : locale === 'cn' ? '展览' : 'Exhibitions'}
                  </h2>
                  <div className="space-y-4">
                    {exhibitions.map((ex) => (
                      <div key={ex.id} className="flex gap-4 items-start">
                        {ex.year && (
                          <span className="text-xs text-muted-foreground w-10 shrink-0 pt-0.5">{ex.year}</span>
                        )}
                        <div>
                          <p className="text-sm font-medium">{ex.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {ex.type}{[ex.venue, ex.location].filter(Boolean).length > 0 ? ' · ' + [ex.venue, ex.location].filter(Boolean).join(', ') : ''}
                          </p>
                          {ex.description && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5">{ex.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Awards */}
            {awards.length > 0 && (
              <>
                <Separator className="bg-border" />
                <section>
                  <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
                    {locale === 'de' ? 'Auszeichnungen' : locale === 'cn' ? '奖项' : 'Awards & Distinctions'}
                  </h2>
                  <div className="space-y-3">
                    {awards.map((award) => (
                      <div key={award.id} className="flex gap-4 items-start">
                        {award.year && (
                          <span className="text-xs text-muted-foreground w-10 shrink-0 pt-0.5">{award.year}</span>
                        )}
                        <div>
                          <p className="text-sm font-medium">{award.title}</p>
                          {award.awarding_body && (
                            <p className="text-xs text-muted-foreground">{award.awarding_body}</p>
                          )}
                          {award.description && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5">{award.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {news.length > 0 && (
              <>
                <Separator className="bg-border" />
                <section>
                  <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
                    {t('news')}
                  </h2>
                  <div className="space-y-6">
                    {news.map((post) => (
                      <NewsItem key={post.id} post={post} locale={locale} />
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Media — immer ganz unten */}
            {images.length > 0 && (
              <>
                <Separator className="bg-border" />
                <section>
                  <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
                    {t('media')}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((item) => {
                      const caption = (locale === 'de' ? item.caption_de : item.caption_en) ?? item.caption_en ?? item.caption_de
                      return (
                        <div key={item.id}>
                          <div className="aspect-square overflow-hidden bg-muted rounded-sm">
                            <Image
                              src={item.url}
                              alt={caption ?? ''}
                              width={300}
                              height={300}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          {caption && (
                            <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug">{caption}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* 1. Research Focus */}
            {prof.research_focus && prof.research_focus.length > 0 && (
              <div>
                <h3 className="text-xs tracking-widest text-muted-foreground uppercase mb-3">
                  {t('researchFocus')}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {prof.research_focus.map((tag) => (
                    <a
                      key={tag}
                      href={`/${locale}/research-paradigm#research-clusters`}
                      className="text-xs px-2 py-0.5 border border-border text-muted-foreground rounded-sm hover:border-primary hover:text-primary transition-colors"
                    >
                      {tag}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 2. CV Download */}
            {prof.cv_file_url && (
              <div>
                <h3 className="text-xs tracking-widest text-muted-foreground uppercase mb-3">
                  Curriculum Vitae
                </h3>
                <a
                  href={prof.cv_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs border border-border px-3 py-2 rounded-sm hover:border-primary hover:text-primary transition-colors"
                >
                  <span>↓</span>
                  <span>Download CV (PDF)</span>
                </a>
              </div>
            )}

            {/* 3. Research Profiles */}
            {(prof.orcid || prof.google_scholar_url || prof.scopus_id || prof.wos_id || prof.researchgate_url) && (
              <div>
                <h3 className="text-xs tracking-widest text-muted-foreground uppercase mb-3">
                  Research Profiles
                </h3>
                <div className="space-y-2.5">
                  {orcidId && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">ORCID</p>
                      <a
                        href={`https://orcid.org/${orcidId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline break-all"
                      >
                        {orcidId}
                      </a>
                    </div>
                  )}
                  {prof.google_scholar_url && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Google Scholar</p>
                      <a
                        href={prof.google_scholar_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View profile ↗
                      </a>
                    </div>
                  )}
                  {prof.scopus_id && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Scopus</p>
                      <a
                        href={`https://www.scopus.com/authid/detail.uri?authorId=${prof.scopus_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        {prof.scopus_id}
                      </a>
                    </div>
                  )}
                  {prof.wos_id && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Web of Science</p>
                      <a
                        href={`https://www.webofscience.com/wos/author/record/${prof.wos_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        {prof.wos_id}
                      </a>
                    </div>
                  )}
                  {prof.researchgate_url && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">ResearchGate</p>
                      <a
                        href={prof.researchgate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View profile ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Links */}
            {profileLinks.length > 0 && (
              <div>
                <h3 className="text-xs tracking-widest text-muted-foreground uppercase mb-3">
                  Links
                </h3>
                <div className="space-y-1.5">
                  {profileLinks.map((link, idx) => {
                    const href = link.url.startsWith('http') ? link.url : `https://${link.url}`
                    return (
                      <a
                        key={idx}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-primary hover:underline"
                      >
                        {link.label || link.url} ↗
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 5. Documents (PDFs from Media) */}
            {pdfs.length > 0 && (
              <div>
                <h3 className="text-xs tracking-widest text-muted-foreground uppercase mb-3">
                  Documents
                </h3>
                <div className="space-y-2">
                  {pdfs.map((item) => {
                    const caption = (locale === 'de' ? item.caption_de : item.caption_en) ?? item.caption_en ?? item.caption_de
                    return (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-primary hover:underline"
                      >
                        <span>↓</span>
                        <span>{caption ?? 'Document'}</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Brand University · research.brand-university.de</p>
      </footer>
    </>
  )
}

function PublicationItem({ pub }: { pub: Publication }) {
  return (
    <div>
      <p className="text-sm font-medium leading-snug">
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
      <p className="mt-0.5 text-xs text-muted-foreground">
        {pub.authors.join(', ')} · {pub.year}
        {pub.journal && ` · ${pub.journal}`}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] px-1 py-0 border-border text-muted-foreground">
          {pub.type}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1 py-0 border-border text-muted-foreground">
          {pub.discipline}
        </Badge>
        {pub.doi && (
          <a
            href={`https://doi.org/${pub.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline"
          >
            DOI
          </a>
        )}
      </div>
    </div>
  )
}

function ProjectItem({ project }: { project: Project }) {
  const yearRange = project.start_year
    ? project.end_year
      ? `${project.start_year}–${project.end_year}`
      : `${project.start_year}–present`
    : null

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium leading-snug">{project.title}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className="text-[10px] px-1 py-0 border-border text-muted-foreground">
            {project.role}
          </Badge>
          {yearRange && (
            <span className="text-xs text-muted-foreground">{yearRange}</span>
          )}
        </div>
      </div>
      {project.description && (
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{project.description}</p>
      )}
      {project.funding_source && (
        <p className="mt-0.5 text-xs text-muted-foreground/60">Funded by: {project.funding_source}</p>
      )}
    </div>
  )
}

function NewsItem({ post, locale }: { post: NewsPost; locale: string }) {
  const title = (locale === 'cn' ? post.title_cn : locale === 'de' ? post.title_de : post.title_en) ?? post.title_en ?? post.title_de ?? ''
  const content = (locale === 'cn' ? post.content_cn : locale === 'de' ? post.content_de : post.content_en) ?? post.content_en ?? post.content_de ?? ''

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground capitalize">
          {post.category}
        </Badge>
        {post.published_at && (
          <span className="text-xs text-muted-foreground">
            {new Date(post.published_at).toLocaleDateString(
              locale === 'cn' ? 'zh-CN' : locale === 'de' ? 'de-DE' : 'en-GB',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </span>
        )}
      </div>
      {post.url ? (
        <a
          href={post.url.startsWith('http') ? post.url : `https://${post.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sm hover:text-primary transition-colors hover:underline"
        >
          {title} ↗
        </a>
      ) : (
        <h3 className="font-medium text-sm">{title}</h3>
      )}
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-3">{content}</p>
    </div>
  )
}

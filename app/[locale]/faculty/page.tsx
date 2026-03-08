import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/nav'
import { Link } from '@/lib/i18n/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/types/database'

export const metadata: Metadata = {
  title: 'Faculty – BU Research',
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tag?: string }>
}) {
  const { locale } = await params
  const { tag } = await searchParams
  const t = await getTranslations({ locale, namespace: 'home' })

  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_published', true)
    .eq('role', 'professor')
    .order('created_at', { ascending: true })

  if (tag) {
    query = query.contains('research_focus', [tag])
  }

  const { data: professors } = await query

  const lang = ['en', 'de', 'cn'].includes(locale) ? locale : 'en'
  const nameKey = `name_${lang}` as keyof Profile
  const positionKey = `position_${lang}` as keyof Profile

  return (
    <>
      <Nav />
      <main className="pt-16">

        {/* ── Professorinnen-Grid ── */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-center justify-between mb-10">
            <p className="text-xs font-bold tracking-[0.15em] text-muted-foreground uppercase">
              {t('facultyTitle')}
            </p>
            {/* Active tag filter badge */}
            {tag && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Filtered by:</span>
                <span className="flex items-center gap-1 text-xs border border-primary/40 text-primary bg-primary/5 px-2 py-0.5 rounded-sm">
                  {tag}
                  <a
                    href={`/${locale}/faculty`}
                    className="ml-1 hover:text-foreground transition-colors"
                    aria-label="Clear filter"
                  >
                    ×
                  </a>
                </span>
              </div>
            )}
          </div>

          {professors && professors.length > 0 ? (
            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {professors.map((prof) => (
                <ProfessorCard
                  key={prof.id}
                  prof={prof as Profile}
                  locale={locale}
                  nameKey={nameKey}
                  positionKey={positionKey}
                  viewLabel={t('viewProfile')}
                />
              ))}
            </div>
          ) : (
            <div className="border border-border rounded-sm p-16 text-center text-muted-foreground text-sm">
              {tag
                ? `No faculty profiles found for tag "${tag}". `
                : 'No faculty profiles published yet.'}
              {tag && (
                <a href={`/${locale}/faculty`} className="text-primary hover:underline ml-1">
                  Show all →
                </a>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Image
            src="/images/bu_monogramm.svg"
            alt="Brand University"
            width={32}
            height={32}
            className="h-6 w-auto opacity-40"
          />
          <p className="text-[11px] text-muted-foreground tracking-wide">
            © {new Date().getFullYear()} Brand University · research.brand-university.de
          </p>
        </div>
      </footer>
    </>
  )
}

function ProfessorCard({
  prof,
  locale,
  nameKey,
  positionKey,
  viewLabel,
}: {
  prof: Profile
  locale: string
  nameKey: keyof Profile
  positionKey: keyof Profile
  viewLabel: string
}) {
  const name = (prof[nameKey] as string) || prof.name_en || prof.name_de || '—'
  const position = (prof[positionKey] as string) || prof.position_en || ''

  return (
    <div className="group relative flex flex-col bg-card p-6 hover:bg-[#f0f7e8] transition-colors border-l-2 border-l-transparent hover:border-l-primary">
      {/* Card-Link als absolutes Overlay – nur wenn Slug gesetzt */}
      {prof.slug && (
        <Link
          href={`/${prof.slug}`}
          locale={locale as 'en' | 'de' | 'cn'}
          className="absolute inset-0"
          aria-label={name}
        />
      )}

      {/* Foto */}
      <div className="mb-4 h-14 w-14 overflow-hidden rounded-sm bg-muted shrink-0">
        {prof.photo_url ? (
          <Image
            src={prof.photo_url}
            alt={name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">
            {name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {prof.title && (
          <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-0.5">
            {prof.title}
          </p>
        )}
        <h3 className="font-bold text-sm text-foreground leading-snug">{name}</h3>
        {position && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{position}</p>
        )}

        {/* Research Focus Tags — klickbar, z-10 über dem Card-Link */}
        {prof.research_focus && prof.research_focus.length > 0 && (
          <div className="relative z-10 mt-3 flex flex-wrap gap-1">
            {prof.research_focus.slice(0, 3).map((tag) => (
              <a
                key={tag}
                href={`/${locale}/faculty?tag=${encodeURIComponent(tag)}`}
                className="text-[10px] px-1.5 py-0.5 border border-border text-muted-foreground rounded-sm hover:border-primary hover:text-primary transition-colors"
              >
                {tag}
              </a>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs font-bold text-primary tracking-wide group-hover:underline underline-offset-2">
        {viewLabel} →
      </p>
    </div>
  )
}

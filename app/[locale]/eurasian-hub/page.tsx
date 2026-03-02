import { getTranslations } from 'next-intl/server'
import { Nav } from '@/components/nav'
import { Separator } from '@/components/ui/separator'
import { getPageContent } from '@/lib/page-content'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('hub')
  return { title: `${t('title')} – BU Research` }
}

export default async function EurasianHubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hub' })
  const supabase = await createClient()

  const [c, { data: partners }] = await Promise.all([
    getPageContent('hub', locale),
    supabase.from('hub_partners').select('*').order('sort_order', { ascending: true }),
  ])

  const title              = c.title              || t('title')
  const subtitle           = c.subtitle           || t('subtitle')
  const missionBody        = c.mission_body       || null
  const currentInitiatives = c.current_initiatives || null
  const contactBody        = c.contact_body       || null

  return (
    <>
      <Nav />
      <main className="pt-16">
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs tracking-widest text-primary uppercase mb-2">International</p>
            <h1 className="text-4xl font-light">{title}</h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-6 py-16 space-y-14">
          {missionBody && (
            <section>
              <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-6">Mission</h2>
              <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{missionBody}</p>
            </section>
          )}

          {partners && partners.length > 0 && (
            <>
              <Separator className="bg-border" />
              <section>
                <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-6">Partner Institutions</h2>
                <div className="divide-y divide-border">
                  {partners.map((p) => (
                    <div key={p.id} className="py-4">
                      {p.url ? (
                        <a
                          href={p.url.startsWith('http') ? p.url : `https://${p.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary hover:underline transition-colors"
                        >
                          {p.name} ↗
                        </a>
                      ) : (
                        <p className="text-sm font-medium">{p.name}</p>
                      )}
                      {p.description && (
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {currentInitiatives && (
            <>
              <Separator className="bg-border" />
              <section>
                <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-6">Current Initiatives</h2>
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{currentInitiatives}</p>
              </section>
            </>
          )}

          {contactBody && (
            <>
              <Separator className="bg-border" />
              <section>
                <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Contact</h2>
                <p className="text-sm text-foreground/80 whitespace-pre-line">{contactBody}</p>
              </section>
            </>
          )}
        </div>
      </main>
      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Brand University · research.brand-university.de</p>
      </footer>
    </>
  )
}

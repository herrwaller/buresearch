'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname } from '@/lib/i18n/navigation'
import { useRouter } from '@/lib/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex flex-col justify-center items-center w-5 h-5">
      <span className={cn('absolute block h-0.5 w-5 bg-[#18171b] transition-all duration-200',
        open ? 'rotate-45' : '-translate-y-1.5')} />
      <span className={cn('absolute block h-0.5 bg-[#18171b] transition-all duration-200',
        open ? 'w-0 opacity-0' : 'w-5')} />
      <span className={cn('absolute block h-0.5 w-5 bg-[#18171b] transition-all duration-200',
        open ? '-rotate-45' : 'translate-y-1.5')} />
    </span>
  )
}

const navLinks = [
  { href: '/research-paradigm', labelKey: 'paradigm'  },
  { href: '/faculty',           labelKey: 'faculty'    },
  { href: '/eurasian-hub',      labelKey: 'hub'        },
  { href: '/repository',        labelKey: 'repository' },
] as const

export function Nav() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const locales = [
    { code: 'en', label: 'EN' },
    { code: 'de', label: 'DE' },
    { code: 'cn', label: '中文' },
  ] as const

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white w-full"
      style={{ boxShadow: '0 0 15px 3px rgba(44,62,80,0.1), 0 0 6px 0 rgba(44,62,80,0.1)' }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8 h-16 flex items-center justify-between gap-8">

        {/* BU Wortbildmarke */}
        <Link href="/" className="shrink-0 flex items-center gap-3">
          <Image
            src="/images/bu_monogramm.svg"
            alt="Brand University"
            width={44}
            height={44}
            priority
            className="h-10 w-auto"
          />
          <span className="hidden sm:block text-[10px] font-bold tracking-[0.18em] text-[#18171b]/40 uppercase border-l border-[#18171b]/15 pl-3">
            Research
          </span>
        </Link>

        {/* Desktop-Navigation */}
        <nav className="hidden md:flex items-stretch h-16 flex-1">
          {navLinks.map(({ href, labelKey }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center px-4 text-sm font-bold transition-colors duration-200',
                  'text-[#18171b] hover:text-[#63AE26]',
                  'after:absolute after:bottom-0 after:left-0 after:h-1 after:bg-[#63AE26] after:transition-all after:duration-200',
                  isActive ? 'text-[#63AE26] after:w-full' : 'after:w-0 hover:after:w-full'
                )}
              >
                {t(labelKey)}
              </Link>
            )
          })}
        </nav>

        {/* Desktop: Sprachumschalter + Login */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <div className="flex items-center border border-[#18171b]/15 rounded-sm overflow-hidden">
            {locales.map(({ code, label }) => (
              <Link
                key={code}
                href={pathname}
                locale={code}
                className={cn(
                  'text-[11px] font-bold tracking-wider transition-colors px-2 py-1',
                  locale === code ? 'text-[#63AE26] bg-[#63AE26]/8' : 'text-[#18171b]/50 hover:text-[#63AE26]'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-bold text-[#18171b] hover:text-[#63AE26] transition-colors">
                {t('dashboard')}
              </Link>
              <button onClick={handleSignOut} className="text-xs font-bold text-[#18171b]/50 hover:text-[#18171b] transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-bold text-white bg-[#63AE26] hover:bg-[#57991f] transition-colors px-4 py-1.5 rounded-sm">
              {t('login')}
            </Link>
          )}
        </div>

        {/* Mobile: Hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 -mr-2 shrink-0"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          <HamburgerIcon open={menuOpen} />
        </button>
      </div>

      {/* Mobile-Menü */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#18171b]/10 px-6 py-4 flex flex-col gap-1"
          style={{ boxShadow: '0 8px 24px rgba(44,62,80,0.10)' }}
        >
          {navLinks.map(({ href, labelKey }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'py-3 text-sm font-bold border-b border-[#18171b]/8 transition-colors',
                  isActive ? 'text-[#63AE26]' : 'text-[#18171b] hover:text-[#63AE26]'
                )}
              >
                {t(labelKey)}
              </Link>
            )
          })}

          <div className="pt-3 flex items-center justify-between">
            {/* Sprachumschalter */}
            <div className="flex items-center border border-[#18171b]/15 rounded-sm overflow-hidden">
              {locales.map(({ code, label }) => (
                <Link
                  key={code}
                  href={pathname}
                  locale={code}
                  className={cn(
                    'text-[11px] font-bold tracking-wider transition-colors px-2.5 py-1.5',
                    locale === code ? 'text-[#63AE26] bg-[#63AE26]/8' : 'text-[#18171b]/50 hover:text-[#63AE26]'
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Login / Dashboard */}
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-sm font-bold text-[#18171b] hover:text-[#63AE26] transition-colors">
                  {t('dashboard')}
                </Link>
                <button onClick={handleSignOut} className="text-xs font-bold text-[#18171b]/50 hover:text-[#18171b] transition-colors">
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-bold text-white bg-[#63AE26] hover:bg-[#57991f] transition-colors px-4 py-1.5 rounded-sm">
                {t('login')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

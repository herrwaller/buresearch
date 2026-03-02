'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/lib/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/lib/i18n/navigation'
import Image from 'next/image'
import type { Profile } from '@/lib/types/database'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'dashboard.profile', exact: true },
  { href: '/dashboard/publications', label: 'dashboard.publications' },
  { href: '/dashboard/projects', label: 'dashboard.projects' },
  { href: '/dashboard/exhibitions', label: 'dashboard.exhibitions' },
  { href: '/dashboard/awards', label: 'dashboard.awards' },
  { href: '/dashboard/news', label: 'dashboard.news' },
  { href: '/dashboard/media', label: 'dashboard.media' },
]

export function DashboardSidebar({
  profile,
  locale,
}: {
  profile: Profile | null
  locale: string
}) {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* BU Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/bu_monogramm.svg"
            alt="Brand University"
            width={32}
            height={32}
            className="h-7 w-auto"
          />
          <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase border-l border-sidebar-border pl-2">
            Research
          </span>
        </Link>
      </div>

      {/* Grüne Linie – BU-Akzent */}
      <div className="h-0.5 bg-primary" />

      {/* Profilinfo */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <p className="text-xs font-bold text-sidebar-foreground truncate">
          {profile?.name_en ?? profile?.name_de ?? 'Professor'}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {profile?.is_admin ? 'Professor · Admin' : 'Professor'}
        </p>
        {profile?.is_published ? (
          <span className="mt-1 inline-block text-[10px] text-primary font-bold">● Live</span>
        ) : (
          <span className="mt-1 inline-block text-[10px] text-muted-foreground">○ Draft</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href as '/dashboard'}
              className={cn(
                'block px-3 py-2 rounded-sm text-xs font-bold tracking-wide transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              {t(item.label as Parameters<typeof t>[0])}
            </Link>
          )
        })}

        {profile?.is_admin && (
          <div className="mt-4 space-y-0.5">
            <Link
              href="/admin"
              className={cn(
                'block px-3 py-2 rounded-sm text-xs font-bold tracking-wide transition-colors border border-sidebar-border',
                pathname === '/admin'
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              {t('nav.admin')}
            </Link>
            <Link
              href="/admin/content"
              className={cn(
                'block px-3 py-2 rounded-sm text-xs font-bold tracking-wide transition-colors border border-sidebar-border',
                pathname.startsWith('/admin/content')
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              Page Content
            </Link>
          </div>
        )}
      </nav>

      {/* Abmelden */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleSignOut}
          className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors font-bold tracking-wide py-2 px-3"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

import { getTranslations } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import type { Metadata } from 'next'
import Image from 'next/image'
import { LoginButtons } from './login-buttons'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('login')
  return { title: `${t('title')} – BU Research` }
}

export default function LoginPage() {
  const t = useTranslations('login')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Grüner Akzentbalken oben */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-primary" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <Image
            src="/images/bu_monogramm.svg"
            alt="Brand University"
            width={44}
            height={44}
            priority
            className="h-12 w-auto mb-6"
          />
          <div className="w-8 h-0.5 bg-primary mb-5" />
          <h1 className="text-xl font-bold tracking-wide">{t('title')}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground text-center">{t('subtitle')}</p>
        </div>

        <LoginButtons />

        <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
          {t('notice')}
        </p>
      </div>

      {/* Footer */}
      <p className="fixed bottom-6 text-[10px] text-muted-foreground tracking-wider">
        © {new Date().getFullYear()} Brand University
      </p>
    </div>
  )
}

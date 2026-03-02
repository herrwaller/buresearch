import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './lib/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const protectedRoutes = ['/dashboard', '/dashboard/', '/admin', '/admin/']
const authRoutes = ['/login']

function isProtected(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}

export async function proxy(request: NextRequest) {
  // Strip locale prefix to check route
  const { pathname } = request.nextUrl
  const pathnameWithoutLocale = pathname.replace(/^\/(en|de|cn)/, '') || '/'

  // Run intl middleware first to handle locale routing
  const intlResponse = intlMiddleware(request)

  // For protected routes, check auth
  if (isProtected(pathnameWithoutLocale)) {
    let response = intlResponse || NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const locale = pathname.match(/^\/(en|de|cn)/)?.[1] || 'en'
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return response
  }

  return intlResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|fonts|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|otf|ttf|woff|woff2)$).*)',
  ],
}

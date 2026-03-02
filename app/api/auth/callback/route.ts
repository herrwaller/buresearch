import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/en/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/en/login?error=no_code`)
  }

  // Build the redirect response first so we can attach cookies to it
  const redirectUrl = process.env.NODE_ENV === 'development'
    ? `${origin}${next}`
    : `${request.headers.get('x-forwarded-proto') ?? 'https'}://${request.headers.get('x-forwarded-host') ?? new URL(origin).host}${next}`

  const response = NextResponse.redirect(redirectUrl)

  // Create Supabase client that writes cookies directly onto the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/en/login?error=auth_error`)
  }

  // Create profile row if this is the first login
  const adminClient = createAdminClient()
  const { data: existing } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .single()

  if (!existing) {
    const email = data.user.email ?? ''
    const nameParts = (data.user.user_metadata?.full_name ?? email.split('@')[0]).split(' ')
    const lastName = nameParts[nameParts.length - 1].toLowerCase()

    await adminClient.from('profiles').insert({
      id: data.user.id,
      email,
      name_en: data.user.user_metadata?.full_name ?? null,
      slug: lastName,
      role: 'professor',
      is_published: false,
    })

    // New user — force password setup before dashboard
    const locale = next.match(/^\/(en|de|cn)/)?.[1] ?? 'en'
    return NextResponse.redirect(
      new URL(`/${locale}/setup-password`, request.url),
      { headers: response.headers }
    )
  }

  return response
}

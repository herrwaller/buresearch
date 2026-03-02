import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminPanel } from './admin-panel'
import { Nav } from '@/components/nav'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin – BU Research' }

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect(`/${locale}/dashboard`)
  }

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <>
      <Nav />
      <main className="pt-14">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-8">
            <p className="text-xs tracking-widest text-primary uppercase mb-2">Administration</p>
            <h1 className="text-3xl font-light">Admin Panel</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Manage faculty profiles, roles, and publish status.
            </p>
          </div>
          <AdminPanel profiles={profiles ?? []} currentUserId={user.id} />
        </div>
      </main>
    </>
  )
}

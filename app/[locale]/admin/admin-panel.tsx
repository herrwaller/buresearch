'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Profile } from '@/lib/types/database'

export function AdminPanel({
  profiles,
  currentUserId,
}: {
  profiles: Profile[]
  currentUserId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const update = async (id: string, patch: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
    setLoading(id)
    const { error } = await supabase.from('profiles').update(patch).eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Updated')
      router.refresh()
    }
    setLoading(null)
  }

  const published = profiles.filter((p) => p.is_published).length
  const admins = profiles.filter((p) => p.is_admin).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Profiles', value: profiles.length },
          { label: 'Published', value: published },
          { label: 'Admins', value: admins },
        ].map((stat) => (
          <div key={stat.label} className="border border-border rounded p-4 bg-card">
            <p className="text-2xl font-light">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Profiles table */}
      <div className="border border-border rounded overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground">Name</TableHead>
              <TableHead className="text-xs text-muted-foreground w-20">Role</TableHead>
              <TableHead className="text-xs text-muted-foreground w-20">Status</TableHead>
              <TableHead className="text-xs text-muted-foreground w-32">Slug</TableHead>
              <TableHead className="text-xs text-muted-foreground w-32">Joined</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((prof) => (
              <TableRow key={prof.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-sm overflow-hidden bg-muted shrink-0">
                      {prof.photo_url ? (
                        <Image
                          src={prof.photo_url}
                          alt={prof.name_en ?? ''}
                          width={28}
                          height={28}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                          {(prof.name_en ?? prof.name_de ?? '?').charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm">{prof.name_en ?? prof.name_de ?? '(no name)'}</p>
                      <p className="text-xs text-muted-foreground">{prof.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground w-fit">
                      Professor
                    </Badge>
                    {prof.is_admin && (
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary w-fit">
                        Admin
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`text-xs ${prof.is_published ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {prof.is_published ? '● Live' : '○ Draft'}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {prof.slug ? `/${prof.slug}` : '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(prof.created_at).toLocaleDateString('en-GB')}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        disabled={loading === prof.id}
                      >
                        {loading === prof.id ? '...' : 'Actions'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card border-border text-xs" align="end">
                      {/* Publish toggle */}
                      <DropdownMenuItem
                        className="text-xs cursor-pointer"
                        onClick={() => update(prof.id, { is_published: !prof.is_published })}
                      >
                        {prof.is_published ? 'Unpublish Profile' : 'Publish Profile'}
                      </DropdownMenuItem>

                      {/* Admin toggle (can't remove own admin rights) */}
                      {prof.id !== currentUserId && (
                        <DropdownMenuItem
                          className="text-xs cursor-pointer"
                          onClick={() => update(prof.id, { is_admin: !prof.is_admin })}
                        >
                          {prof.is_admin ? 'Remove Admin Rights' : 'Grant Admin Rights'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

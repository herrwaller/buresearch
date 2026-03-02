'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Exhibition } from '@/lib/types/database'

type FormState = {
  title: string
  venue: string
  location: string
  year: string
  type: 'Solo' | 'Group' | 'Curated' | 'Other'
  description: string
}

const empty: FormState = {
  title: '',
  venue: '',
  location: '',
  year: '',
  type: 'Solo',
  description: '',
}

export function ExhibitionsManager({
  exhibitions,
  profileId,
}: {
  exhibitions: Exhibition[]
  profileId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(empty)

  const set = (k: keyof FormState, v: string) =>
    setForm((p) => ({ ...p, [k]: v }))

  const openNew = () => {
    setEditId(null)
    setForm(empty)
    setOpen(true)
  }

  const openEdit = (ex: Exhibition) => {
    setEditId(ex.id)
    setForm({
      title: ex.title,
      venue: ex.venue ?? '',
      location: ex.location ?? '',
      year: ex.year ? String(ex.year) : '',
      type: ex.type,
      description: ex.description ?? '',
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)

    const payload = {
      profile_id: profileId,
      title: form.title.trim(),
      venue: form.venue || null,
      location: form.location || null,
      year: form.year ? parseInt(form.year) : null,
      type: form.type,
      description: form.description || null,
    }

    const { error } = editId
      ? await supabase.from('exhibitions').update(payload).eq('id', editId)
      : await supabase.from('exhibitions').insert({ ...payload, id: crypto.randomUUID() })

    if (error) toast.error('Save failed: ' + error.message)
    else {
      toast.success(editId ? 'Exhibition updated' : 'Exhibition added')
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exhibition?')) return
    const { error } = await supabase.from('exhibitions').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Deleted'); router.refresh() }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{exhibitions.length} exhibition{exhibitions.length !== 1 ? 's' : ''}</p>
        <Button onClick={openNew} size="sm" className="text-xs bg-primary text-primary-foreground">
          + Add Exhibition
        </Button>
      </div>

      {exhibitions.length === 0 ? (
        <div className="border border-border rounded p-10 text-center text-muted-foreground text-sm">
          No exhibitions yet. Add your first exhibition.
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Title</TableHead>
                <TableHead className="text-xs text-muted-foreground w-20">Type</TableHead>
                <TableHead className="text-xs text-muted-foreground">Venue / Location</TableHead>
                <TableHead className="text-xs text-muted-foreground w-16">Year</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {exhibitions.map((ex) => (
                <TableRow key={ex.id} className="border-border">
                  <TableCell className="text-sm">
                    <p className="font-medium truncate max-w-xs">{ex.title}</p>
                    {ex.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{ex.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ex.type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[ex.venue, ex.location].filter(Boolean).join(', ') || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ex.year ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openEdit(ex)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => handleDelete(ex.id)}>Del</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {editId ? 'Edit Exhibition' : 'Add Exhibition'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Field label="Exhibition Title *">
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} className="text-sm bg-secondary border-border" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Type">
                <Select value={form.type} onValueChange={(v) => set('type', v as FormState['type'])}>
                  <SelectTrigger className="text-xs bg-secondary border-border h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Solo" className="text-xs">Solo</SelectItem>
                    <SelectItem value="Group" className="text-xs">Group</SelectItem>
                    <SelectItem value="Curated" className="text-xs">Curated</SelectItem>
                    <SelectItem value="Other" className="text-xs">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Year">
                <Input value={form.year} onChange={(e) => set('year', e.target.value)} type="number" placeholder="2024" className="text-sm bg-secondary border-border h-8" />
              </Field>
            </div>
            <Field label="Venue (Gallery / Museum)">
              <Input value={form.venue} onChange={(e) => set('venue', e.target.value)} className="text-sm bg-secondary border-border" placeholder="Hamburger Kunsthalle" />
            </Field>
            <Field label="Location (City, Country)">
              <Input value={form.location} onChange={(e) => set('location', e.target.value)} className="text-sm bg-secondary border-border" placeholder="Hamburg, Germany" />
            </Field>
            <Field label="Description (optional)">
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="text-sm bg-secondary border-border min-h-16 resize-none" />
            </Field>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="text-xs bg-primary text-primary-foreground">
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" className="text-xs border-border" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

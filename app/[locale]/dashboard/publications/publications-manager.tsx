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
import type { Publication } from '@/lib/types/database'

type FormState = {
  title: string
  authors: string
  year: string
  journal: string
  doi: string
  url: string
  type: 'paper' | 'monograph' | 'collection'
  discipline: 'science' | 'arts'
  abstract: string
  is_featured: boolean
}

const empty: FormState = {
  title: '',
  authors: '',
  year: String(new Date().getFullYear()),
  journal: '',
  doi: '',
  url: '',
  type: 'paper',
  discipline: 'science',
  abstract: '',
  is_featured: false,
}

export function PublicationsManager({
  publications,
  profileId,
}: {
  publications: Publication[]
  profileId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(empty)

  const set = (k: keyof FormState, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }))

  const openNew = () => {
    setEditId(null)
    setForm(empty)
    setOpen(true)
  }

  const openEdit = (pub: Publication) => {
    setEditId(pub.id)
    setForm({
      title: pub.title,
      authors: pub.authors.join(', '),
      year: String(pub.year),
      journal: pub.journal ?? '',
      doi: pub.doi ?? '',
      url: pub.url ?? '',
      type: pub.type,
      discipline: pub.discipline,
      abstract: pub.abstract ?? '',
      is_featured: pub.is_featured ?? false,
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)

    const payload = {
      profile_id: profileId,
      title: form.title.trim(),
      authors: form.authors.split(',').map((a) => a.trim()).filter(Boolean),
      year: parseInt(form.year) || new Date().getFullYear(),
      journal: form.journal || null,
      doi: form.doi || null,
      url: form.url || null,
      type: form.type,
      discipline: form.discipline,
      abstract: form.abstract || null,
      is_featured: form.is_featured,
    }

    const { error } = editId
      ? await supabase.from('publications').update(payload).eq('id', editId)
      : await supabase.from('publications').insert({ ...payload, id: crypto.randomUUID() })

    if (error) toast.error('Save failed: ' + error.message)
    else {
      toast.success(editId ? 'Publication updated' : 'Publication added')
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this publication?')) return
    const { error } = await supabase.from('publications').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Deleted')
      router.refresh()
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{publications.length} publication{publications.length !== 1 ? 's' : ''}</p>
        <Button onClick={openNew} size="sm" className="text-xs bg-primary text-primary-foreground">
          + Add Publication
        </Button>
      </div>

      {publications.length === 0 ? (
        <div className="border border-border rounded p-10 text-center text-muted-foreground text-sm">
          No publications yet. Add your first one.
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground w-6"></TableHead>
                <TableHead className="text-xs text-muted-foreground">Title</TableHead>
                <TableHead className="text-xs text-muted-foreground w-16">Year</TableHead>
                <TableHead className="text-xs text-muted-foreground w-24">Type</TableHead>
                <TableHead className="text-xs text-muted-foreground w-20">Discipline</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {publications.map((pub) => (
                <TableRow key={pub.id} className="border-border">
                  <TableCell className="text-center">
                    {pub.is_featured && (
                      <span className="text-yellow-500 text-sm" title="Featured">★</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <p className="font-medium truncate max-w-xs">{pub.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{pub.authors.join(', ')}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{pub.year}</TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">{pub.type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">{pub.discipline}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openEdit(pub)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => handleDelete(pub.id)}>
                        Del
                      </Button>
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
              {editId ? 'Edit Publication' : 'Add Publication'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <Field label="Title *">
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} className="text-sm bg-secondary border-border" />
            </Field>
            <Field label="Authors (comma-separated)">
              <Input value={form.authors} onChange={(e) => set('authors', e.target.value)} className="text-sm bg-secondary border-border" placeholder="Müller, A., Schmidt, B." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Year">
                <Input value={form.year} onChange={(e) => set('year', e.target.value)} type="number" className="text-sm bg-secondary border-border" />
              </Field>
              <Field label="Journal / Publisher">
                <Input value={form.journal} onChange={(e) => set('journal', e.target.value)} className="text-sm bg-secondary border-border" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={form.type} onValueChange={(v) => set('type', v as FormState['type'])}>
                  <SelectTrigger className="text-xs bg-secondary border-border h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="paper" className="text-xs">Journal Article</SelectItem>
                    <SelectItem value="monograph" className="text-xs">Monograph</SelectItem>
                    <SelectItem value="collection" className="text-xs">Edited Collection</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Discipline">
                <Select value={form.discipline} onValueChange={(v) => set('discipline', v as FormState['discipline'])}>
                  <SelectTrigger className="text-xs bg-secondary border-border h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="science" className="text-xs">Science</SelectItem>
                    <SelectItem value="arts" className="text-xs">Arts</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="DOI">
                <Input value={form.doi} onChange={(e) => set('doi', e.target.value)} className="text-sm bg-secondary border-border" placeholder="10.xxxx/xxxxx" />
              </Field>
              <Field label="URL">
                <Input value={form.url} onChange={(e) => set('url', e.target.value)} className="text-sm bg-secondary border-border" placeholder="https://..." />
              </Field>
            </div>
            <Field label="Abstract">
              <Textarea value={form.abstract} onChange={(e) => set('abstract', e.target.value)} className="text-sm bg-secondary border-border min-h-20 resize-none" />
            </Field>

            {/* Featured toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => set('is_featured', e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              <span className="text-xs text-muted-foreground">
                ★ Feature on public profile (shows in &quot;Selected Publications&quot;)
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="text-xs bg-primary text-primary-foreground">
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" className="text-xs border-border" onClick={() => setOpen(false)}>
                Cancel
              </Button>
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

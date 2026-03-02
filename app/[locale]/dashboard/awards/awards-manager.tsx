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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Award } from '@/lib/types/database'

type FormState = {
  title: string
  awarding_body: string
  year: string
  description: string
}

const empty: FormState = {
  title: '',
  awarding_body: '',
  year: '',
  description: '',
}

export function AwardsManager({
  awards,
  profileId,
}: {
  awards: Award[]
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

  const openEdit = (award: Award) => {
    setEditId(award.id)
    setForm({
      title: award.title,
      awarding_body: award.awarding_body ?? '',
      year: award.year ? String(award.year) : '',
      description: award.description ?? '',
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)

    const payload = {
      profile_id: profileId,
      title: form.title.trim(),
      awarding_body: form.awarding_body || null,
      year: form.year ? parseInt(form.year) : null,
      description: form.description || null,
    }

    const { error } = editId
      ? await supabase.from('awards').update(payload).eq('id', editId)
      : await supabase.from('awards').insert({ ...payload, id: crypto.randomUUID() })

    if (error) toast.error('Save failed: ' + error.message)
    else {
      toast.success(editId ? 'Award updated' : 'Award added')
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this award?')) return
    const { error } = await supabase.from('awards').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Deleted'); router.refresh() }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{awards.length} award{awards.length !== 1 ? 's' : ''}</p>
        <Button onClick={openNew} size="sm" className="text-xs bg-primary text-primary-foreground">
          + Add Award
        </Button>
      </div>

      {awards.length === 0 ? (
        <div className="border border-border rounded p-10 text-center text-muted-foreground text-sm">
          No awards yet. Add your first award or distinction.
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Award</TableHead>
                <TableHead className="text-xs text-muted-foreground">Awarding Body</TableHead>
                <TableHead className="text-xs text-muted-foreground w-16">Year</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {awards.map((award) => (
                <TableRow key={award.id} className="border-border">
                  <TableCell className="text-sm">
                    <p className="font-medium truncate max-w-xs">{award.title}</p>
                    {award.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{award.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{award.awarding_body ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{award.year ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openEdit(award)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => handleDelete(award.id)}>Del</Button>
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
              {editId ? 'Edit Award' : 'Add Award'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Field label="Award / Distinction *">
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} className="text-sm bg-secondary border-border" placeholder="Best Exhibition Award" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Awarding Body / Institution">
                <Input value={form.awarding_body} onChange={(e) => set('awarding_body', e.target.value)} className="text-sm bg-secondary border-border" placeholder="Federal Ministry of Culture" />
              </Field>
              <Field label="Year">
                <Input value={form.year} onChange={(e) => set('year', e.target.value)} type="number" placeholder="2024" className="text-sm bg-secondary border-border" />
              </Field>
            </div>
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

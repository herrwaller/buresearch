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
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Partner = {
  id: string
  name: string
  url: string | null
  description: string | null
  sort_order: number
}

type FormState = {
  name: string
  url: string
  description: string
}

const empty: FormState = { name: '', url: '', description: '' }

export function HubPartnersManager({ partners }: { partners: Partner[] }) {
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

  const openEdit = (p: Partner) => {
    setEditId(p.id)
    setForm({ name: p.name, url: p.url ?? '', description: p.description ?? '' })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required')
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      url: form.url || null,
      description: form.description || null,
    }

    const { error } = editId
      ? await supabase.from('hub_partners').update(payload).eq('id', editId)
      : await supabase.from('hub_partners').insert({ ...payload, id: crypto.randomUUID(), sort_order: partners.length })

    if (error) toast.error('Save failed: ' + error.message)
    else {
      toast.success(editId ? 'Updated' : 'Added')
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this partner?')) return
    const { error } = await supabase.from('hub_partners').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Deleted'); router.refresh() }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{partners.length} institution{partners.length !== 1 ? 's' : ''}</p>
        <Button onClick={openNew} size="sm" className="text-xs bg-primary text-primary-foreground h-7">
          + Add Institution
        </Button>
      </div>

      {partners.length === 0 ? (
        <div className="border border-dashed border-border rounded p-6 text-center text-xs text-muted-foreground">
          No partner institutions yet.
        </div>
      ) : (
        <div className="space-y-2">
          {partners.map((p) => (
            <div key={p.id} className="flex items-start gap-3 p-3 border border-border rounded bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                {p.url && <p className="text-xs text-primary truncate">{p.url}</p>}
                {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openEdit(p)}>Edit</Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => handleDelete(p.id)}>Del</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {editId ? 'Edit Institution' : 'Add Institution'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Institution Name *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} className="text-sm bg-secondary border-border" placeholder="Tongji University" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Website URL (optional)</Label>
              <Input value={form.url} onChange={(e) => set('url', e.target.value)} className="text-sm bg-secondary border-border" placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="text-sm bg-secondary border-border min-h-20 resize-none" placeholder="Short description of the partnership…" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={saving} className="text-xs bg-primary text-primary-foreground">
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" className="text-xs border-border" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

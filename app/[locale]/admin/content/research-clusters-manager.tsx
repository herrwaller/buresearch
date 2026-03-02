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

type Cluster = {
  id: string
  title: string
  description: string | null
  sort_order: number
}

type FormState = {
  title: string
  description: string
}

const empty: FormState = { title: '', description: '' }

export function ResearchClustersManager({ clusters }: { clusters: Cluster[] }) {
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

  const openEdit = (c: Cluster) => {
    setEditId(c.id)
    setForm({ title: c.title, description: c.description ?? '' })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      description: form.description || null,
    }

    const { error } = editId
      ? await supabase.from('research_clusters').update(payload).eq('id', editId)
      : await supabase.from('research_clusters').insert({ ...payload, id: crypto.randomUUID(), sort_order: clusters.length })

    if (error) toast.error('Save failed: ' + error.message)
    else {
      toast.success(editId ? 'Updated' : 'Added')
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this cluster?')) return
    const { error } = await supabase.from('research_clusters').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Deleted'); router.refresh() }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{clusters.length} cluster{clusters.length !== 1 ? 's' : ''}</p>
        <Button onClick={openNew} size="sm" className="text-xs bg-primary text-primary-foreground h-7">
          + Add Cluster
        </Button>
      </div>

      {clusters.length === 0 ? (
        <div className="border border-dashed border-border rounded p-6 text-center text-xs text-muted-foreground">
          No research clusters yet.
        </div>
      ) : (
        <div className="space-y-2">
          {clusters.map((c) => (
            <div key={c.id} className="flex items-start gap-3 p-3 border border-border rounded bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openEdit(c)}>Edit</Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => handleDelete(c.id)}>Del</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {editId ? 'Edit Cluster' : 'Add Cluster'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cluster Title *</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} className="text-sm bg-secondary border-border" placeholder="Brand & Identity" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="text-sm bg-secondary border-border min-h-20 resize-none" placeholder="Short description of the research cluster…" />
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

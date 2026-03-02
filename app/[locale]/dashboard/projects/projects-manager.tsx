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
import type { Project } from '@/lib/types/database'

type FormState = {
  title: string
  description: string
  role: 'PI' | 'Co-PI' | 'Member' | 'Other'
  start_year: string
  end_year: string
  funding_source: string
}

const empty: FormState = {
  title: '',
  description: '',
  role: 'PI',
  start_year: '',
  end_year: '',
  funding_source: '',
}

export function ProjectsManager({
  projects,
  profileId,
}: {
  projects: Project[]
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

  const openEdit = (project: Project) => {
    setEditId(project.id)
    setForm({
      title: project.title,
      description: project.description ?? '',
      role: project.role,
      start_year: project.start_year ? String(project.start_year) : '',
      end_year: project.end_year ? String(project.end_year) : '',
      funding_source: project.funding_source ?? '',
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)

    const payload = {
      profile_id: profileId,
      title: form.title.trim(),
      description: form.description || null,
      role: form.role,
      start_year: form.start_year ? parseInt(form.start_year) : null,
      end_year: form.end_year ? parseInt(form.end_year) : null,
      funding_source: form.funding_source || null,
    }

    const { error } = editId
      ? await supabase.from('projects').update(payload).eq('id', editId)
      : await supabase.from('projects').insert({ ...payload, id: crypto.randomUUID() })

    if (error) toast.error('Save failed: ' + error.message)
    else {
      toast.success(editId ? 'Project updated' : 'Project added')
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Deleted')
      router.refresh()
    }
  }

  const formatYearRange = (project: Project) => {
    if (project.start_year && project.end_year) return `${project.start_year}–${project.end_year}`
    if (project.start_year) return `${project.start_year}–present`
    return '—'
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        <Button onClick={openNew} size="sm" className="text-xs bg-primary text-primary-foreground">
          + Add Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="border border-border rounded p-10 text-center text-muted-foreground text-sm">
          No projects yet. Add your first research project.
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Title</TableHead>
                <TableHead className="text-xs text-muted-foreground w-20">Role</TableHead>
                <TableHead className="text-xs text-muted-foreground w-28">Period</TableHead>
                <TableHead className="text-xs text-muted-foreground">Funding</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="border-border">
                  <TableCell className="text-sm">
                    <p className="font-medium truncate max-w-xs">{project.title}</p>
                    {project.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{project.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{project.role}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatYearRange(project)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {project.funding_source ?? '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openEdit(project)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => handleDelete(project.id)}>
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
              {editId ? 'Edit Project' : 'Add Project'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <Field label="Project Title *">
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} className="text-sm bg-secondary border-border" />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="text-sm bg-secondary border-border min-h-20 resize-none" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Role">
                <Select value={form.role} onValueChange={(v) => set('role', v as FormState['role'])}>
                  <SelectTrigger className="text-xs bg-secondary border-border h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="PI" className="text-xs">PI</SelectItem>
                    <SelectItem value="Co-PI" className="text-xs">Co-PI</SelectItem>
                    <SelectItem value="Member" className="text-xs">Member</SelectItem>
                    <SelectItem value="Other" className="text-xs">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Start Year">
                <Input value={form.start_year} onChange={(e) => set('start_year', e.target.value)} type="number" placeholder="2020" className="text-sm bg-secondary border-border h-8" />
              </Field>
              <Field label="End Year">
                <Input value={form.end_year} onChange={(e) => set('end_year', e.target.value)} type="number" placeholder="2024" className="text-sm bg-secondary border-border h-8" />
              </Field>
            </div>
            <Field label="Funding Source / Organization">
              <Input value={form.funding_source} onChange={(e) => set('funding_source', e.target.value)} className="text-sm bg-secondary border-border" placeholder="DFG, BMBF, EU Horizon…" />
            </Field>

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

'use client'

import { useRef, useState } from 'react'
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormState = {
  title: string
  authors: string
  year: string
  journal: string
  volume: string
  issue: string
  pages: string
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
  volume: '',
  issue: '',
  pages: '',
  doi: '',
  url: '',
  type: 'paper',
  discipline: 'science',
  abstract: '',
  is_featured: false,
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

const CSV_HEADERS = 'authors;year;title;journal;volume;issue;pages;doi;url;type;discipline;is_featured;abstract'

/** Escape a single field for semicolon-delimited CSV */
function escapeField(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}

/** Convert a Publication row to a CSV line */
function pubToCsvRow(pub: Publication): string {
  const fields = [
    pub.authors.join(', '),
    String(pub.year),
    pub.title,
    pub.journal ?? '',
    pub.volume ?? '',
    pub.issue ?? '',
    pub.pages ?? '',
    pub.doi ?? '',
    pub.url ?? '',
    pub.type,
    pub.discipline,
    pub.is_featured ? 'true' : 'false',
    pub.abstract ?? '',
  ]
  return fields.map(escapeField).join(';')
}

/** Minimal CSV parser for semicolon-delimited files with optional quoted fields */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote?
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ';') {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current)
  return fields
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PublicationsManager({
  publications,
  profileId,
}: {
  publications: Publication[]
  profileId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
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
      volume: pub.volume ?? '',
      issue: pub.issue ?? '',
      pages: pub.pages ?? '',
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
      volume: form.volume || null,
      issue: form.issue || null,
      pages: form.pages || null,
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

  // -------------------------------------------------------------------------
  // CSV: Template download
  // -------------------------------------------------------------------------
  const handleDownloadTemplate = () => {
    const example1 = [
      'Smith, J. A., & Johnson, B. C.',
      '2023',
      'Titel des Artikels',
      'Journal of Research',
      '45',
      '3',
      '123-145',
      '10.1234/doi',
      '',
      'paper',
      'science',
      'false',
      'Optionaler Abstract',
    ].map(escapeField).join(';')

    const example2 = [
      'Müller, A.',
      '2022',
      'Buchtitel',
      '',
      '',
      '',
      '',
      '',
      'https://example.com',
      'monograph',
      'arts',
      'true',
      '',
    ].map(escapeField).join(';')

    triggerDownload([CSV_HEADERS, example1, example2].join('\n'), 'publications_template.csv')
  }

  // -------------------------------------------------------------------------
  // CSV: Export
  // -------------------------------------------------------------------------
  const handleExport = () => {
    if (publications.length === 0) {
      toast.error('No publications to export')
      return
    }
    const rows = publications.map(pubToCsvRow)
    triggerDownload([CSV_HEADERS, ...rows].join('\n'), 'publications_export.csv')
    toast.success(`${publications.length} publication${publications.length !== 1 ? 's' : ''} exported`)
  }

  // -------------------------------------------------------------------------
  // CSV: Import
  // -------------------------------------------------------------------------
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset so the same file can be re-selected after fixing errors
    e.target.value = ''

    setImporting(true)

    const text = await file.text()
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean)

    if (lines.length < 2) {
      toast.error('CSV is empty or contains only a header row')
      setImporting(false)
      return
    }

    // Skip header row
    const dataLines = lines.slice(1)
    const toInsert: object[] = []
    const errors: string[] = []

    dataLines.forEach((line, idx) => {
      const rowNum = idx + 2 // 1-based, accounting for header
      const fields = parseCsvLine(line)

      const [
        authors_raw,
        year_raw,
        title_raw,
        journal_raw,
        volume_raw,
        issue_raw,
        pages_raw,
        doi_raw,
        url_raw,
        type_raw,
        discipline_raw,
        is_featured_raw,
        abstract_raw,
      ] = fields

      const authorsList = (authors_raw ?? '').split(',').map((a) => a.trim()).filter(Boolean)
      const year = parseInt(year_raw ?? '')
      const title = (title_raw ?? '').trim()
      const type = (type_raw ?? '').trim() as Publication['type']
      const discipline = (discipline_raw ?? '').trim() as Publication['discipline']

      if (!title) {
        errors.push(`Row ${rowNum}: missing title`)
        return
      }
      if (authorsList.length === 0) {
        errors.push(`Row ${rowNum}: missing authors`)
        return
      }
      if (!year || isNaN(year)) {
        errors.push(`Row ${rowNum}: invalid year "${year_raw}"`)
        return
      }
      if (!['paper', 'monograph', 'collection'].includes(type)) {
        errors.push(`Row ${rowNum}: invalid type "${type_raw}" (must be paper|monograph|collection)`)
        return
      }
      if (!['science', 'arts'].includes(discipline)) {
        errors.push(`Row ${rowNum}: invalid discipline "${discipline_raw}" (must be science|arts)`)
        return
      }

      toInsert.push({
        id: crypto.randomUUID(),
        profile_id: profileId,
        title,
        authors: authorsList,
        year,
        journal: journal_raw?.trim() || null,
        volume: volume_raw?.trim() || null,
        issue: issue_raw?.trim() || null,
        pages: pages_raw?.trim() || null,
        doi: doi_raw?.trim() || null,
        url: url_raw?.trim() || null,
        type,
        discipline,
        is_featured: is_featured_raw?.trim().toLowerCase() === 'true',
        abstract: abstract_raw?.trim() || null,
      })
    })

    if (toInsert.length > 0) {
      const { error } = await supabase.from('publications').insert(toInsert)
      if (error) {
        toast.error('Import failed: ' + error.message)
        setImporting(false)
        return
      }
      router.refresh()
    }

    const successMsg = `${toInsert.length} publication${toInsert.length !== 1 ? 's' : ''} imported`
    if (errors.length > 0) {
      toast.warning(`${successMsg}, ${errors.length} error${errors.length !== 1 ? 's' : ''}: ${errors.join(' · ')}`)
    } else {
      toast.success(successMsg)
    }

    setImporting(false)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      {/* Hidden file input for CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImportFile}
      />

      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {publications.length} publication{publications.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={openNew} size="sm" className="text-xs bg-primary text-primary-foreground">
            + Add Publication
          </Button>
          <Button
            onClick={handleDownloadTemplate}
            size="sm"
            variant="outline"
            className="text-xs border-border"
          >
            ↓ Template
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            variant="outline"
            className="text-xs border-border"
            disabled={importing}
          >
            {importing ? 'Importing…' : '↑ Import CSV'}
          </Button>
          <Button
            onClick={handleExport}
            size="sm"
            variant="outline"
            className="text-xs border-border"
          >
            ↓ Export CSV
          </Button>
        </div>
      </div>

      {publications.length === 0 ? (
        <div className="border border-border rounded p-10 text-center text-muted-foreground text-sm">
          No publications yet. Add your first one or import a CSV.
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
            <div className="grid grid-cols-3 gap-3">
              <Field label="Volume">
                <Input value={form.volume} onChange={(e) => set('volume', e.target.value)} className="text-sm bg-secondary border-border" />
              </Field>
              <Field label="Issue">
                <Input value={form.issue} onChange={(e) => set('issue', e.target.value)} className="text-sm bg-secondary border-border" />
              </Field>
              <Field label="Pages">
                <Input value={form.pages} onChange={(e) => set('pages', e.target.value)} className="text-sm bg-secondary border-border" placeholder="123-145" />
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

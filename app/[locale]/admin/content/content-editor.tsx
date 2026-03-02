'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { HubPartnersManager } from './hub-partners-manager'
import { ResearchClustersManager } from './research-clusters-manager'

type FieldDef = { key: string; label: string; multiline: boolean }
type Schema = Record<string, FieldDef[]>

type Partner = {
  id: string
  name: string
  url: string | null
  description: string | null
  sort_order: number
}

type Cluster = {
  id: string
  title: string
  description: string | null
  sort_order: number
}

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'cn', label: '中文' },
]

export function ContentEditor({
  schema,
  pageLabels,
  initial,
  hubPartners,
  researchClusters,
}: {
  schema: Schema
  pageLabels: Record<string, string>
  initial: Record<string, Record<string, Record<string, string>>>
  hubPartners?: Partner[]
  researchClusters?: Cluster[]
}) {
  const supabase = createClient()
  const pages = Object.keys(schema)

  const [activePage, setActivePage] = useState(pages[0])
  const [activeLocale, setActiveLocale] = useState('en')
  const [saving, setSaving] = useState(false)

  // Local state: values[page][locale][key]
  const [values, setValues] = useState<Record<string, Record<string, Record<string, string>>>>(initial)

  const getValue = (page: string, locale: string, key: string) =>
    values[page]?.[locale]?.[key] ?? ''

  const setValue = (page: string, locale: string, key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [locale]: {
          ...prev[page]?.[locale],
          [key]: value,
        },
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const fields = schema[activePage]

    const upserts = fields.map((f) => ({
      page: activePage,
      locale: activeLocale,
      key: f.key,
      value: getValue(activePage, activeLocale, f.key),
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('page_content')
      .upsert(upserts, { onConflict: 'page,locale,key' })

    if (error) toast.error('Failed to save: ' + error.message)
    else toast.success('Content saved')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Page tabs */}
      <div className="flex gap-1 border-b border-border">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setActivePage(page)}
            className={cn(
              'px-4 py-2 text-xs font-bold tracking-wide transition-colors border-b-2 -mb-px',
              activePage === page
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {pageLabels[page]}
          </button>
        ))}
      </div>

      {/* Locale tabs */}
      <div className="flex rounded-sm border border-border overflow-hidden w-fit">
        {LOCALES.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setActiveLocale(code)}
            className={cn(
              'px-4 py-1.5 text-xs font-bold tracking-wide transition-colors',
              activeLocale === code
                ? 'bg-[#63AE26] text-white'
                : 'bg-white text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-5">
        {schema[activePage].map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground tracking-wide uppercase">
              {field.label}
            </label>
            {field.multiline ? (
              <textarea
                value={getValue(activePage, activeLocale, field.key)}
                onChange={(e) => setValue(activePage, activeLocale, field.key, e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-sm border border-border bg-white text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-y"
              />
            ) : (
              <input
                type="text"
                value={getValue(activePage, activeLocale, field.key)}
                onChange={(e) => setValue(activePage, activeLocale, field.key, e.target.value)}
                className="w-full h-10 px-3 rounded-sm border border-border bg-white text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            )}
          </div>
        ))}
      </div>

      {activePage === 'hub' && (
        <div className="pt-8 mt-4 border-t border-border space-y-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-1">Partner Institutions</p>
            <p className="text-xs text-muted-foreground mb-4">Manages the structured partner list on the Eurasian Hub page.</p>
          </div>
          <HubPartnersManager partners={hubPartners ?? []} />
        </div>
      )}

      {activePage === 'paradigm' && (
        <div className="pt-8 mt-4 border-t border-border space-y-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-1">Research Clusters</p>
            <p className="text-xs text-muted-foreground mb-4">Manages the research cluster cards on the Research Paradigm page.</p>
          </div>
          <ResearchClustersManager clusters={researchClusters ?? []} />
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-6 rounded-sm bg-[#63AE26] hover:bg-[#57991f] disabled:opacity-50 transition-colors text-sm font-bold text-white tracking-wide"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Saves the current page + language combination. Empty fields fall back to defaults.
        </p>
      </div>
    </div>
  )
}

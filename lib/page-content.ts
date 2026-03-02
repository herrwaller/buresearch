import { createClient } from './supabase/server'

export type ContentMap = Record<string, string>

export async function getPageContent(page: string, locale: string): Promise<ContentMap> {
  const supabase = await createClient()

  // Fetch both the requested locale and English (used as fallback)
  const locales = locale === 'en' ? ['en'] : ['en', locale]
  const { data } = await supabase
    .from('page_content')
    .select('key, value, locale')
    .eq('page', page)
    .in('locale', locales)

  const result: ContentMap = {}
  // Apply English first as base, then override with locale-specific values
  for (const l of ['en', locale]) {
    for (const row of (data ?? []).filter((r) => r.locale === l)) {
      if (row.value) result[row.key] = row.value
    }
  }
  return result
}

// Content schema — defines which keys exist per page
export const PAGE_SCHEMA: Record<string, { key: string; label: string; multiline: boolean }[]> = {
  paradigm: [
    { key: 'headline',               label: 'Headline',                           multiline: false },
    { key: 'subheadline',            label: 'Subheadline',                        multiline: false },
    { key: 'transdisciplinary_body', label: 'Transdisciplinary Approach – Abs. 1', multiline: true  },
    { key: 'transdisciplinary_body2',label: 'Transdisciplinary Approach – Abs. 2', multiline: true  },
    { key: 'quality_body',           label: 'Quality Standards',                  multiline: true  },
  ],
  hub: [
    { key: 'title',                 label: 'Page Title',           multiline: false },
    { key: 'subtitle',              label: 'Subtitle',             multiline: false },
    { key: 'mission_body',          label: 'Mission',              multiline: true  },
    { key: 'current_initiatives',   label: 'Current Initiatives',  multiline: true  },
    { key: 'contact_body',          label: 'Contact',              multiline: false },
  ],
}

export const PAGE_LABELS: Record<string, string> = {
  paradigm: 'Research Paradigm',
  hub:      'Eurasian Hub',
}

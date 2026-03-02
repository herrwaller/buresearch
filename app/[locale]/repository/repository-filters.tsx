'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  years: number[]
  currentFilters: {
    year?: string
    author?: string
    discipline?: string
    type?: string
  }
}

export function RepositoryFilters({ years, currentFilters }: Props) {
  const t = useTranslations('repository')
  const router = useRouter()
  const pathname = usePathname()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams()
      if (currentFilters.year) params.set('year', currentFilters.year)
      if (currentFilters.author) params.set('author', currentFilters.author)
      if (currentFilters.discipline) params.set('discipline', currentFilters.discipline)
      if (currentFilters.type) params.set('type', currentFilters.type)

      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      router.push(`${pathname}?${params.toString()}`)
    },
    [currentFilters, pathname, router]
  )

  const clearAll = () => router.push(pathname)

  const hasFilters = Object.values(currentFilters).some(Boolean)

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Year */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {t('filterYear')}
        </label>
        <Select
          value={currentFilters.year ?? 'all'}
          onValueChange={(v) => updateFilter('year', v)}
        >
          <SelectTrigger className="w-32 h-8 text-xs border-border bg-card">
            <SelectValue placeholder={t('allYears')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-xs">{t('allYears')}</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Discipline */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {t('filterDiscipline')}
        </label>
        <Select
          value={currentFilters.discipline ?? 'all'}
          onValueChange={(v) => updateFilter('discipline', v)}
        >
          <SelectTrigger className="w-36 h-8 text-xs border-border bg-card">
            <SelectValue placeholder={t('allDisciplines')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-xs">{t('allDisciplines')}</SelectItem>
            <SelectItem value="science" className="text-xs">{t('science')}</SelectItem>
            <SelectItem value="arts" className="text-xs">{t('arts')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {t('filterType')}
        </label>
        <Select
          value={currentFilters.type ?? 'all'}
          onValueChange={(v) => updateFilter('type', v)}
        >
          <SelectTrigger className="w-44 h-8 text-xs border-border bg-card">
            <SelectValue placeholder={t('allTypes')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-xs">{t('allTypes')}</SelectItem>
            <SelectItem value="paper" className="text-xs">{t('paper')}</SelectItem>
            <SelectItem value="monograph" className="text-xs">{t('monograph')}</SelectItem>
            <SelectItem value="collection" className="text-xs">{t('collection')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Author search */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {t('filterAuthor')}
        </label>
        <Input
          className="w-48 h-8 text-xs border-border bg-card"
          placeholder={t('allAuthors')}
          defaultValue={currentFilters.author ?? ''}
          onChange={(e) => {
            const v = e.target.value
            // debounce: update on blur or enter
          }}
          onBlur={(e) => updateFilter('author', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateFilter('author', (e.target as HTMLInputElement).value)
            }
          }}
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground self-end"
          onClick={clearAll}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}

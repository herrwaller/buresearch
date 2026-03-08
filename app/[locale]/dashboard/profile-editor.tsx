'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import Image from 'next/image'
import type { Profile, AcademicEntry, ProfileLink } from '@/lib/types/database'

export function ProfileEditor({ profile, userId }: { profile: Profile | null; userId: string }) {
  const t = useTranslations('dashboard')
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const cvFileRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingCv, setUploadingCv] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url ?? '')
  const [cvFileUrl, setCvFileUrl] = useState(profile?.cv_file_url ?? '')
  const [academicBg, setAcademicBg] = useState<AcademicEntry[]>(
    (profile?.academic_background as AcademicEntry[]) ?? []
  )
  const [links, setLinks] = useState<ProfileLink[]>(
    (profile?.links as ProfileLink[]) ?? []
  )

  const [form, setForm] = useState({
    slug: profile?.slug ?? '',
    title: profile?.title ?? '',
    name_en: profile?.name_en ?? '',
    name_de: profile?.name_de ?? '',
    name_cn: profile?.name_cn ?? '',
    position_en: profile?.position_en ?? '',
    position_de: profile?.position_de ?? '',
    position_cn: profile?.position_cn ?? '',
    bio_en: profile?.bio_en ?? '',
    bio_de: profile?.bio_de ?? '',
    bio_cn: profile?.bio_cn ?? '',
    email: profile?.email ?? '',
    research_focus: (profile?.research_focus ?? []).join(', '),
    // Identifiers
    orcid: profile?.orcid ?? '',
    google_scholar_url: profile?.google_scholar_url ?? '',
    scopus_id: profile?.scopus_id ?? '',
    wos_id: profile?.wos_id ?? '',
    researchgate_url: profile?.researchgate_url ?? '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `photos/${profile.id}.${ext}`
      const { error } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from('media').getPublicUrl(path)
      setPhotoUrl(data.publicUrl)
      toast.success('Photo uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted')
      return
    }

    setUploadingCv(true)
    try {
      const path = `cvs/${profile.id}.pdf`
      const { error } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: true, contentType: 'application/pdf' })

      if (error) throw error

      const { data } = supabase.storage.from('media').getPublicUrl(path)
      setCvFileUrl(data.publicUrl)
      toast.success('CV uploaded')
    } catch {
      toast.error('CV upload failed')
    } finally {
      setUploadingCv(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (newPassword.length < 8) { toast.error('Min. 8 characters'); return }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { password_set: true },
    })
    if (error) toast.error(error.message)
    else { toast.success('Password updated'); setNewPassword(''); setConfirmPassword('') }
    setSavingPassword(false)
  }

  const handlePublishToggle = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ is_published: !profile.is_published })
      .eq('id', profile.id)

    if (error) toast.error('Failed to update publish status')
    else toast.success(profile.is_published ? 'Profile unpublished' : 'Profile published')
    setSaving(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const id = profile?.id ?? userId
    const { error } = await supabase
      .from('profiles')
      .update({
        slug: form.slug.toLowerCase().replace(/\s+/g, '-') || null,
        title: form.title || null,
        name_en: form.name_en || null,
        name_de: form.name_de || null,
        name_cn: form.name_cn || null,
        position_en: form.position_en || null,
        position_de: form.position_de || null,
        position_cn: form.position_cn || null,
        bio_en: form.bio_en || null,
        bio_de: form.bio_de || null,
        bio_cn: form.bio_cn || null,
        email: form.email || null,
        photo_url: photoUrl || null,
        cv_file_url: cvFileUrl || null,
        research_focus: form.research_focus
          ? form.research_focus.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        orcid: form.orcid || null,
        google_scholar_url: form.google_scholar_url || null,
        scopus_id: form.scopus_id || null,
        wos_id: form.wos_id || null,
        researchgate_url: form.researchgate_url || null,
        academic_background: academicBg,
        links: links,
      })
      .eq('id', id)

    if (error) toast.error('Failed to save: ' + error.message)
    else toast.success(t('saved'))
    setSaving(false)
  }

  // Academic Background helpers
  const addAcademicEntry = () => {
    setAcademicBg((prev) => [...prev, { degree: '', institution: '', year: null, dissertation_title: '' }])
  }

  const updateAcademicEntry = (idx: number, field: keyof AcademicEntry, value: string) => {
    setAcademicBg((prev) => prev.map((e, i) =>
      i === idx
        ? { ...e, [field]: field === 'year' ? (value ? parseInt(value) : null) : value }
        : e
    ))
  }

  const removeAcademicEntry = (idx: number) => {
    setAcademicBg((prev) => prev.filter((_, i) => i !== idx))
  }

  const field = (label: string, key: keyof typeof form, multiline = false) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea
          value={form[key]}
          onChange={(e) => handleChange(key, e.target.value)}
          className="min-h-28 text-sm bg-card border-border resize-none"
        />
      ) : (
        <Input
          value={form[key]}
          onChange={(e) => handleChange(key, e.target.value)}
          className="h-8 text-sm bg-card border-border"
        />
      )}
    </div>
  )

  const generateSlug = () => {
    const base = form.name_en || form.name_de || ''
    if (!base) return
    const slug = base
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    handleChange('slug', slug)
  }

  return (
    <div className="space-y-8">
      {/* Warnung wenn Slug fehlt */}
      {!form.slug && (
        <div className="rounded-sm border border-yellow-500/40 bg-yellow-400/90 px-4 py-3 text-sm text-black">
          <p className="font-bold mb-0.5">URL-Slug fehlt</p>
          <p className="text-xs text-black/70">
            Ohne URL-Slug ist dein Profil nicht erreichbar. Trage unten einen Slug ein (z.B.{' '}
            <span className="font-mono">mueller</span> → <span className="font-mono">/mueller</span>)
            und speichere anschließend.
          </p>
        </div>
      )}

      {/* Photo */}
      <div className="flex items-center gap-5">
        <div className="h-20 w-20 rounded-sm overflow-hidden bg-muted shrink-0">
          {photoUrl ? (
            <Image src={photoUrl} alt="Profile" width={80} height={80} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-2xl">
              {form.name_en.charAt(0) || '?'}
            </div>
          )}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-border"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? t('uploading') : t('upload') + ' Photo'}
          </Button>
          <p className="mt-1 text-[10px] text-muted-foreground">JPG or PNG, max 4 MB</p>
        </div>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        {/* Slug-Feld manuell für bessere UX */}
        <div className="space-y-1.5">
          <Label className={`text-xs ${!form.slug ? 'text-yellow-400 font-bold' : 'text-muted-foreground'}`}>
            URL Slug{!form.slug && ' *'} (z.B. mueller → /mueller)
          </Label>
          <div className="flex gap-1.5">
            <Input
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="z.B. mueller"
              className={`h-8 text-sm bg-card border-border flex-1 font-mono ${!form.slug ? 'border-yellow-500/60' : ''}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateSlug}
              disabled={!form.name_en && !form.name_de}
              className="h-8 text-xs border-border shrink-0 px-2"
              title="Aus Name generieren"
            >
              Auto
            </Button>
          </div>
        </div>
        {field('Academic Title (Prof. Dr. etc.)', 'title')}
        {field('Email', 'email')}
        {field('Research Focus (comma-separated)', 'research_focus')}
      </div>

      {/* Multilingual fields */}
      <Tabs defaultValue="en">
        <TabsList className="bg-card border border-border h-8">
          <TabsTrigger value="en" className="text-xs h-6 px-3">English</TabsTrigger>
          <TabsTrigger value="de" className="text-xs h-6 px-3">Deutsch</TabsTrigger>
          <TabsTrigger value="cn" className="text-xs h-6 px-3">中文</TabsTrigger>
        </TabsList>

        {(['en', 'de', 'cn'] as const).map((lang) => (
          <TabsContent key={lang} value={lang} className="mt-4 space-y-4">
            {field(`Full Name (${lang.toUpperCase()})`, `name_${lang}` as keyof typeof form)}
            {field(`Position (${lang.toUpperCase()})`, `position_${lang}` as keyof typeof form)}
            {field(`Bio / Research Statement (${lang.toUpperCase()})`, `bio_${lang}` as keyof typeof form, true)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Research Identifiers & CV */}
      <div className="pt-6 border-t border-border space-y-4">
        <p className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Research Identifiers & CV</p>
        <div className="grid grid-cols-2 gap-4">
          {field('ORCID (e.g. 0000-0002-1825-0097)', 'orcid')}
          {field('Google Scholar URL', 'google_scholar_url')}
          {field('Scopus Author ID', 'scopus_id')}
          {field('Web of Science Researcher ID', 'wos_id')}
          {field('ResearchGate URL', 'researchgate_url')}
        </div>

        {/* CV Upload */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">CV / Academic Résumé (PDF)</Label>
          <div className="flex items-center gap-3">
            <input ref={cvFileRef} type="file" accept="application/pdf" className="hidden" onChange={handleCvUpload} />
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-border"
              onClick={() => cvFileRef.current?.click()}
              disabled={uploadingCv}
            >
              {uploadingCv ? 'Uploading…' : 'Upload PDF'}
            </Button>
            {cvFileUrl && (
              <a
                href={cvFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View current CV ↗
              </a>
            )}
            {cvFileUrl && (
              <button
                onClick={() => setCvFileUrl('')}
                className="text-xs text-destructive hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Academic Background */}
      <div className="pt-6 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Academic Background</p>
          <Button variant="outline" size="sm" className="text-xs border-border h-7" onClick={addAcademicEntry}>
            + Add Degree
          </Button>
        </div>

        {academicBg.length === 0 && (
          <p className="text-xs text-muted-foreground">No entries yet. Click &quot;+ Add Degree&quot; to start.</p>
        )}

        {academicBg.map((entry, idx) => (
          <div key={idx} className="border border-border rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Entry {idx + 1}</p>
              <button
                onClick={() => removeAcademicEntry(idx)}
                className="text-xs text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Degree</Label>
                <Input
                  value={entry.degree}
                  onChange={(e) => updateAcademicEntry(idx, 'degree', e.target.value)}
                  placeholder="PhD, MA, BSc…"
                  className="h-8 text-sm bg-card border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Year</Label>
                <Input
                  value={entry.year ?? ''}
                  onChange={(e) => updateAcademicEntry(idx, 'year', e.target.value)}
                  type="number"
                  placeholder="2010"
                  className="h-8 text-sm bg-card border-border"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Institution</Label>
              <Input
                value={entry.institution}
                onChange={(e) => updateAcademicEntry(idx, 'institution', e.target.value)}
                placeholder="Humboldt-Universität zu Berlin"
                className="h-8 text-sm bg-card border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Dissertation Title (optional)</Label>
              <Input
                value={entry.dissertation_title ?? ''}
                onChange={(e) => updateAcademicEntry(idx, 'dissertation_title', e.target.value)}
                className="h-8 text-sm bg-card border-border"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="pt-6 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Links</p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-border h-7"
            onClick={() => setLinks((prev) => [...prev, { label: '', url: '' }])}
          >
            + Add Link
          </Button>
        </div>

        {links.length === 0 && (
          <p className="text-xs text-muted-foreground">No links yet. Click &quot;+ Add Link&quot; to add a website, lab page, etc.</p>
        )}

        {links.map((link, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              value={link.label}
              onChange={(e) => setLinks((prev) => prev.map((l, i) => i === idx ? { ...l, label: e.target.value } : l))}
              placeholder="Label (e.g. Lab Website)"
              className="h-8 text-sm bg-card border-border w-40 shrink-0"
            />
            <Input
              value={link.url}
              onChange={(e) => setLinks((prev) => prev.map((l, i) => i === idx ? { ...l, url: e.target.value } : l))}
              placeholder="https://..."
              className="h-8 text-sm bg-card border-border flex-1"
            />
            <button
              onClick={() => setLinks((prev) => prev.filter((_, i) => i !== idx))}
              className="text-xs text-destructive hover:underline shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Change Password */}
      <div className="pt-6 border-t border-border space-y-3">
        <p className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Change Password</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="h-8 text-sm bg-card border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="h-8 text-sm bg-card border-border"
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleChangePassword}
          disabled={savingPassword || !newPassword || !confirmPassword}
          className="text-xs border-border"
        >
          {savingPassword ? 'Saving…' : 'Update Password'}
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
        >
          {saving ? t('saving') : t('save')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePublishToggle}
          disabled={saving}
          className="text-xs border-border"
        >
          {profile?.is_published ? t('unpublish') : t('publish')}
        </Button>
      </div>
    </div>
  )
}

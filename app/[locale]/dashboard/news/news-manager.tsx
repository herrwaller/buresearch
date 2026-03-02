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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { NewsPost } from '@/lib/types/database'

type FormState = {
  title_en: string
  title_de: string
  title_cn: string
  content_en: string
  content_de: string
  content_cn: string
  category: NewsPost['category']
  published_at: string
  is_published: boolean
  url: string
}

const empty: FormState = {
  title_en: '',
  title_de: '',
  title_cn: '',
  content_en: '',
  content_de: '',
  content_cn: '',
  category: 'project',
  published_at: new Date().toISOString().slice(0, 10),
  is_published: false,
  url: '',
}

const CATEGORIES: NewsPost['category'][] = ['exhibition', 'keynote', 'project', 'publication']

export function NewsManager({
  posts,
  profileId,
}: {
  posts: NewsPost[]
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

  const openEdit = (post: NewsPost) => {
    setEditId(post.id)
    setForm({
      title_en: post.title_en ?? '',
      title_de: post.title_de ?? '',
      title_cn: post.title_cn ?? '',
      content_en: post.content_en ?? '',
      content_de: post.content_de ?? '',
      content_cn: post.content_cn ?? '',
      category: post.category,
      published_at: post.published_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      is_published: post.is_published,
      url: post.url ?? '',
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.title_en.trim() && !form.title_de.trim()) {
      return toast.error('At least one title (EN or DE) is required')
    }
    setSaving(true)

    const payload = {
      profile_id: profileId,
      title_en: form.title_en || null,
      title_de: form.title_de || null,
      title_cn: form.title_cn || null,
      content_en: form.content_en || null,
      content_de: form.content_de || null,
      content_cn: form.content_cn || null,
      category: form.category,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      is_published: form.is_published,
      url: form.url || null,
    }

    const { error } = editId
      ? await supabase.from('news_posts').update(payload).eq('id', editId)
      : await supabase.from('news_posts').insert({ ...payload, id: crypto.randomUUID() })

    if (error) toast.error('Save failed: ' + error.message)
    else {
      toast.success(editId ? 'Post updated' : 'Post created')
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    const { error } = await supabase.from('news_posts').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Deleted')
      router.refresh()
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        <Button onClick={openNew} size="sm" className="text-xs bg-primary text-primary-foreground">
          + Add Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="border border-border rounded p-10 text-center text-muted-foreground text-sm">
          No posts yet.
        </div>
      ) : (
        <div className="space-y-1">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-3 p-3 border border-border rounded bg-card"
            >
              <Badge
                variant="outline"
                className="text-[10px] border-border text-muted-foreground capitalize shrink-0"
              >
                {post.category}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{post.title_en ?? post.title_de ?? '(untitled)'}</p>
                <p className="text-xs text-muted-foreground">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-GB')
                    : '—'}
                </p>
              </div>
              <span className={`text-[10px] ${post.is_published ? 'text-green-400' : 'text-muted-foreground'}`}>
                {post.is_published ? 'Live' : 'Draft'}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openEdit(post)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => handleDelete(post.id)}>
                  Del
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {editId ? 'Edit Post' : 'New Post'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={form.category} onValueChange={(v) => set('category', v as NewsPost['category'])}>
                  <SelectTrigger className="text-xs bg-secondary border-border h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  value={form.published_at}
                  onChange={(e) => set('published_at', e.target.value)}
                  className="text-sm bg-secondary border-border h-8"
                />
              </div>
            </div>

            <Tabs defaultValue="en">
              <TabsList className="bg-card border border-border h-8">
                <TabsTrigger value="en" className="text-xs h-6 px-3">English</TabsTrigger>
                <TabsTrigger value="de" className="text-xs h-6 px-3">Deutsch</TabsTrigger>
                <TabsTrigger value="cn" className="text-xs h-6 px-3">中文</TabsTrigger>
              </TabsList>
              {(['en', 'de', 'cn'] as const).map((lang) => (
                <TabsContent key={lang} value={lang} className="mt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Title ({lang.toUpperCase()})</Label>
                    <Input
                      value={form[`title_${lang}` as keyof FormState] as string}
                      onChange={(e) => set(`title_${lang}` as keyof FormState, e.target.value)}
                      className="text-sm bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Content ({lang.toUpperCase()})</Label>
                    <Textarea
                      value={form[`content_${lang}` as keyof FormState] as string}
                      onChange={(e) => set(`content_${lang}` as keyof FormState, e.target.value)}
                      className="text-sm bg-secondary border-border min-h-32 resize-none"
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Link URL (optional)</Label>
              <Input
                value={form.url}
                onChange={(e) => set('url', e.target.value)}
                placeholder="https://..."
                className="text-sm bg-secondary border-border"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={form.is_published}
                onChange={(e) => set('is_published', e.target.checked)}
                className="accent-primary"
              />
              <label htmlFor="is_published" className="text-xs text-muted-foreground">
                Publish immediately
              </label>
            </div>

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

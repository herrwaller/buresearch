'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { MediaItem } from '@/lib/types/database'

export function MediaUploader({
  items,
  profileId,
}: {
  items: MediaItem[]
  profileId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [dragging, setDragging] = useState(false)

  const uploadFile = async (file: File) => {
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'
    if (!isImage && !isPdf) return toast.error('Only images and PDFs allowed')

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profileId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('media')
        .upload(path, file)

      if (uploadErr) throw uploadErr

      const { data } = supabase.storage.from('media').getPublicUrl(path)

      const { error: dbErr } = await supabase.from('media_items').insert({
        id: crypto.randomUUID(),
        profile_id: profileId,
        url: data.publicUrl,
        type: isImage ? 'image' : 'pdf',
        caption_en: null,
        caption_de: null,
        sort_order: items.length,
      })

      if (dbErr) throw dbErr

      toast.success('Uploaded')
      router.refresh()
    } catch (err: unknown) {
      toast.error('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(uploadFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleCaptionSave = async (item: MediaItem, caption: string) => {
    const { error } = await supabase
      .from('media_items')
      .update({ caption_en: caption })
      .eq('id', item.id)
    if (error) toast.error(error.message)
    else toast.success('Caption saved')
  }

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Delete this item?')) return
    const path = item.url.split('/media/')[1]
    await supabase.storage.from('media').remove([path])
    const { error } = await supabase.from('media_items').delete().eq('id', item.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Deleted')
      router.refresh()
    }
  }

  const images = items.filter((i) => i.type === 'image')
  const pdfs = items.filter((i) => i.type === 'pdf')

  return (
    <div className="space-y-8">
      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-sm p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm text-muted-foreground">
          {uploading ? 'Uploading...' : 'Drop images or PDFs here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Images: JPG, PNG, WebP · Documents: PDF</p>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <section>
          <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Images</h2>
          <div className="grid grid-cols-3 gap-3">
            {images.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="aspect-square overflow-hidden rounded-sm bg-muted relative group">
                  <Image
                    src={item.url}
                    alt={item.caption_en ?? ''}
                    width={200}
                    height={200}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => handleDelete(item)}
                    className="absolute top-1 right-1 bg-background/80 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  >
                    ✕
                  </button>
                </div>
                <Input
                  value={captions[item.id] ?? item.caption_en ?? ''}
                  onChange={(e) => setCaptions((p) => ({ ...p, [item.id]: e.target.value }))}
                  onBlur={(e) => handleCaptionSave(item, e.target.value)}
                  placeholder="Caption..."
                  className="h-6 text-xs bg-card border-border"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PDFs */}
      {pdfs.length > 0 && (
        <section>
          <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Documents</h2>
          <div className="space-y-2">
            {pdfs.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border border-border rounded bg-card">
                <span className="text-xs text-muted-foreground shrink-0">PDF</span>
                <div className="flex-1 min-w-0">
                  <Input
                    value={captions[item.id] ?? item.caption_en ?? ''}
                    onChange={(e) => setCaptions((p) => ({ ...p, [item.id]: e.target.value }))}
                    onBlur={(e) => handleCaptionSave(item, e.target.value)}
                    placeholder="Document title..."
                    className="h-6 text-xs bg-card border-border"
                  />
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  View
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-destructive shrink-0"
                  onClick={() => handleDelete(item)}
                >
                  Del
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

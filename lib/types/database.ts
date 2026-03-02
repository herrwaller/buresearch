export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AcademicEntry {
  degree: string
  institution: string
  year: number | null
  dissertation_title?: string
}

export interface ProfileLink {
  label: string
  url: string
}

export interface Profile {
  id: string
  role: 'admin' | 'professor'
  slug: string | null
  name_de: string | null
  name_en: string | null
  name_cn: string | null
  title: string | null
  position_de: string | null
  position_en: string | null
  position_cn: string | null
  bio_de: string | null
  bio_en: string | null
  bio_cn: string | null
  research_focus: string[] | null
  photo_url: string | null
  email: string | null
  is_published: boolean
  is_admin: boolean
  created_at: string
  // Phase 1 extensions
  orcid: string | null
  google_scholar_url: string | null
  scopus_id: string | null
  wos_id: string | null
  researchgate_url: string | null
  cv_file_url: string | null
  academic_background: AcademicEntry[] | null
  links: ProfileLink[] | null
}

export interface Publication {
  id: string
  profile_id: string
  title: string
  authors: string[]
  year: number
  doi: string | null
  url: string | null
  type: 'paper' | 'monograph' | 'collection'
  discipline: 'science' | 'arts'
  abstract: string | null
  journal: string | null
  is_featured: boolean
  created_at: string
}

export interface NewsPost {
  id: string
  profile_id: string
  title_de: string | null
  title_en: string | null
  title_cn: string | null
  content_de: string | null
  content_en: string | null
  content_cn: string | null
  category: 'exhibition' | 'keynote' | 'project' | 'publication'
  published_at: string | null
  is_published: boolean
  url: string | null
  created_at: string
}

export interface MediaItem {
  id: string
  profile_id: string
  url: string
  type: 'image' | 'pdf'
  caption_de: string | null
  caption_en: string | null
  sort_order: number
  created_at: string
}

export interface Project {
  id: string
  profile_id: string
  title: string
  description: string | null
  role: 'PI' | 'Co-PI' | 'Member' | 'Other'
  start_year: number | null
  end_year: number | null
  funding_source: string | null
  created_at: string
}

export interface Exhibition {
  id: string
  profile_id: string
  title: string
  venue: string | null
  location: string | null
  year: number | null
  type: 'Solo' | 'Group' | 'Curated' | 'Other'
  description: string | null
  created_at: string
}

export interface Award {
  id: string
  profile_id: string
  title: string
  awarding_body: string | null
  year: number | null
  description: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      publications: {
        Row: Publication
        Insert: Omit<Publication, 'created_at'>
        Update: Partial<Omit<Publication, 'id' | 'created_at'>>
        Relationships: []
      }
      news_posts: {
        Row: NewsPost
        Insert: Omit<NewsPost, 'created_at'>
        Update: Partial<Omit<NewsPost, 'id' | 'created_at'>>
        Relationships: []
      }
      media_items: {
        Row: MediaItem
        Insert: Omit<MediaItem, 'created_at'>
        Update: Partial<Omit<MediaItem, 'id' | 'created_at'>>
        Relationships: []
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'created_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at'>>
        Relationships: []
      }
      exhibitions: {
        Row: Exhibition
        Insert: Omit<Exhibition, 'created_at'>
        Update: Partial<Omit<Exhibition, 'id' | 'created_at'>>
        Relationships: []
      }
      awards: {
        Row: Award
        Insert: Omit<Award, 'created_at'>
        Update: Partial<Omit<Award, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

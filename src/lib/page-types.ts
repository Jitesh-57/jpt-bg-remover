export interface PageFeature {
  icon: string
  title: string
  desc: string
}

export interface PageFAQ {
  q: string
  a: string
}

export interface PageSEO {
  page_id: string
  title: string
  meta_description: string
  og_title: string
  og_description: string
  og_image: string
  keywords: string
  h1: string
  subtitle: string
  cta_text: string
  features: PageFeature[]
  faq: PageFAQ[]
  updated_at?: string
}

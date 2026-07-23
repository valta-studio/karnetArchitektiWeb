// Typy Sanity dokumentů — drž synchronní se schématy ve studio/schemas/.

export interface SanityImageHotspot {
  x: number;
  y: number;
  height: number;
  width: number;
}

/** Obrázek ze Sanity CDN (asset reference). */
export interface SanityImageRef {
  _type: 'image';
  _key?: string;
  asset: { _ref: string; _type: 'reference' };
  hotspot?: SanityImageHotspot;
  caption?: string;
}

/** Lokální placeholder pro provoz bez Sanity (mock režim). */
export interface MockImage {
  _type: 'mockImage';
  _key?: string;
  src: string;
  width: number;
  height: number;
  caption?: string;
}

export type ImageSource = SanityImageRef | MockImage;

export interface Seo {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: ImageSource;
  noindex?: boolean;
}

export interface Award {
  _key?: string;
  year: string;
  text: string;
}

export interface Person {
  _key?: string;
  degree?: string;
  name: string;
}

export interface SocialLink {
  _key?: string;
  label: string;
  url: string;
}

export interface Credit {
  _key?: string;
  role: string;
  name: string;
}

/** Zjednodušený portable text blok (odstavce se span dětmi). */
export interface PortableTextSpan {
  _type: 'span';
  text: string;
  marks?: string[];
}

export interface PortableTextBlock {
  _type: 'block';
  _key?: string;
  style?: string;
  children: PortableTextSpan[];
}

export interface Project {
  _id: string;
  title: string;
  slug: string;
  order?: number;
  years?: string;
  location?: string;
  credits?: Credit[];
  perex?: string;
  columns?: string[];
  cover: ImageSource;
  photos: ImageSource[];
  drawings?: ImageSource[];
  seo?: Seo;
}

export interface IntroLevel {
  mode: 'photo' | 'video';
  photo?: ImageSource;
  videoFileUrl?: string;
  videoUrl?: string;
  poster?: ImageSource;
  seo?: Seo;
}

export interface AtelierLevel {
  intro?: PortableTextBlock[];
  awardsIntro?: string;
  awards?: Award[];
  publications?: ImageSource[];
  founding?: string;
  people?: Person[];
}

export interface PortfolioLevel {
  heading?: string;
  projects: Project[];
}

export interface Contact {
  email?: string;
  phone?: string;
  address?: string;
  socialLinks?: SocialLink[];
  billing?: {
    companyName?: string;
    registeredAddress?: string;
    ico?: string;
    dic?: string;
  };
}

export interface SeoSettings {
  siteName: string;
  titleTemplate?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultOgImage?: ImageSource;
  noindex?: boolean;
  googleSiteVerification?: string;
  analyticsId?: string;
}

// Sanity klient + GROQ dotazy. Obsah se čte POUZE v build time.
// Bez SANITY_PROJECT_ID běží web v mock režimu (lib/mock-data.ts).

import { createClient, type SanityClient } from '@sanity/client';
import type {
  AtelierLevel,
  Contact,
  IntroLevel,
  PortfolioLevel,
  Project,
  SeoSettings,
} from '../types/sanity';
import * as mock from './mock-data';

const projectId = import.meta.env.SANITY_PROJECT_ID as string | undefined;
const dataset = (import.meta.env.SANITY_DATASET as string | undefined) ?? 'production';

/** True, když chybí env a web běží na mock datech. */
export const isMockMode = !projectId;

export const client: SanityClient | null = projectId
  ? createClient({ projectId, dataset, apiVersion: '2025-06-01', useCdn: false })
  : null;

/**
 * Načte data ze Sanity; když dokument (zatím) neexistuje nebo je pole prázdné,
 * vrátí mock hodnotu, aby build prošel i s částečně naplněným CMS.
 * Přechod na reálný obsah probíhá postupně po dokumentech.
 */
async function fetchOrMock<T>(label: string, query: string, mockValue: T): Promise<T> {
  if (!client) return mockValue;
  const result = await client.fetch<T | null>(query);
  const isEmpty =
    result === null || result === undefined || (Array.isArray(result) && result.length === 0);
  if (isEmpty) {
    console.warn(`[sanity] „${label}" v CMS chybí — používám mock obsah.`);
    return mockValue;
  }
  return result;
}

const PROJECT_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  order,
  years,
  location,
  credits,
  perex,
  columns,
  cover,
  photos,
  drawings,
  seo
`;

export async function getProjects(): Promise<Project[]> {
  return fetchOrMock<Project[]>(
    'projekty',
    `*[_type == "project" && defined(slug.current)] | order(order asc, title asc) { ${PROJECT_FIELDS} }`,
    mock.projects
  );
}

export async function getIntroLevel(): Promise<IntroLevel> {
  return fetchOrMock<IntroLevel>(
    'úroveň 1 — úvod',
    `*[_type == "introLevel"][0] {
      mode,
      photo,
      "videoFileUrl": videoFile.asset->url,
      videoUrl,
      poster,
      seo
    }`,
    mock.introLevel
  );
}

export async function getAtelierLevel(): Promise<AtelierLevel> {
  return fetchOrMock<AtelierLevel>(
    'úroveň 2 — ateliér',
    `*[_type == "atelierLevel"][0] { intro, awardsIntro, awards, publications, founding, people }`,
    mock.atelierLevel
  );
}

export async function getPortfolioLevel(): Promise<PortfolioLevel> {
  const result = await fetchOrMock<PortfolioLevel>(
    'úroveň 3 — portfolio',
    `*[_type == "portfolioLevel"][0] {
      heading,
      "projects": projects[]-> { ${PROJECT_FIELDS} }
    }`,
    mock.portfolioLevel
  );
  if (result.projects?.length) return result;
  // singleton zatím nemá seřazené reference → všechny projekty dle order
  return { heading: result.heading, projects: await getProjects() };
}

export async function getContact(): Promise<Contact> {
  return fetchOrMock<Contact>(
    'úroveň 4 — kontakt',
    `*[_type == "contact"][0] { email, phone, address, socialLinks, billing }`,
    mock.contact
  );
}

export async function getSeoSettings(): Promise<SeoSettings> {
  return fetchOrMock<SeoSettings>(
    'SEO nastavení',
    `*[_type == "seoSettings"][0] {
      siteName,
      titleTemplate,
      defaultTitle,
      defaultDescription,
      defaultOgImage,
      noindex,
      googleSiteVerification,
      analyticsId
    }`,
    mock.seoSettings
  );
}

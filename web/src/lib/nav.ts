// Navigační struktura — zrcadlí svislé úrovně hlavní stránky.
// Labels jsou strukturní (názvy úrovní), nikoli editorský obsah.

export interface NavLink {
  id: string;
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { id: 'uvod', label: 'Intro', href: '/#uvod' },
  { id: 'atelier', label: 'Atelier', href: '/#atelier' },
  { id: 'portfolio', label: 'Portfolio', href: '/#portfolio' },
  { id: 'kontakt', label: 'Kontakt', href: '/#kontakt' },
];

/** Úrovně, pro které se při scrollu píše hash — úvod ne, vršek stránky zůstává bez kotvy. */
export const DEEP_LINKS = NAV_LINKS.filter((link) => link.id !== 'uvod');

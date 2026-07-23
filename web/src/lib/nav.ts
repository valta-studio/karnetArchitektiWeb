// Navigační struktura — zrcadlí svislé úrovně hlavní stránky.
// Labels jsou strukturní (názvy úrovní), nikoli editorský obsah.

export interface NavLink {
  id: string;
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { id: 'uvod', label: 'Úvod', href: '/#uvod' },
  { id: 'atelier', label: 'Ateliér', href: '/#atelier' },
  { id: 'portfolio', label: 'Portfolio', href: '/#portfolio' },
  { id: 'kontakt', label: 'Kontakt', href: '/#kontakt' },
];

/** Položky textové navigace v hlavičce (bez úvodu — ten zastupuje logo). */
export const HEADER_LINKS = NAV_LINKS.filter((link) => link.id !== 'uvod');

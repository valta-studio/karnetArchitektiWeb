# CLAUDE.md — Karnet, architekti

Portfolio web architektonického studia. Astro (SSG) + Sanity CMS + Netlify.
Design je minimalistický a přesný — drž se dodaných náhledů (desktop i mobil),
nic nevymýšlej navíc. Jazyk obsahu: čeština.

## Stack a příkazy

- **Web:** Astro 5, TypeScript strict, vanilla TS (žádný React/Vue — ani pro ostrovy)
- **CMS:** Sanity v3, obsah se čte pouze v build time přes GROQ
- **Hosting:** Netlify, build hook spouštěný Sanity webhookem
- Monorepo (npm workspaces): `web/` a `studio/`

```bash
npm run dev          # dev server webu (web/)
npm run dev:studio   # Sanity Studio (studio/)
npm run build        # produkční build webu
npm run check        # astro check + tsc, spusť před každým commitem
```

Env proměnné: `SANITY_PROJECT_ID`, `SANITY_DATASET` (viz `.env.example`).
Nikdy necommituj `.env` ani tokeny.

## Architektura — neměnné principy

1. **Scroll systém stojí na nativním CSS scroll snap.** Vertikální osa:
   `scroll-snap-type: y mandatory`, úrovně `min-height: 100dvh`. Horizontální
   dráhy uvnitř úrovní: `scroll-snap-type: x mandatory`. NEZAVÁDĚJ scroll
   knihovny (fullPage.js, GSAP ScrollTrigger, Lenis…) — JS smí jen pozorovat
   (IntersectionObserver) a synchronizovat UI stav, nikdy nepřebírat řízení
   scrollu.
2. Na horizontálních drahách vždy `touch-action: pan-x pan-y` a
   `overscroll-behavior-x: contain`. Samotné `pan-x` NEPOUŽÍVEJ — dráha
   vyplňuje celou úroveň a zablokovala by vertikální swipe mezi úrovněmi;
   s `pan-x pan-y` si prohlížeč zamkne dominantní osu gesta sám.
3. Úroveň 1 (úvod) horizontální posun NEMÁ. Ostatní úrovně ano.
4. Používej `dvh`, nikdy `vh` (address bar na mobilech).
5. Žádný obsah natvrdo v komponentách — všechno přes Sanity. Pokud ti chybí
   pole ve schématu, přidej ho do schématu, nehardcoduj.
6. Karty projektů jsou samostatné routy `/portfolio/[slug]` generované
   z `getStaticPaths`. Hlavní stránka `/` = úrovně 1–4 + burger obrazovka.

## Struktura

```
web/src/
  pages/            index.astro, portfolio/[slug].astro
  components/       ScrollDeck, ScrollRow, ProgressDots, SanityImage, Header,
                    BurgerScreen; levels/ (4 úrovně); project/ (3 dráhy karty)
  scripts/          scroll-engine.ts, video.ts, menu.ts
  lib/              sanity.ts (klient + GROQ), image.ts (srcset helpery)
  styles/           tokens.css, global.css, scroll.css
studio/schemas/     documents/ (project + singletony úrovní + seoSettings),
                    objects/ (seo, award, person, socialLink)
```

## Konvence

- Komponenty `.astro`, logika v `<script>` jako TS moduly ze `scripts/`
- CSS: vanilla + custom properties z `tokens.css`. Žádný Tailwind.
- Obrázky VÝHRADNĚ přes komponentu `SanityImage` (srcset, WebP, hotspot,
  lazy loading). Nikdy přímé `<img src>` na Sanity CDN URL.
- Font Riforma LL: self-host woff2 z `public/fonts/`, `font-display: swap`,
  subset latin-ext. Nepřidávej Google Fonts.
- Typy Sanity dokumentů v `web/src/types/sanity.ts` — drž je synchronní se
  schématy ve `studio/schemas/`.
- Commity: konvenční prefixy (`feat:`, `fix:`, `chore:`), česky nebo anglicky.

## Sanity pravidla

- Singletony (introLevel, atelierLevel, portfolioLevel, contact, seoSettings)
  mají v desk structure fixní pozici, nelze je duplikovat ani mazat.
- `project`: slug povinný a unikátní, `photos` min. 3, max 12 publikovaných
  projektů (validace, ne hard limit).
- SEO objekt je všude volitelný — fallbacky (title z názvu, description
  z perexu) řeš v Astro, ne validací ve Studiu.
- JSON-LD (LocalBusiness) se skládá při buildu z dat singletonu `contact`.

## Testování a kvalita

- Před dokončením úkolu: `npm run check` + `npm run build` musí projít.
- Scroll chování ověřuj v Safari (macOS i iOS simulátor) — Chrome nestačí,
  snap se tam chová jinak.
- Cíl Lighthouse mobile: Performance 90+, Accessibility 90+. Velké fotky
  jsou hlavní riziko — vždy kontroluj váhu stránky.
- Respektuj `prefers-reduced-motion` (vypni autoplay videa a smooth scroll).

## Čeho se vyvarovat

- Nepřepisuj scroll-engine na JS řízený scroll „protože to bude plynulejší".
- Nepřidávej závislosti bez ptaní — cíl je minimum JS na klientu.
- Neměň Sanity schémata destruktivně (přejmenování pole = migrace obsahu,
  vždy nejdřív upozorni).
- Nesahej na design tokens (barvy, typografická škála) — vychází z náhledů.
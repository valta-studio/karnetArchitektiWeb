# Karnet, architekti — web

Portfolio web architektonického studia. Astro (SSG) + Sanity CMS + Netlify.
Monorepo: `web/` (Astro) a `studio/` (Sanity Studio). Detailní pravidla viz [CLAUDE.md](CLAUDE.md).

## Vývoj

```bash
npm install
npm run dev          # web — http://localhost:4321
npm run dev:studio   # Sanity Studio — http://localhost:3333
npm run check        # astro check + tsc (spusť před commitem)
npm run build        # produkční build do web/dist
```

Env: zkopíruj `.env.example` do `.env` (Sanity project ID `bq3811kv`, dataset `production`).
`.env` se nikdy necommituje.

## Obsah a mock režim

Veškerý obsah se čte ze Sanity **v build time** přes GROQ. Dokud dokument v CMS
chybí, build ho nahradí mock obsahem z `web/src/lib/mock-data.ts` a vypíše
warning `[sanity] „…" v CMS chybí`. Jakmile klient dokument ve Studiu publikuje,
při dalším buildu se použije reálný obsah — přechod probíhá postupně po dokumentech.

Struktura Studia zrcadlí web: singletony Úroveň 1–4 + globální SEO nahoře,
seznam projektů pod nimi. Projekt vyžaduje slug, náhledovou fotku a min. 3 fotky;
pořadí v portfoliu se řídí přetahováním referencí v „Úroveň 3 — Portfolio".

## Nasazení (jednorázové kroky v dashboardech)

1. **Netlify:** nový site z tohoto repa — build command a publish dir čte z `netlify.toml`.
   V *Site settings → Environment variables* nastav `SANITY_PROJECT_ID=bq3811kv`
   a `SANITY_DATASET=production`.
2. **Netlify build hook:** *Site settings → Build & deploy → Build hooks* → vytvořit hook.
3. **Sanity webhook:** [manage.sanity.io](https://manage.sanity.io) → projekt →
   *API → Webhooks* → nový webhook s URL build hooku, trigger `create/update/delete`,
   dataset `production`. Publish ve Studiu pak spustí rebuild (~1–2 min).
4. **Studio deploy:** `cd studio && npx sanity deploy` (vyžaduje `npx sanity login`).
5. **CORS:** na manage.sanity.io povolit origin Studia a `http://localhost:3333`.

## Než půjde web ven

- [ ] Licence fontu Riforma LL (Lineto) → woff2 do `web/public/fonts/`,
      odkomentovat `@font-face` v `web/src/styles/global.css`
- [ ] Naplnit obsah ve Studiu (mock obsah zmizí sám)
- [ ] Úvodní video (H.264 MP4, do ~20 MB do `web/public/video/`, jinak video CDN)
- [ ] `seoSettings.noindex` vypnout až při launchi (mock default je zapnuto)
- [ ] Ověřit scroll v Safari — macOS i iOS (Chrome nestačí)
- [ ] Redirecty ze starých URL do `netlify.toml`

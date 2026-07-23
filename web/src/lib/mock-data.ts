// Fallback obsah pro provoz BEZ Sanity / s prázdným CMS.
// Texty převzaté z dodaných náhledů (web_náhled.pdf) — slouží k vývoji,
// v produkci je nahradí obsah publikovaný ve Studiu.

import type {
  AtelierLevel,
  Contact,
  IntroLevel,
  MockImage,
  PortfolioLevel,
  Project,
  SeoSettings,
} from '../types/sanity';

function ph(n: number, width = 1600, height = 1067, caption?: string): MockImage {
  return { _type: 'mockImage', src: `/placeholders/ph-${n}.svg`, width, height, caption };
}

/** portrétní placeholder */
function php(n: number, caption?: string): MockImage {
  return { _type: 'mockImage', src: `/placeholders/ph-${n}.svg`, width: 1067, height: 1600, caption };
}

const vila1906: Project = {
  _id: 'mock-vila-1906',
  title: 'Vila 1906',
  slug: 'vila-1906',
  order: 1,
  years: '2018 - 2021',
  location: 'Dobřichovice',
  credits: [
    { role: 'Foto', name: 'Petr Polák' },
    { role: 'Zahrada', name: 'Atelier Flera' },
  ],
  perex:
    'Moderní bydlení v měšťanské vile.\n\nPro nové majitele navrhujeme soudobou vrstvu, překreslujeme dispozice, organizujeme plynutí prostorů a ladíme kombinace materiálů tak, abychom zachovali původní prvky vily a splnili požadavky současného bydlení.',
  columns: [
    'Historie vily sahá až do roku 1906, kdy byla stavba dokončena dle návrhu architekta Františka Buldra. Od roku 1934 vilu obýval spisovatel F. X. Šalda. V roce 1939 prošla vila výraznou rekonstrukcí dle návrhu Karla Šťastného. Tehdy byla provedena celková úprava průčelí včetně vybudování věže se stanovou střechou. Součástí úprav bylo i litinové zábradlí a vstupní brána, což jsou prvky zachované dodnes. Na konci roku 2018 se vila dostala na náš stůl. A proto, že dnes se žije jinak než na počátku minulého století, bylo potřeba přizpůsobit bydlení novým požadavkům.',
    'Hlavním cílem všech našich zásahů bylo jasně odlišit nové od původního.\n\nZásadním krokem pro celé fungování domu bylo přesunutí původního hlavního vstupu do přízemí. Díky tomu jsme získali mnohem více prostoru jak pro šatní skříně a botníky, tak pro pohyb ve vstupní hale. Zároveň vznikly přidružené místnosti, jako je technická místnost či druhá šatna. V původní dispozici se vcházelo na schodišťovou podestu, což do značné míry limitovalo úložné prostory. Zároveň to ale vytvářelo autentickou atmosféru a krásný průhled obývacím pokojem až na balkon. Podestu jsme se proto rozhodli zachovat, nyní slouží jako vchod pro návštěvy. Materiály jsme volili tak, aby každý, kdo do vily vstoupí, pocítil její vznešenost a výjimečnou atmosféru. Na podlahách je mramorová dlažba, jejíž kresba plynule navazuje na ořechovou dýhu vestavěných skříní. Světla jsou vzhledem k nízkému stropu přisazená. Zpoza skříní pronikají tenké paprsky světla, které zdůrazňují kontrast nového s původním.',
  ],
  cover: php(1),
  photos: [php(1), ph(2), php(3), ph(4), php(5)],
  drawings: [ph(6, 1600, 1000), ph(7, 1600, 1000), ph(8, 1200, 1400)],
};

function mockProject(
  n: number,
  title: string,
  slug: string,
  location: string,
  years: string,
  portrait = false
): Project {
  const cover = portrait ? php(((n - 1) % 8) + 1) : ph(((n - 1) % 8) + 1);
  return {
    _id: `mock-${slug}`,
    title,
    slug,
    order: n,
    years,
    location,
    perex: `${title}.\n\nUkázkový text projektu pro vývoj — obsah se po naplnění načítá výhradně ze Sanity.`,
    columns: [
      'Ukázkový text prvního sloupce. Po napojení a naplnění Sanity se obsah načítá výhradně z CMS.',
      'Ukázkový text druhého sloupce. Po napojení a naplnění Sanity se obsah načítá výhradně z CMS.',
    ],
    cover,
    photos: [php((n % 8) + 1), ph(((n + 1) % 8) + 1), php(((n + 2) % 8) + 1)],
    drawings: [ph(6, 1600, 1000), ph(7, 1600, 1000)],
  };
}

export const projects: Project[] = [
  vila1906,
  mockProject(2, 'Na úpatí Brd', 'na-upati-brd', 'Příbram', '2022 - 2024'),
  mockProject(3, 'Spolkový dům', 'spolkovy-dum', 'Brdy', '2023'),
  mockProject(4, 'Zapomenutá stodola', 'zapomenuta-stodola', 'Brdy', '2021 - 2024'),
  mockProject(5, 'Vila v údolí', 'vila-v-udoli', 'Příbram', '2022', true),
  mockProject(6, 'Vila na kopci', 'vila-na-kopci', 'Brdy', '2023'),
  mockProject(7, 'Školka', 'skolka', 'Příbram', '2024', true),
];

export const introLevel: IntroLevel = {
  mode: 'photo',
  photo: php(1),
};

export const atelierLevel: AtelierLevel = {
  intro: [
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Jsme architektonické studio se základy v Příbrami. Záměrně stojíme mimo centrum.',
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Jsme tam, kde se potkávají brdské lesy a uranové doly. Ze tmy přicházíme ošlehaní větrem. Fáráme pod povrch do hlubin vašich stavebních snů.',
        },
      ],
    },
  ],
  awardsIntro: 'Naše práce se pravidelně objevuje v odborných a lifestyle magazínech.',
  awards: [
    {
      year: '2024',
      text: 'V roce 2024 jsme si zasloužili nominaci na Grand Prix Architektů za návrh Zapomenuté stodoly.',
    },
    {
      year: '2023',
      text: 'V roce 2023 nás Časopis Architect+ zařadil do svého každoročního výběru TOP 100 mezi 10 emerging architects.',
    },
    {
      year: '2020',
      text: 'V roce 2020 jsme obdrželi BigSEE interior Design Award za návrh kavárny Cafe Smoo v Příbrami.',
    },
  ],
  publications: [php(2), ph(3, 1600, 1200), php(4), ph(5, 1600, 1200)],
  founding: 'Ateliér byl založen v roce 2019 v Příbrami.',
  people: [
    { degree: 'Ing. arch.', name: 'Jan Karnet' },
    { degree: 'Ing. arch.', name: 'Marie Karnetová' },
  ],
};

export const portfolioLevel: PortfolioLevel = {
  projects,
};

export const contact: Contact = {
  email: 'office@karnet.archi',
  phone: '+420 728 431 406',
  address: 'Komenského náměstí 389\n261 01 Příbram\nCzech republic',
  socialLinks: [
    { label: 'Facebook', url: 'https://facebook.com/' },
    { label: 'Instagram', url: 'https://instagram.com/' },
    { label: 'Pinterest', url: 'https://pinterest.com/' },
  ],
  billing: {
    companyName: 'Karnet architekt, s.r.o.',
    registeredAddress: 'Plzeňská 60,\nPříbram, 261 01',
    ico: '08650632',
    dic: 'CZ08650632',
  },
};

export const seoSettings: SeoSettings = {
  siteName: 'Karnet, architekti',
  titleTemplate: '%s — Karnet, architekti',
  defaultTitle: 'Karnet, architekti',
  defaultDescription:
    'Architektonické studio se základy v Příbrami. Domy, interiéry a veřejný prostor — od prvních skic po realizaci.',
  noindex: true,
};

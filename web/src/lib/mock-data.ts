// Fallback obsah pro provoz BEZ Sanity (chybí SANITY_PROJECT_ID).
// Jediné místo, kde smí být obsah mimo CMS — slouží k vývoji a náhledu,
// v produkci s nastaveným env se nikdy nepoužije.

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

const vila1906: Project = {
  _id: 'mock-vila-1906',
  title: 'Vila 1906',
  slug: 'vila-1906',
  order: 1,
  years: '2018 – 2021',
  location: 'Dobřichovice',
  credits: [
    { role: 'Foto', name: 'Petr Polák' },
    { role: 'Zahrada', name: 'Atelier Partero' },
  ],
  perex:
    'Moderní bydlení v měšťanské vile. Rekonstrukce vily z roku 1906 vrací domu jeho původní důstojnost a zároveň jej otevírá současnému způsobu života rodiny.',
  columns: [
    'Vila byla postavena roku 1906 podle návrhu neznámého stavitele jako letní sídlo pražské rodiny. Během dvacátého století prošla řadou necitlivých úprav, které setřely většinu původních detailů. Průzkum nicméně odhalil zachované konstrukce krovu, původní schodiště a fragmenty štukové výzdoby.',
    'Návrh odstraňuje pozdější přístavky a vrstvy, obnovuje původní hmotu domu a doplňuje ji soudobým zázemím zapuštěným do svahu zahrady. Nové zásahy jsou materiálově odlišené — pohledový beton a dub — aby zůstalo čitelné, co je původní a co nové.',
  ],
  cover: ph(1),
  photos: [ph(1), ph(2), ph(3), ph(4), ph(5)],
  drawings: [ph(6, 1600, 1100), ph(7, 1600, 1100), ph(8, 1600, 1100)],
};

function mockProject(
  n: number,
  title: string,
  slug: string,
  location: string,
  years: string
): Project {
  return {
    _id: `mock-${slug}`,
    title,
    slug,
    order: n,
    years,
    location,
    perex: `${title} — ukázkový projekt pro vývoj bez napojení na Sanity.`,
    columns: [
      'Ukázkový text prvního sloupce. Po napojení Sanity se obsah načítá výhradně z CMS.',
      'Ukázkový text druhého sloupce. Po napojení Sanity se obsah načítá výhradně z CMS.',
    ],
    cover: ph(((n - 1) % 8) + 1),
    photos: [ph(((n) % 8) + 1), ph(((n + 1) % 8) + 1), ph(((n + 2) % 8) + 1)],
    drawings: [ph(6, 1600, 1100), ph(7, 1600, 1100)],
  };
}

export const projects: Project[] = [
  vila1906,
  mockProject(2, 'Dům pod lesem', 'dum-pod-lesem', 'Černošice', '2020 – 2023'),
  mockProject(3, 'Byt Letná', 'byt-letna', 'Praha 7', '2022'),
  mockProject(4, 'Chata Kokořínsko', 'chata-kokorinsko', 'Kokořínsko', '2019 – 2021'),
  mockProject(5, 'Ateliér Karlín', 'atelier-karlin', 'Praha 8', '2021 – 2022'),
  mockProject(6, 'Dům se dvorem', 'dum-se-dvorem', 'Kutná Hora', '2017 – 2020'),
  mockProject(7, 'Rekonstrukce mlýna', 'rekonstrukce-mlyna', 'Posázaví', '2023 –'),
  mockProject(8, 'Vila na skále', 'vila-na-skale', 'Vrané nad Vltavou', '2016 – 2019'),
];

export const introLevel: IntroLevel = {
  mode: 'photo',
  photo: ph(1, 2400, 1600),
};

export const atelierLevel: AtelierLevel = {
  intro: [
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Jsme architektonický ateliér. Navrhujeme domy, interiéry a veřejný prostor — od prvních skic po realizaci. Věříme v přesnost, trvanlivost a ticho dobré architektury.',
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Každý projekt začíná místem a jeho příběhem. Pracujeme pomalu a důkladně, s malým počtem zakázek najednou.',
        },
      ],
    },
  ],
  awards: [
    { year: '2023', text: 'Česká cena za architekturu — nominace, Vila 1906' },
    { year: '2021', text: 'Grand Prix architektů — čestné uznání' },
    { year: '2019', text: 'Stavba roku Středočeského kraje' },
  ],
  publications: [ph(2, 1200, 1500), ph(3, 1200, 1500), ph(4, 1200, 1500), ph(5, 1200, 1500)],
  founding: 'Ateliér byl založen v roce 2012 v Praze.',
  people: [
    { degree: 'Ing. arch.', name: 'Jan Karnet' },
    { degree: 'Ing. arch.', name: 'Marie Karnetová' },
    { degree: 'Ing.', name: 'Tomáš Dvořák' },
  ],
};

export const portfolioLevel: PortfolioLevel = {
  heading: 'Vybrané projekty',
  projects,
};

export const contact: Contact = {
  email: 'info@karnet.archi',
  phone: '+420 777 000 000',
  address: 'Příčná 12\n110 00 Praha 1',
  socialLinks: [
    { label: 'Instagram', url: 'https://instagram.com/' },
    { label: 'Facebook', url: 'https://facebook.com/' },
    { label: 'Pinterest', url: 'https://pinterest.com/' },
  ],
  billing: {
    companyName: 'Karnet architekti s.r.o.',
    registeredAddress: 'Příčná 12, 110 00 Praha 1',
    ico: '00000000',
    dic: 'CZ00000000',
  },
};

export const seoSettings: SeoSettings = {
  siteName: 'Karnet, architekti',
  titleTemplate: '%s — Karnet, architekti',
  defaultTitle: 'Karnet, architekti',
  defaultDescription:
    'Architektonický ateliér v Praze. Domy, interiéry a veřejný prostor — od prvních skic po realizaci.',
  noindex: true,
};

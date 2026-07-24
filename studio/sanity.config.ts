import { defineConfig } from 'sanity';
import { structureTool, type StructureBuilder } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { netlifyTool } from 'sanity-plugin-netlify';
import {
  CaseIcon,
  EnvelopeIcon,
  HomeIcon,
  ImagesIcon,
  SearchIcon,
  UsersIcon,
} from '@sanity/icons';
import { schemaTypes } from './schemas';

const SINGLETONS = [
  { type: 'introLevel', title: 'Úroveň 1 — Úvod', icon: HomeIcon },
  { type: 'atelierLevel', title: 'Úroveň 2 — Ateliér', icon: UsersIcon },
  { type: 'portfolioLevel', title: 'Úroveň 3 — Portfolio', icon: ImagesIcon },
  { type: 'contact', title: 'Úroveň 4 — Kontakt', icon: EnvelopeIcon },
  { type: 'seoSettings', title: 'SEO — globální nastavení', icon: SearchIcon },
];

const singletonTypes = new Set(SINGLETONS.map((s) => s.type));

const structure = (S: StructureBuilder) =>
  S.list()
    .title('Obsah')
    .items([
      ...SINGLETONS.map((s) =>
        S.listItem()
          .title(s.title)
          .id(s.type)
          .icon(s.icon)
          .child(S.document().schemaType(s.type).documentId(s.type))
      ),
      S.divider(),
      S.documentTypeListItem('project').title('Projekty').icon(CaseIcon),
    ]);

export default defineConfig({
  name: 'default',
  title: 'Karnet, architekti',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'placeholder',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool({ structure }), visionTool(), netlifyTool()],
  schema: {
    types: schemaTypes,
    // singletony nelze zakládat přes „create new"
    templates: (templates) =>
      templates.filter((t) => !singletonTypes.has(t.schemaType)),
  },
  document: {
    // singletony nelze duplikovat ani mazat
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(
            ({ action }) =>
              action && ['publish', 'discardChanges', 'restore'].includes(action)
          )
        : input,
  },
});

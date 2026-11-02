import { at, defineMigration, setIfMissing, unset } from 'sanity/migrate';

// Přesune fotky ateliéru z původního pole `photos` (umístění vybírané u každé
// fotky) do samostatných seznamů mezi sekcemi. Nové seznamy plní jen tam,
// kde jsou prázdné; staré pole nakonec odebere.
//
//   npx sanity migration run atelier-photos-by-section            # zkouška (dry run)
//   npx sanity migration run atelier-photos-by-section --no-dry-run

const TARGET_BY_PLACEMENT: Record<string, string> = {
  start: 'photosStart',
  afterIntro: 'photosAfterIntro',
  afterAwards: 'photosAfterAwards',
  end: 'photosEnd',
};

type LegacyPhoto = { _key?: string; placement?: string; [key: string]: unknown };

export default defineMigration({
  title: 'Fotky ateliéru: z volby umístění do seznamů mezi sekcemi',
  documentTypes: ['atelierLevel'],
  migrate: {
    document(doc) {
      const legacy = (doc.photos as LegacyPhoto[] | undefined) ?? [];
      if (!legacy.length) return [];

      const grouped: Record<string, LegacyPhoto[]> = {};
      for (const photo of legacy) {
        const target = TARGET_BY_PLACEMENT[photo.placement ?? 'afterIntro'] ?? 'photosAfterIntro';
        const { placement: _placement, ...rest } = photo;
        (grouped[target] ??= []).push({ ...rest, _type: 'atelierPhoto' });
      }

      return [
        ...Object.entries(grouped).map(([field, photos]) => at(field, setIfMissing(photos))),
        at('photos', unset()),
      ];
    },
  },
});

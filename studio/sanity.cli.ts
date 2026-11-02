import { defineCliConfig } from 'sanity/cli';

// Projekt a dataset pro CLI (migrace, deploy) — stejné env jako Studio.
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'placeholder',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
});

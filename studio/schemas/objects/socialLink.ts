import { defineField, defineType } from 'sanity';
import { LinkIcon } from '@sanity/icons';

export default defineType({
  name: 'socialLink',
  title: 'Sociální síť',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Název',
      type: 'string',
      description: 'Např. Instagram, Facebook, Pinterest…',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'url' },
  },
});

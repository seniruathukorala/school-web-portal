import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: 'h0n40g15', 
  dataset: 'production',
  useCdn: true,
  apiVersion: '2026-01-01',
});

const builder = imageUrlBuilder(client);

export const urlFor = (source) => builder.image(source);
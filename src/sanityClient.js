import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: 'h0n40g15',
  dataset: 'production',
  useCdn: false, 
  apiVersion: '2026-01-01',
  token: 'skY74jeivNwj1idGixQR99xDBwyFBGtyQXcrNHkd9Ybtm1L34hHqxxCcI7Vjj3qOxjf4Cbv8kBPCr8qose326rqS5VuvcTVB8J5YiYNAC6wz8i5nDickItIQj5xc7WY614kNoyKlxAgE4v6i6wJo1ak06lUxp9u4QxgHK8blBVTBIUEmPYsh', 
});

const builder = imageUrlBuilder(client);
export const urlFor = (source) => builder.image(source);
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: 'AIzaSyDB_r30eYazB4wSBgQfGvetovQVQBerSBU', // ✅ hardcoded correctly
      apiVersion: 'v1',
    }),
  ],
});

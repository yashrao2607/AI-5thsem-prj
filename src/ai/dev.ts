import { config } from 'dotenv';
config({ path: '.env.local' });


import '@/ai/flows/summarize-uploaded-report.ts';
import '@/ai/flows/answer-questions-about-report.ts';
import '@/ai/flows/extract-text-from-document.ts';
import '@/ai/flows/index-report-flow.ts';

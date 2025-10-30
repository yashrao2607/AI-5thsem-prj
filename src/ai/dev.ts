import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-uploaded-report.ts';
import '@/ai/flows/answer-questions-about-report.ts';
import '@/ai/flows/extract-text-from-document.ts';

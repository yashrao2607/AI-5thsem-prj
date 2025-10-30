'use server';

/**
 * @fileOverview A flow that answers questions about a user-uploaded report (PDF or image).
 *
 * - answerQuestionsAboutReport - A function that accepts a report and a question, and returns an answer.
 * - AnswerQuestionsAboutReportInput - The input type for the answerQuestionsAboutReport function.
 * - AnswerQuestionsAboutReportOutput - The return type for the answerQuestionsAboutReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionsAboutReportInputSchema = z.object({
  reportDataUri: z
    .string()
    .describe(
      'The report document (PDF or image) as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
  question: z.string().describe('The question to ask about the report.'),
});
export type AnswerQuestionsAboutReportInput = z.infer<
  typeof AnswerQuestionsAboutReportInputSchema
>;

const AnswerQuestionsAboutReportOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the report.'),
});
export type AnswerQuestionsAboutReportOutput = z.infer<
  typeof AnswerQuestionsAboutReportOutputSchema
>;

export async function answerQuestionsAboutReport(
  input: AnswerQuestionsAboutReportInput
): Promise<AnswerQuestionsAboutReportOutput> {
  return answerQuestionsAboutReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionsAboutReportPrompt',
  input: {schema: AnswerQuestionsAboutReportInputSchema},
  output: {schema: AnswerQuestionsAboutReportOutputSchema},
  prompt: `You are an AI assistant that answers questions about user-uploaded reports. Please answer the following question about the report.

Report: {{media url=reportDataUri}}

Question: {{{question}}}`,
});

const answerQuestionsAboutReportFlow = ai.defineFlow(
  {
    name: 'answerQuestionsAboutReportFlow',
    inputSchema: AnswerQuestionsAboutReportInputSchema,
    outputSchema: AnswerQuestionsAboutReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';

import { NextResponse } from 'next/server';
import { answerQuestionsAboutReport } from '@/ai/flows/answer-questions-about-report';
import { ai } from '@/ai/genkit';

export async function POST(request: Request) {
  try {
    const { question, userId } = await request.json();
    if (!question || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: question, userId' },
        { status: 400 }
      );
    }

    const chromaReady =
      !!process.env.COHERE_API_KEY &&
      !!process.env.CHROMA_API_KEY &&
      !!process.env.CHROMA_TENANT &&
      !!process.env.CHROMA_DATABASE;
    const geminiReady = !!process.env.GEMINI_API_KEY;

    if (!chromaReady) {
      // Fallback: answer directly with Gemini (no RAG)
      if (!geminiReady) {
        // Final fallback: respond gracefully even without Gemini configured
        return NextResponse.json({
          answer:
            'The AI service is not fully configured (missing GEMINI_API_KEY). Your question was received.',
          mode: 'placeholder'
        });
      }
      try {
        const { text } = await ai.generate({
          model: 'googleai/gemini-1.5-flash',
          prompt:
            `You are a helpful assistant. Provide a concise, helpful answer.\n\n` +
            `Question:\n${question}`,
        });
        return NextResponse.json({ answer: text, mode: 'direct' });
      } catch (e: any) {
        // Always respond
        return NextResponse.json({
          answer:
            'The AI service is temporarily unavailable. Your question was received.',
          mode: 'error-fallback',
          detail: e?.message ?? 'unknown'
        });
      }
    }

    // Default: use full RAG flow
    const result = await answerQuestionsAboutReport({ question, userId });
    return NextResponse.json({ ...result, mode: 'rag' });
  } catch (error: any) {
    console.error('answer-questions API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}



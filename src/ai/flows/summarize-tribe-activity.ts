'use server';

/**
 * @fileOverview Summarizes recent tribe activity for a user.
 *
 * - summarizeTribeActivity - A function that summarizes recent tribe activity.
 * - SummarizeTribeActivityInput - The input type for the summarizeTribeActivity function.
 * - SummarizeTribeActivityOutput - The return type for the summarizeTribeActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTribeActivityInputSchema = z.object({
  tribeName: z.string().describe('The name of the tribe to summarize activity for.'),
  recentActivity: z.string().describe('A description of recent activity within the tribe, including discussions and shared files.'),
});
export type SummarizeTribeActivityInput = z.infer<typeof SummarizeTribeActivityInputSchema>;

const SummarizeTribeActivityOutputSchema = z.object({
  summary: z.string().describe('A summary of the recent tribe activity.'),
});
export type SummarizeTribeActivityOutput = z.infer<typeof SummarizeTribeActivityOutputSchema>;

export async function summarizeTribeActivity(input: SummarizeTribeActivityInput): Promise<SummarizeTribeActivityOutput> {
  return summarizeTribeActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTribeActivityPrompt',
  input: {schema: SummarizeTribeActivityInputSchema},
  output: {schema: SummarizeTribeActivityOutputSchema},
  prompt: `You are an AI assistant helping a user catch up on tribe activity.

  Summarize the following recent activity within the tribe named {{{tribeName}}}.:

  {{{recentActivity}}}

  Provide a concise summary of the key discussions and shared files so the user can quickly understand what's happening.`,
});

const summarizeTribeActivityFlow = ai.defineFlow(
  {
    name: 'summarizeTribeActivityFlow',
    inputSchema: SummarizeTribeActivityInputSchema,
    outputSchema: SummarizeTribeActivityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

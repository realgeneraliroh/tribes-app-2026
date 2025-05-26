'use server';

/**
 * @fileOverview AI agent that suggests relevant threads from within the tribe that align with the current mood.
 *
 * - suggestThreadsForMood - A function that suggests threads based on the current mood.
 * - MoodBasedContentSuggestionsInput - The input type for the suggestThreadsForMood function.
 * - MoodBasedContentSuggestionsOutput - The return type for the suggestThreadsForMood function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MoodBasedContentSuggestionsInputSchema = z.object({
  currentMood: z
    .string()
    .describe('The current mood of the user, e.g., happy, sad, excited.'),
  tribeThreads: z
    .array(z.string())
    .describe('A list of thread titles from within the tribe.'),
  userInterests: z
    .array(z.string())
    .describe('A list of the users interests, e.g., sports, technology, art.'),
});
export type MoodBasedContentSuggestionsInput = z.infer<
  typeof MoodBasedContentSuggestionsInputSchema
>;

const MoodBasedContentSuggestionsOutputSchema = z.object({
  suggestedThreads: z
    .array(z.string())
    .describe(
      'A list of thread titles that are relevant to the current mood and user interests.'
    ),
  reasoning: z
    .string()
    .describe(
      'A brief explanation of why these threads were suggested, considering the mood and interests.'
    ),
});
export type MoodBasedContentSuggestionsOutput = z.infer<
  typeof MoodBasedContentSuggestionsOutputSchema
>;

export async function suggestThreadsForMood(
  input: MoodBasedContentSuggestionsInput
): Promise<MoodBasedContentSuggestionsOutput> {
  return moodBasedContentSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moodBasedContentSuggestionsPrompt',
  input: {schema: MoodBasedContentSuggestionsInputSchema},
  output: {schema: MoodBasedContentSuggestionsOutputSchema},
  prompt: `You are an AI assistant designed to suggest relevant threads from a tribe to a user based on their current mood and interests.

  Current Mood: {{{currentMood}}}
  User Interests: {{#each userInterests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Tribe Threads:
  {{#each tribeThreads}}
  - {{{this}}}
  {{/each}}

  Based on the user's current mood and interests, suggest 3 threads from the tribe that would be most relevant. Provide a brief explanation of why these threads were suggested. Return the list of suggested threads and reasoning in the JSON format.`,
});

const moodBasedContentSuggestionsFlow = ai.defineFlow(
  {
    name: 'moodBasedContentSuggestionsFlow',
    inputSchema: MoodBasedContentSuggestionsInputSchema,
    outputSchema: MoodBasedContentSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

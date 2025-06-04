
'use server';

/**
 * @fileOverview Generates a compelling description for an event.
 *
 * - generateEventDescription - A function that generates the event description.
 * - GenerateEventDescriptionInput - The input type for the generateEventDescription function.
 * - GenerateEventDescriptionOutput - The return type for the generateEventDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEventDescriptionInputSchema = z.object({
  name: z
    .string()
    .describe('The name of the event.'),
  keywords: z
    .string()
    .describe('Comma-separated keywords that describe the event and its atmosphere (e.g., Live Music, Tech Workshop, Community Gathering).'),
  locationName: z
    .string()
    .describe('The name or general description of the event venue or location (e.g., Downtown Park, The Grand Ballroom, Online).'),
  locationCityRegion: z
    .string()
    .describe('The city and region/state of the event (e.g., San Francisco, CA, London, UK).'),
});
export type GenerateEventDescriptionInput = z.infer<
  typeof GenerateEventDescriptionInputSchema
>;

const GenerateEventDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A compelling description of the event based on its name, keywords, and location.'),
});
export type GenerateEventDescriptionOutput = z.infer<
  typeof GenerateEventDescriptionOutputSchema
>;

export async function generateEventDescription(
  input: GenerateEventDescriptionInput
): Promise<GenerateEventDescriptionOutput> {
  return generateEventDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventDescriptionPrompt',
  input: {schema: GenerateEventDescriptionInputSchema},
  output: {schema: GenerateEventDescriptionOutputSchema},
  prompt: `You are an expert event marketing copywriter. Generate a compelling and engaging description for an event.

Event Name: {{{name}}}
Event Keywords: {{{keywords}}}
Event Venue/Location: {{{locationName}}}
Event City/Region: {{{locationCityRegion}}}

The description should:
- Be enthusiastic and make people want to attend.
- Clearly convey the essence of the event based on the name, keywords, and location.
- If the location is not "Online", subtly weave in the location (venue or city) to enhance the local feel where appropriate.
- Highlight what makes the event special or unique.
- Be suitable for an event listing or promotional material.
- Be approximately 2-4 sentences long.`,
});

const generateEventDescriptionFlow = ai.defineFlow(
  {
    name: 'generateEventDescriptionFlow',
    inputSchema: GenerateEventDescriptionInputSchema,
    outputSchema: GenerateEventDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

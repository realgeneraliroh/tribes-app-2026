
/**
 * @fileoverview Data access layer for "Our Story" topics.
 * This centralizes logic for fetching story data, preparing for a real backend.
 */

import {
  mockStoryTopics,
  mockArticlesForStory,
  mockCommentsForStory,
  type StoryTopic,
  type SourceArticle
} from '@/lib/data';
import type { DiscussionComment } from '@/lib/types';

/**
 * Fetches all story topics.
 * @returns A promise that resolves to an array of all story topics.
 */
export async function getStoryTopics(): Promise<StoryTopic[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockStoryTopics);
    }, 250);
  });
}

/**
 * Fetches a single story topic by its ID.
 * @param storyId The ID of the story topic to fetch.
 * @returns A promise that resolves to the topic, or null if not found.
 */
export async function getStoryTopicById(storyId: string): Promise<StoryTopic | null> {
    return new Promise(resolve => {
        setTimeout(() => {
            const topic = mockStoryTopics.find(s => s.id === storyId);
            resolve(topic || null);
        }, 250);
    });
}

/**
 * Fetches the related articles for a specific story topic.
 * @param storyId The ID of the story topic.
 * @returns A promise that resolves to an array of source articles.
 */
export async function getArticlesForStory(storyId: string): Promise<SourceArticle[]> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockArticlesForStory[storyId] || []);
        }, 250);
    });
}

/**
 * Fetches the discussion comments for a specific story topic.
 * @param storyId The ID of the story topic.
 * @returns A promise that resolves to an array of discussion comments.
 */
export async function getCommentsForStory(storyId: string): Promise<DiscussionComment[]> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockCommentsForStory[storyId] || []);
        }, 250);
    });
}

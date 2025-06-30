/**
 * @fileoverview Service layer for moderation actions.
 * This file centralizes logic for actions like reporting content,
 * preparing it to be easily replaced by real API calls or Server Actions.
 */

import { mockReportedContentData, type ReportedPost } from '@/lib/data';

interface ReportPostPayload {
    postId: string;
    postTitle?: string;
    reporterName: string;
    reason: string;
}

/**
 * Simulates reporting a post.
 * In a real app, this would be a server action that creates a report document in the database.
 * @param payload The data for the post report.
 * @returns A promise that resolves to the newly created report object.
 */
export async function reportPost(payload: ReportPostPayload): Promise<ReportedPost> {
  console.log("Service: Reporting post", payload);
  
  const newReport: ReportedPost = {
    ...payload,
    reportedAt: new Date(),
  };

  // Simulate async operation and update mock data
  return new Promise(resolve => {
    setTimeout(() => {
      mockReportedContentData.unshift(newReport); // Add to the beginning of the array
      resolve(newReport);
    }, 500);
  });
}


interface ReportCommentPayload {
  commentId: string;
  commentAuthor: string;
  reason: string;
}

/**
 * Simulates reporting a discussion comment.
 * In a real app, this would create a report document linked to the comment.
 * @param payload The data for the comment report.
 */
export async function reportComment(payload: ReportCommentPayload): Promise<void> {
    console.log("Service: Reporting comment", payload);

    // Since we don't have a mock array for reported comments, we'll just log this.
    // This establishes the pattern for a real implementation.
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`Report for comment ID ${payload.commentId} by ${payload.commentAuthor} submitted.`);
            resolve();
        }, 500);
    });
}

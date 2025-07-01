/**
 * @fileoverview Service layer for moderation actions.
 * This file centralizes logic for actions like reporting content,
 * preparing it to be easily replaced by real API calls or Server Actions.
 */

import { mockReportedContentData, type ReportedPost, initialSampleTribePosts } from '@/lib/data';

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
      // Prevent duplicate reports for the same post in the mock data
      const existingReportIndex = mockReportedContentData.findIndex(r => r.postId === payload.postId);
      if (existingReportIndex === -1) {
        mockReportedContentData.unshift(newReport); // Add to the beginning of the array
      }
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

/**
 * Simulates dismissing a report.
 * @param postId The ID of the post whose report is being dismissed.
 */
export async function dismissReport(postId: string): Promise<void> {
  console.log(`Service: Dismissing report for post ${postId}`);
  
  return new Promise(resolve => {
    setTimeout(() => {
      const reportIndex = mockReportedContentData.findIndex(r => r.postId === postId);
      if (reportIndex > -1) {
        mockReportedContentData.splice(reportIndex, 1);
      }
      resolve();
    }, 300);
  });
}

interface RemovePostPayload {
    postId: string;
    reason: string;
    preventRepost: boolean;
}

/**
 * Simulates removing a post.
 * This also implicitly dismisses the report associated with the post.
 * @param payload The details for removing the post.
 */
export async function removePost(payload: RemovePostPayload): Promise<void> {
  console.log("Service: Removing post", payload);

  return new Promise(resolve => {
    setTimeout(() => {
      // Dismiss the report
      const reportIndex = mockReportedContentData.findIndex(r => r.postId === payload.postId);
      if (reportIndex > -1) {
        mockReportedContentData.splice(reportIndex, 1);
      }

      // Mark the post as removed
      const postIndex = initialSampleTribePosts.findIndex(p => p.id === payload.postId);
      if (postIndex > -1) {
        initialSampleTribePosts[postIndex] = {
          ...initialSampleTribePosts[postIndex],
          isRemoved: true,
          canBeReposted: !payload.preventRepost,
          removalReason: payload.reason,
        };
      }
      resolve();
    }, 500);
  });
}

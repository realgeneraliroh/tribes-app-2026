/**
 * @fileoverview Service layer for moderation actions.
 * This file centralizes logic for actions like reporting content,
 * preparing it to be easily replaced by real API calls or Server Actions.
 */

import { mockReportedContentData, type ReportedPost, initialSampleTribePosts, type TribePost, tribesData, type Tribe, mockMembers } from '@/lib/data';
import { getTribeById, getTribes } from '@/lib/data-access/tribes';

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

interface BanMemberFromTribePayload {
    tribeId: string;
    memberId: string;
    reason: string;
    duration: string;
}

/**
 * Simulates banning a member from a specific tribe.
 * In a real app, this would update the member's status for that tribe.
 * @param payload The details for the tribe-specific ban.
 */
export async function banMemberFromTribe(payload: BanMemberFromTribePayload): Promise<void> {
    console.log("Service: Banning member from tribe", payload);
    return new Promise(resolve => {
        setTimeout(() => {
            const memberIndex = mockMembers.findIndex(m => m.id === payload.memberId && m.tribeId === payload.tribeId);
            if (memberIndex !== -1) {
                // In a real app, you'd add a 'bannedUntil' field or similar.
                // For this mock, we just remove them from the tribe's member list.
                mockMembers.splice(memberIndex, 1);
            }
            resolve();
        }, 300);
    });
}

/**
 * Fetches the IDs of all posts that have an active report.
 * Filters out reports for posts that have already been marked as removed.
 * @returns A promise that resolves to a Set of post IDs.
 */
export async function getActiveReportedPostIds(): Promise<Set<string>> {
    console.log(`Service: Fetching all active reported post IDs`);
    return new Promise(resolve => {
        setTimeout(() => {
            const activeReports = mockReportedContentData
                .map(report => {
                    const post = initialSampleTribePosts.find(p => p.id === report.postId);
                    return { report, post };
                })
                .filter(({ post }) => post && !post.isRemoved)
                .map(({ report }) => report.postId);

            resolve(new Set(activeReports));
        }, 150);
    });
}


/**
 * Fetches all active reports for a specific tribe.
 * @param tribeId The ID of the tribe.
 * @returns A promise that resolves to the tribe's info, its reports, and the related posts.
 */
export async function getActiveReportsForTribe(tribeId: string): Promise<{ tribe: Tribe | null, reports: ReportedPost[], posts: TribePost[] }> {
    console.log(`Service: Fetching active reports for tribe ${tribeId}`);
    return new Promise(async resolve => {
        const tribe = await getTribeById(tribeId);
        if (!tribe) {
            resolve({ tribe: null, reports: [], posts: [] });
            return;
        }
        
        const postsInTribe = initialSampleTribePosts.filter(p => p.tribeId === tribeId);
        const postIdsInTribe = new Set(postsInTribe.map(p => p.id));
        
        const reportsForTribe = mockReportedContentData.filter(report => 
            postIdsInTribe.has(report.postId)
        );

        // Filter out reports for posts that are already removed
        const activeReports = reportsForTribe.filter(report => {
            const post = postsInTribe.find(p => p.id === report.postId);
            return post && !post.isRemoved;
        });

        resolve({ tribe, reports: activeReports, posts: postsInTribe });
    });
}

/**
 * Fetches all active reports globally across all tribes.
 * @returns A promise that resolves to all reports, posts, and tribes.
 */
export async function getActiveGlobalReports(): Promise<{ reports: ReportedPost[], posts: TribePost[], tribes: Tribe[] }> {
    console.log(`Service: Fetching all active global reports`);
    return new Promise(async resolve => {
        const allTribes = await getTribes();
        
        // Filter out reports for posts that are already removed
        const activeReports = mockReportedContentData.filter(report => {
            const post = initialSampleTribePosts.find(p => p.id === report.postId);
            return post && !post.isRemoved;
        });

        resolve({ reports: activeReports, posts: initialSampleTribePosts, tribes: allTribes });
    });
}
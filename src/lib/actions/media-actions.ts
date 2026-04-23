'use server';

/**
 * Server actions for the media/storage system.
 * Provides secure access to private files via presigned URLs,
 * storage usage info, and file deletion.
 */

import { requireAuth, getCurrentUserId } from './shared';

// ======== MEDIA URL RESOLUTION ========

/**
 * Resolve a media file ID to a URL.
 * - Public files: returns the CDN URL
 * - Private files: generates a time-limited presigned URL (15 min)
 */
export async function resolveMediaUrl(fileId: string): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { getMediaUrl } = await import('@/lib/services/s3-service');
  return getMediaUrl(fileId, userId);
}

// ======== STORAGE USAGE ========

/**
 * Get current user's storage usage breakdown.
 */
export async function getMyStorageUsage(): Promise<{
  public: number;
  private: number;
  total: number;
}> {
  const userId = await requireAuth();
  const { getUserStorageUsage } = await import('@/lib/services/s3-service');
  return getUserStorageUsage(userId);
}

// ======== FILE DELETION ========

/**
 * Soft-delete a file owned by the current user.
 */
export async function deleteMediaFile(fileId: string): Promise<boolean> {
  const userId = await requireAuth();
  const { softDeleteMediaFile } = await import('@/lib/services/s3-service');
  return softDeleteMediaFile(fileId, userId);
}

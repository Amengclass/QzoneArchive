import { invoke } from "@tauri-apps/api/core";

export interface FeedPage {
  feeds: Record<string, unknown>[];
  attachInfo?: string;
  hasMore: boolean;
}

export function fetchFirstFeeds() {
  return invoke<FeedPage>("fetch_first_feeds");
}

export function fetchMoreFeeds(attachInfo: string) {
  return invoke<FeedPage>("fetch_more_feeds", { attachInfo });
}

export type ArchiveStatus = "idle" | "running" | "completed" | "cancelled" | "limited" | "error";
export interface ArchiveProgress { status: ArchiveStatus; pages: number; fetched: number; saved: number; message: string; retryAt?: number; }
export interface ArchiveItem {
  id: number; cellId: string; publishedAt: number; content?: string; authorUin?: string;
  authorName?: string; pictureUrls: string[]; videoUrl?: string; videoUrls: string[]; videoCoverUrl?: string; likeCount: number; commentCount: number;
  likes: LikeUser[];
  comments: ArchiveComment[];
}
export interface LikeUser { uin?: string; nickname?: string; }
export interface ArchiveReply { uin?: string; nickname?: string; content: string; createdAt: number; }
export interface ArchiveComment { uin?: string; nickname?: string; content: string; createdAt: number; replies: ArchiveReply[]; }
export type ArchiveCategory = "self" | "other" | "guestbook";
export interface ArchiveMediaItem { key: string; dynamicId: number; mediaType: "photo" | "video"; url: string; coverUrl?: string; publishedAt: number; authorUin?: string; authorName?: string; content?: string; }
export interface ArchiveMediaPage { items: ArchiveMediaItem[]; total: number; years: number[]; }
export const startFeedArchive = (intervalMs: number) => invoke<ArchiveProgress>("start_feed_archive", { intervalMs });
export const getArchiveProgress = () => invoke<ArchiveProgress>("get_archive_progress");
export const cancelFeedArchive = () => invoke<void>("cancel_feed_archive");
export const listArchivedFeeds = (limit = 100, offset = 0, category: ArchiveCategory = "self") => invoke<ArchiveItem[]>("list_archived_feeds", { limit, offset, category });
export const listArchivedMedia = (limit = 60, offset = 0, year?: number) => invoke<ArchiveMediaPage>("list_archived_media", { limit, offset, year });
export const getArchivedFeed = (id: number) => invoke<ArchiveItem>("get_archived_feed", { id });
export const countArchivedFeeds = (category: ArchiveCategory = "self") => invoke<number>("count_archived_feeds", { category });
export const exportArchivedHtml = (category: ArchiveCategory, ids?: number[]) => invoke<string>("export_archived_html", { category, ids });
export const loadArchivedVideo = (id: number) => invoke<string>("load_archived_video", { id });
export interface ArchiveOverview { dynamics: number; pictures: number; comments: number; likes: number; databaseBytes: number; }
export const getArchiveOverview = () => invoke<ArchiveOverview>("get_archive_overview");
export interface InteractionRank { uin: string; nickname: string; interactions: number; likes: number; comments: number; }
export const getInteractionRanking = (limit = 8) => invoke<InteractionRank[]>("get_interaction_ranking", { limit });
export const deleteArchivedFeeds = (ids: number[]) => invoke<number>("delete_archived_feeds", { ids });
export const clearArchivedFeeds = () => invoke<number>("clear_archived_feeds");
export const deleteAllAppData = () => invoke<void>("delete_all_app_data");

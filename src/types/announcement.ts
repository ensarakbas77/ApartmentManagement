/** Firestore'daki announcements/{id} dökümanı. */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  /** Önemli duyurular listede vurgulu gösterilir. */
  important: boolean;
  authorUid: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  important: boolean;
}

export const ANNOUNCEMENT_TITLE_MAX = 100;
export const ANNOUNCEMENT_BODY_MAX = 2000;

export type NotificationFilter = "all" | "unread";

export interface AppNotification {
  id: string;
  actorId: string | null;
  actorName: string;
  actorPhoto: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string | null;
}

import { firstArray, firstNumber, firstRecord, firstString, isRecord } from "@/shared/lib/records";
import { anyBooleanLike, getEntityId, resolveAvatarUrl } from "@/shared/lib/values";
import type { AppNotification } from "./notification.types";

/** Default copy per notification type, when the API sends no message. */
function describeType(type: string): string {
  if (type.includes("comment")) return "commented on your post";
  if (type.includes("like")) return "liked your post";
  if (type.includes("share")) return "shared your post";
  if (type.includes("follow")) return "started following you";
  return "sent you a notification";
}

export function normalizeNotification(raw: unknown): AppNotification | null {
  if (!isRecord(raw)) return null;

  const actor = firstRecord(raw, [
    ["fromUser"],
    ["sender"],
    ["user"],
    ["actor"],
    ["createdBy"],
  ]);

  const type = (
    firstString(raw, [["type"], ["action"], ["event"]]) ?? ""
  ).toLowerCase();

  return {
    id: getEntityId(raw) ?? firstString(raw, [["notificationId"]]) ?? "",
    actorId: getEntityId(actor),
    actorName:
      firstString(actor, [["name"], ["username"]]) ??
      firstString(raw, [["userName"]]) ??
      "Someone",
    actorPhoto: resolveAvatarUrl(actor?.photo, actor?.avatar, raw.userPhoto, raw.photo),
    content:
      firstString(raw, [["content"], ["message"], ["body"]]) ?? describeType(type),
    type,
    isRead: anyBooleanLike([raw.isRead, raw.read, raw.seen]),
    createdAt: firstString(raw, [["createdAt"], ["updatedAt"], ["date"]]),
  };
}

export function normalizeNotificationList(payload: unknown): AppNotification[] {
  return firstArray(payload, [
    ["data", "notifications"],
    ["notifications"],
    ["data", "data"],
    ["data"],
  ])
    .map(normalizeNotification)
    .filter((notification): notification is AppNotification => notification !== null);
}

export function extractUnreadCount(payload: unknown): number {
  return (
    firstNumber(payload, [
      ["data", "count"],
      ["data", "unreadCount"],
      ["count"],
      ["unreadCount"],
    ]) ?? 0
  );
}

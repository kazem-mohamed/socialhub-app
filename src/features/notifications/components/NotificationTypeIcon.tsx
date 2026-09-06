import {
  MessageCircleIcon,
  Repeat2Icon,
  ThumbsUpIcon,
  UserPlusIcon,
} from "@/shared/ui/icons";

/** Glyph badge overlaid on the actor's avatar. */
export function NotificationTypeIcon({ type }: { type: string }) {
  if (type.includes("follow")) return <UserPlusIcon size={11} />;
  if (type.includes("like")) return <ThumbsUpIcon size={11} />;
  if (type.includes("share")) return <Repeat2Icon size={11} />;
  return <MessageCircleIcon size={11} />;
}

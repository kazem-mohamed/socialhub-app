import { useAuth } from "@/features/auth/hooks/useAuth";
import { readUserIdFromToken } from "@/features/auth/lib/decodeToken";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { isSameEntity } from "@/shared/lib/values";
import type { Post } from "../model/post.types";

/**
 * Whether the signed-in user may edit or delete a post.
 *
 * Falls back to the id embedded in the token so the menu is correct on the
 * first paint, before the profile query resolves.
 */
export function useCanManagePost(post: Post): boolean {
  const { token } = useAuth();
  const { data: currentUser } = useCurrentUser();

  const currentUserId = currentUser?.id ?? readUserIdFromToken(token);
  const ownerId = post.author.id ?? post.ownerId;

  return isSameEntity(currentUserId, ownerId) || post.ownerFlag;
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { usersApi } from "../api/usersApi";

export interface FollowOverride {
  isFollowing: boolean;
  followersCount: number;
}

type FollowOverrides = Record<string, FollowOverride>;

interface ToggleFollowVariables {
  userId: string;
  currentIsFollowing: boolean;
  currentFollowersCount: number;
}

/**
 * Optimistic follow toggle shared by the profile page and the discovery panel,
 * which previously had two separate implementations of the same override map.
 *
 * The API returns no follow state, so the toggle is tracked as an override
 * layered on top of whatever the server last reported, and reconciled by the
 * refetch in `onSettled`.
 */
export function useToggleFollow(
  overrides: FollowOverrides,
  setOverrides: React.Dispatch<React.SetStateAction<FollowOverrides>>,
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ userId }: ToggleFollowVariables) => usersApi.toggleFollow(userId),
    onMutate: ({ userId, currentIsFollowing, currentFollowersCount }) => {
      const nextIsFollowing = !currentIsFollowing;
      setOverrides((previous) => ({
        ...previous,
        [userId]: {
          isFollowing: nextIsFollowing,
          followersCount: Math.max(0, currentFollowersCount + (nextIsFollowing ? 1 : -1)),
        },
      }));
    },
    onError: (_error, { userId, currentIsFollowing, currentFollowersCount }) => {
      setOverrides((previous) => ({
        ...previous,
        [userId]: {
          isFollowing: currentIsFollowing,
          followersCount: currentFollowersCount,
        },
      }));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });

  /** Applies any pending override on top of the server-reported state. */
  const resolve = (
    userId: string | null,
    serverIsFollowing: boolean,
    serverFollowersCount: number,
  ): FollowOverride => {
    const override = userId ? overrides[userId] : undefined;
    return {
      isFollowing: override?.isFollowing ?? serverIsFollowing,
      followersCount: override?.followersCount ?? serverFollowersCount,
    };
  };

  return {
    toggle: mutation.mutate,
    resolve,
    isPending: mutation.isPending,
    pendingUserId: mutation.isPending ? (mutation.variables?.userId ?? null) : null,
    error: mutation.error,
  };
}

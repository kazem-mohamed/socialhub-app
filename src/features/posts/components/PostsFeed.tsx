import { useState } from "react";
import { getErrorMessage } from "@/shared/api/errors";
import { Plate } from "@/shared/ui/Plate";
import { WallSkeleton } from "@/shared/ui/Skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { usePosts } from "../hooks/usePostsQueries";
import type { PostsFilter as PostsFilterValue } from "../model/post.types";
import { PostForm } from "./PostForm";
import { PostsFilter } from "./PostsFilter";
import { Wall } from "./Wall";
import { WorkPlate } from "./WorkPlate";

/**
 * Empty states that teach the room rather than announce a void.
 * Each says what this room collects and how something gets into it.
 */
const EMPTY_ROOMS: Record<PostsFilterValue, { title: string; body: string }> = {
  feed: {
    title: "This room is hung with the people you follow",
    body: "Nothing here yet. Find people in the index and their work starts appearing on this wall.",
  },
  "my-posts": {
    title: "Your own works hang here",
    body: "The blank plate at the top of the wall is where they start. Text alone is enough.",
  },
  community: {
    title: "Everything in the collection",
    body: "Nothing has come in yet. Post something and it will be the first work on this wall.",
  },
  saved: {
    title: "Works you set aside",
    body: "Use the bookmark on any plate and it is kept here, for you only.",
  },
};

/**
 * The wall.
 *
 * Works hang in one line down a reading column, newest first. Rooms filter
 * the wall from its head; the catalogue index in the shell owns
 * destinations — which is what keeps this from becoming the rail / column /
 * rail arrangement the direction exists to refuse.
 */
export function PostsFeed() {
  const { isAuthenticated } = useAuth();
  const { data: currentUser } = useCurrentUser();
  // Everyone is the room you land in: a new account follows nobody, so
  // "Following" opened onto an empty wall.
  const [activeFilter, setActiveFilter] = useState<PostsFilterValue>("community");

  const {
    data: posts = [],
    isLoading,
    isFetching,
    error,
  } = usePosts(activeFilter, currentUser?.id ?? null);

  const showWall = isAuthenticated && !isLoading && !error;
  const empty = EMPTY_ROOMS[activeFilter];

  return (
    <div className="min-h-screen bg-ground">
      {/* The wall label: which room you are standing in. */}
      <div className="sticky top-[57px] z-20 border-b border-rail bg-ground/88 backdrop-blur-lg lg:top-0">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <PostsFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <p
            aria-live="polite"
            className="hidden font-mono text-micro text-ink-3 tabular-nums sm:block"
          >
            {isFetching && !isLoading ? "Refreshing" : showWall ? `${posts.length} works` : ""}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] py-4 sm:px-8 sm:py-6">
        {isLoading ? (
          <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6">
            <WallSkeleton count={4} />
          </div>
        ) : null}

        {!isLoading && error ? (
          <Plate className="mx-auto max-w-[640px] border-l-2 border-l-verm p-6" isBleedOnMobile>
            <p className="font-mono text-micro font-medium tracking-[0.16em] text-verm-ink uppercase">
              Could not load the wall
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              {isAuthenticated
                ? getErrorMessage(error, "The collection did not respond. Refresh to try again.")
                : "Sign in to see this wall."}
            </p>
          </Plate>
        ) : null}

        {showWall ? (
          <Wall
            items={posts}
            getKey={(post) => post.id}
            lead={isAuthenticated ? <PostForm /> : undefined}
            renderItem={(post, index) => <WorkPlate post={post} index={index} />}
          />
        ) : null}

        {showWall && posts.length === 0 ? (
          <Plate className="mx-auto mt-6 max-w-[640px] p-8 text-center" isBleedOnMobile>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
              {empty.title}
            </h2>
            <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-ink-2">
              {empty.body}
            </p>
          </Plate>
        ) : null}

        {showWall && posts.length > 0 ? (
          <p className="mt-12 text-center font-mono text-micro tracking-[0.16em] text-ink-3 uppercase">
            End of this room
          </p>
        ) : null}
      </div>
    </div>
  );
}

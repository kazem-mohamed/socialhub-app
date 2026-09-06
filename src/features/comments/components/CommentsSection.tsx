import { useMemo, useState } from "react";
import { getErrorMessage } from "@/shared/api/errors";
import { formatCommentTime } from "@/shared/lib/dates";
import { Avatar } from "@/shared/ui/Avatar";
import { InlineSelect } from "@/shared/ui/InlineSelect";
import { PersonSkeleton } from "@/shared/ui/Skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { useCreateComment } from "../hooks/useCommentMutations";
import { useComments } from "../hooks/useCommentQueries";
import { flattenComments, readTotalCount } from "../model/comment.cache";
import { CommentComposer } from "./CommentComposer";
import { CommentThread } from "./CommentThread";

type SortOrder = "relevant" | "newest";

interface CommentsSectionProps {
  postId: string;
}

/**
 * What has been said about this work.
 *
 * Each voice is an entry with its own portrait and aura ring — the same
 * identity treatment the record's label uses, one indent deeper. No
 * bubbles: a coloured bubble was doing badly the job the ring does exactly.
 */
export function CommentsSection({ postId }: CommentsSectionProps) {
  const { isAuthenticated } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const [sortOrder, setSortOrder] = useState<SortOrder>("relevant");
  const [submitError, setSubmitError] = useState("");

  const commentsQuery = useComments(postId);
  const createComment = useCreateComment(postId, "comment", null, currentUser?.name ?? "You");

  const comments = useMemo(() => flattenComments(commentsQuery.data), [commentsQuery.data]);

  const sortedComments = useMemo(() => {
    if (sortOrder !== "newest") return comments;
    return [...comments].sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
    );
  }, [comments, sortOrder]);

  const total = readTotalCount(commentsQuery.data, sortedComments.length);
  const isReady = !commentsQuery.isLoading && !commentsQuery.error;

  async function handleSubmitComment(content: string) {
    setSubmitError("");
    try {
      await createComment.mutateAsync(content);
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Could not post that comment."));
    }
  }

  return (
    <section className="border-t border-rail px-5 pt-5 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-micro font-medium tracking-[0.16em] text-ink-3 uppercase tabular-nums">
          {total} {total === 1 ? "comment" : "comments"}
        </h2>

        {sortedComments.length > 1 ? (
          <InlineSelect
            label="Sort comments"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as SortOrder)}
            options={[
              { value: "relevant", label: "Most relevant" },
              { value: "newest", label: "Newest" },
            ]}
          />
        ) : null}
      </div>

      <div className="mt-3">
        {commentsQuery.isLoading ? (
          <div aria-hidden="true">
            <PersonSkeleton />
            <PersonSkeleton />
          </div>
        ) : null}

        {!commentsQuery.isLoading && commentsQuery.error ? (
          <p
            role="alert"
            className="border-l-2 border-l-verm py-2 pl-3 font-mono text-micro text-verm-ink"
          >
            {getErrorMessage(commentsQuery.error, "Could not load the comments.")}
          </p>
        ) : null}

        {isReady && sortedComments.length === 0 ? (
          <p className="py-3 text-sm leading-relaxed text-ink-2">
            Nothing said about this yet. Be the first.
          </p>
        ) : null}

        {isReady
          ? sortedComments.map((comment) => (
              <article
                key={comment.id}
                className={`flex items-start gap-3 border-t border-rail py-4 first:border-t-0 ${
                  comment.isOptimistic ? "opacity-55" : ""
                }`}
              >
                <Avatar
                  alt={comment.authorName}
                  seed={comment.authorHandle}
                  size={32}
                  src={comment.authorPhoto}
                  className="mt-0.5"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-sm font-semibold text-ink">{comment.authorName}</p>
                    <span className="font-mono text-micro text-ink-3 tabular-nums">
                      {comment.authorHandle}
                    </span>
                    <span aria-hidden="true" className="font-mono text-micro text-rail-strong">
                      ·
                    </span>
                    <time
                      dateTime={comment.createdAt ?? undefined}
                      className="font-mono text-micro text-ink-3 tabular-nums"
                    >
                      {formatCommentTime(comment.createdAt)}
                    </time>
                  </div>

                  {comment.content ? (
                    <p className="mt-1.5 text-base leading-relaxed whitespace-pre-wrap text-ink-2">
                      {comment.content}
                    </p>
                  ) : null}

                  <CommentThread
                    postId={postId}
                    comment={comment}
                    currentUserId={currentUser?.id ?? null}
                    currentUserName={currentUser?.name ?? "You"}
                  />
                </div>
              </article>
            ))
          : null}

        {isReady && commentsQuery.hasNextPage ? (
          <button
            type="button"
            onClick={() => void commentsQuery.fetchNextPage()}
            disabled={commentsQuery.isFetchingNextPage}
            className="w-full cursor-pointer border-t border-rail py-3 font-mono text-micro font-medium tracking-[0.14em] text-ink-3 uppercase transition-colors duration-150 hover:text-ink disabled:opacity-45"
          >
            {commentsQuery.isFetchingNextPage ? "Loading" : "Earlier comments"}
          </button>
        ) : null}
      </div>

      <CommentComposer
        authorName={currentUser?.name ?? "You"}
        authorPhoto={currentUser?.photo}
        authorHandle={currentUser?.handle ?? currentUser?.name ?? "you"}
        isDisabled={!isAuthenticated}
        isSubmitting={createComment.isPending}
        submitError={submitError}
        onSubmit={handleSubmitComment}
      />
    </section>
  );
}

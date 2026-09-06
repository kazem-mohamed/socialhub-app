import { getErrorMessage } from "@/shared/api/errors";
import { queryKeys } from "@/shared/api/queryKeys";
import { formatCommentTime } from "@/shared/lib/dates";
import { Avatar } from "@/shared/ui/Avatar";
import { PersonSkeleton } from "@/shared/ui/Skeleton";
import { StateMessage } from "@/shared/ui/StateMessage";
import { useToggleCommentLike } from "../hooks/useCommentMutations";
import type { Comment } from "../model/comment.types";

interface ReplyItemProps {
  postId: string;
  parentCommentId: string;
  reply: Comment;
}

function ReplyItem({ postId, parentCommentId, reply }: ReplyItemProps) {
  const likeMutation = useToggleCommentLike(
    postId,
    reply,
    queryKeys.comments.replies(postId, parentCommentId),
  );

  return (
    <article
      className={`flex items-start gap-2.5 py-3 ${reply.isOptimistic ? "opacity-55" : ""}`}
    >
      <Avatar alt={reply.authorName} seed={reply.authorHandle} size={24} src={reply.authorPhoto} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-label font-semibold text-ink">{reply.authorName}</p>
          <time
            dateTime={reply.createdAt ?? undefined}
            className="font-mono text-micro tracking-[0.06em] text-ink-3 tabular-nums"
          >
            {formatCommentTime(reply.createdAt)}
          </time>
        </div>

        {reply.content ? (
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-ink-2">
            {reply.content}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending || reply.isOptimistic}
          aria-pressed={reply.isLiked}
          className={`mt-2 cursor-pointer font-mono text-micro font-medium tracking-[0.14em] uppercase tabular-nums transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
            reply.isLiked ? "text-verm-ink" : "text-ink-3 hover:text-ink"
          }`}
        >
          {likeMutation.isPending ? "Liking" : `Like ${reply.likesCount || ""}`}
        </button>
      </div>
    </article>
  );
}

interface ReplyListProps {
  postId: string;
  parentCommentId: string;
  replies: Comment[];
  isLoading: boolean;
  error: unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

/** Replies sit one further indent in, behind their own rule. */
export function ReplyList({
  postId,
  parentCommentId,
  replies,
  isLoading,
  error,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: ReplyListProps) {
  const isReady = !isLoading && !error;

  return (
    <div className="mt-3 border-l border-rail pl-4">
      {isLoading ? (
        <div aria-hidden="true">
          <PersonSkeleton />
        </div>
      ) : null}

      {!isLoading && error ? (
        <StateMessage variant="error" size="compact">
          {getErrorMessage(error, "Could not load replies.")}
        </StateMessage>
      ) : null}

      {isReady && replies.length === 0 ? (
        <StateMessage size="compact">No replies yet</StateMessage>
      ) : null}

      {isReady
        ? replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              postId={postId}
              parentCommentId={parentCommentId}
              reply={reply}
            />
          ))
        : null}

      {isReady && hasNextPage ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isFetchingNextPage}
          className="cursor-pointer py-2 font-mono text-micro font-medium tracking-[0.16em] text-ink-3 uppercase transition-colors duration-200 hover:text-ink disabled:opacity-45"
        >
          {isFetchingNextPage ? "Loading" : "More replies"}
        </button>
      ) : null}
    </div>
  );
}

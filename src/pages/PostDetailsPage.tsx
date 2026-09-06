import { useNavigate, useParams, useSearchParams } from "react-router";
import { getErrorMessage } from "@/shared/api/errors";
import { formatDateTime } from "@/shared/lib/dates";
import { Plate } from "@/shared/ui/Plate";
import { PlateSkeleton } from "@/shared/ui/Skeleton";
import { ArrowLeftIcon } from "@/shared/ui/icons";
import { routes } from "@/app/router/routes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PostCard } from "@/features/posts/components/PostCard";
import { usePost } from "@/features/posts/hooks/usePostsQueries";

/**
 * The object record.
 *
 * A work taken off the wall and examined: the piece at full size, its
 * tombstone label set at record scale, then the full condition report —
 * every action, and the discussion, in one uninterrupted column. The image
 * carries the same `view-transition-name` the wall plate used, so it
 * travels here rather than the page simply replacing itself.
 */
export default function PostDetailsPage() {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: post, isLoading, error } = usePost(postId);
  const openCommentsByDefault = searchParams.get("showComments") === "1";

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(routes.home);
  }

  return (
    <div className="min-h-screen bg-ground">
      <div className="mx-auto max-w-[720px] px-5 pt-8 pb-20 sm:px-8">
        <button
          type="button"
          onClick={handleBack}
          className="group/back inline-flex cursor-pointer items-center gap-2 rounded-[2px] py-1 font-mono text-micro font-medium tracking-[0.14em] text-ink-3 uppercase transition-colors duration-150 hover:text-ink"
        >
          <ArrowLeftIcon
            size={13}
            className="transition-transform duration-200 ease-out group-hover/back:-translate-x-0.5"
          />
          Back to the wall
        </button>

        <div className="mt-6">
          {isLoading ? <PlateSkeleton /> : null}

          {!isLoading && error ? (
            <Plate className="border-l-2 border-l-verm p-6">
              <p className="font-mono text-micro font-medium tracking-[0.16em] text-verm-ink uppercase">
                Could not open this record
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                {isAuthenticated
                  ? getErrorMessage(error, "The record did not respond. Try again.")
                  : "Sign in to read this."}
              </p>
            </Plate>
          ) : null}

          {!isLoading && !error && !post ? (
            <Plate className="p-8 text-center">
              <h1 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                No record under that number
              </h1>
              <p className="mx-auto mt-2 max-w-[40ch] text-sm leading-relaxed text-ink-2">
                It may have been removed from the collection.
              </p>
            </Plate>
          ) : null}

          {!isLoading && !error && post ? (
            <article>
              {/* The record carries its own label through PostCardHeader —
                  a second copy out here was the same facts twice. */}
              <Plate className="overflow-hidden">
                <PostCard
                  post={post}
                  showTopComment={false}
                  initialCommentsOpen={openCommentsByDefault}
                />
              </Plate>

              <p className="mt-4 font-mono text-micro text-ink-3">
                Entered the collection {formatDateTime(post.createdAt)}
              </p>
            </article>
          ) : null}
        </div>
      </div>
    </div>
  );
}

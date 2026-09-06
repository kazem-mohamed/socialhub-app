import { useState } from "react";
import { Link } from "react-router";
import { getErrorMessage } from "@/shared/api/errors";
import { accessionNumber, auraRingColor } from "@/shared/lib/aura";
import { Avatar } from "@/shared/ui/Avatar";
import { Plate } from "@/shared/ui/Plate";
import { SearchInput } from "@/shared/ui/SearchInput";
import { PersonSkeleton } from "@/shared/ui/Skeleton";
import { routes } from "@/app/router/routes";
import { useToggleFollow, type FollowOverride } from "@/features/users/hooks/useToggleFollow";
import { useUserDiscovery } from "@/features/users/hooks/useUserDiscovery";

/**
 * The index of contributors.
 *
 * User search already existed in the API but had no home of its own — it
 * was buried in a sidebar panel. Here it is a room: every person listed as
 * a catalogue entry, with the colour that belongs to them and the number
 * they were given.
 */
export default function PeoplePage() {
  const [searchValue, setSearchValue] = useState("");
  const [followOverrides, setFollowOverrides] = useState<Record<string, FollowOverride>>({});

  const discovery = useUserDiscovery(searchValue, true);
  const follow = useToggleFollow(followOverrides, setFollowOverrides);

  const { users, isLoading, error, hasNextPage, isFetchingNextPage } = discovery;
  const isSearching = searchValue.trim().length > 0;

  return (
    <div className="min-h-screen bg-ground">
      <div className="mx-auto max-w-[760px] px-5 py-8 sm:px-8 sm:py-12">
        <header>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">People</h1>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-ink-2">
            Everyone in the collection. Each carries one colour and one number,
            neither of which they chose.
          </p>
        </header>

        <div className="mt-8">
          <SearchInput
            label="Search people"
            placeholder="Search by name or username"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onClear={() => setSearchValue("")}
          />
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <PersonSkeleton key={index} />
              ))}
            </div>
          ) : null}

          {!isLoading && error ? (
            <Plate className="border-l-2 border-l-verm p-5">
              <p className="font-mono text-micro font-medium tracking-[0.16em] text-verm-ink uppercase">
                Could not load people
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                {getErrorMessage(error, "The index did not respond. Try again.")}
              </p>
            </Plate>
          ) : null}

          {!isLoading && !error && users.length === 0 ? (
            <Plate className="p-8 text-center">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                {isSearching ? "No entry under that name" : "The index is empty"}
              </h2>
              <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-ink-2">
                {isSearching
                  ? "Try a shorter search — a first name or the start of a username."
                  : "Nobody has been catalogued yet."}
              </p>
            </Plate>
          ) : null}

          {!isLoading && !error
            ? users.map((user) => {
                const resolved = follow.resolve(user.id, user.isFollowing, user.followersCount);
                return (
                  <article
                    key={user.id}
                    className="flex items-center gap-3.5 border-b border-rail py-3.5"
                  >
                    <span
                      aria-hidden="true"
                      className="h-9 w-1.5 shrink-0 rounded-[1px]"
                      style={{ background: auraRingColor(user.username) }}
                    />

                    <Link
                      to={routes.userProfile(user.id)}
                      viewTransition
                      className="group/person flex min-w-0 flex-1 items-center gap-3"
                    >
                      <Avatar
                        alt={user.name}
                        seed={user.username}
                        size={36}
                        src={user.photo}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink transition-colors duration-150 group-hover/person:text-verm-ink">
                          {user.name}
                        </p>
                        <p className="truncate font-mono text-micro text-ink-3 tabular-nums">
                          @{user.username} · {accessionNumber(user.username)}
                        </p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        follow.toggle({
                          userId: user.id,
                          currentIsFollowing: resolved.isFollowing,
                          currentFollowersCount: resolved.followersCount,
                        })
                      }
                      disabled={follow.pendingUserId === user.id}
                      aria-pressed={resolved.isFollowing}
                      className={[
                        "shrink-0 cursor-pointer rounded-[2px] border px-3 py-1.5",
                        "font-mono text-micro font-medium tracking-[0.12em] uppercase",
                        "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45",
                        resolved.isFollowing
                          ? "border-rail text-ink-3 hover:border-verm hover:text-verm-ink"
                          : "border-verm bg-verm text-on-verm hover:opacity-90",
                      ].join(" ")}
                    >
                      {follow.pendingUserId === user.id
                        ? "…"
                        : resolved.isFollowing
                          ? "Following"
                          : "Follow"}
                    </button>
                  </article>
                );
              })
            : null}

          {!isLoading && !error && hasNextPage ? (
            <button
              type="button"
              onClick={() => void discovery.fetchNextPage()}
              disabled={isFetchingNextPage}
              className="mt-5 w-full cursor-pointer rounded-[2px] border border-rail py-2.5 font-mono text-micro font-medium tracking-[0.14em] text-ink-2 uppercase transition-colors duration-150 hover:border-rail-strong hover:text-ink disabled:opacity-45"
            >
              {isFetchingNextPage ? "Loading" : "More people"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

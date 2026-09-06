import { useState } from "react";
import { getErrorMessage } from "@/shared/api/errors";
import { Label } from "@/shared/ui/Label";
import { StateMessage } from "@/shared/ui/StateMessage";
import { SearchInput } from "@/shared/ui/SearchInput";
import { ArrowLeftIcon } from "@/shared/ui/icons";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useToggleFollow, type FollowOverride } from "../../hooks/useToggleFollow";
import { useUserDiscovery } from "../../hooks/useUserDiscovery";
import type { DiscoveredUser } from "../../model/user.types";
import { UserCard } from "./UserCard";

interface UserDiscoveryPanelProps {
  mode?: "desktop" | "mobile";
}

const MORE_BUTTON_CLASS =
  "w-full cursor-pointer border-t border-rail py-3 font-mono text-micro font-medium uppercase tracking-[0.16em] text-ink-3 transition-colors duration-200 hover:text-ink disabled:opacity-45";

/**
 * People you could follow: a sidebar column on desktop, a collapsible
 * section plus a fullscreen browser on mobile.
 */
export function UserDiscoveryPanel({ mode = "desktop" }: UserDiscoveryPanelProps) {
  const isMobile = mode === "mobile";
  const { isAuthenticated } = useAuth();

  const [searchValue, setSearchValue] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileBrowserOpen, setIsMobileBrowserOpen] = useState(false);
  const [followOverrides, setFollowOverrides] = useState<Record<string, FollowOverride>>({});

  useScrollLock(isMobile && isMobileBrowserOpen);

  const isSearchVisible = !isMobile || isMobileOpen || isMobileBrowserOpen;
  const discovery = useUserDiscovery(searchValue, isSearchVisible);
  const follow = useToggleFollow(followOverrides, setFollowOverrides);

  const { users, isLoading, error, hasNextPage, isFetchingNextPage } = discovery;

  function renderUser(user: DiscoveredUser, layout: "list" | "grid") {
    const resolved = follow.resolve(user.id, user.isFollowing, user.followersCount);

    return (
      <UserCard
        key={`${layout}-${user.id}`}
        user={user}
        layout={layout}
        isFollowing={resolved.isFollowing}
        followersCount={resolved.followersCount}
        isUpdating={follow.pendingUserId === user.id}
        onToggleFollow={() =>
          follow.toggle({
            userId: user.id,
            currentIsFollowing: resolved.isFollowing,
            currentFollowersCount: resolved.followersCount,
          })
        }
      />
    );
  }

  const searchInput = (
    <SearchInput
      label="Search people"
      placeholder="Search people"
      value={searchValue}
      onChange={(event) => setSearchValue(event.target.value)}
      onClear={() => setSearchValue("")}
    />
  );

  const statusBlocks = (
    <>
      {!isAuthenticated ? <StateMessage size="compact">Sign in to see people</StateMessage> : null}

      {isAuthenticated && isLoading ? (
        <StateMessage size="compact">Loading people</StateMessage>
      ) : null}

      {isAuthenticated && !isLoading && error ? (
        <StateMessage variant="error" size="compact">
          {getErrorMessage(error, "Could not load people.")}
        </StateMessage>
      ) : null}

      {isAuthenticated && !error && follow.error ? (
        <StateMessage variant="error" size="compact">
          {getErrorMessage(follow.error, "Could not update that follow.")}
        </StateMessage>
      ) : null}
    </>
  );

  const showList = isAuthenticated && !isLoading && !error;

  if (isMobile && isMobileBrowserOpen) {
    return (
      <div className="fixed inset-0 z-[70] overflow-y-auto bg-ground xl:hidden">
        <div className="mx-auto max-w-[760px] px-5 py-8 sm:px-10">
          <button
            type="button"
            onClick={() => setIsMobileBrowserOpen(false)}
            className="group/back inline-flex cursor-pointer items-center gap-2.5 font-mono text-micro font-medium tracking-[0.16em] text-ink-3 uppercase transition-colors duration-200 hover:text-ink"
          >
            <ArrowLeftIcon
              size={14}
              className="transition-transform duration-300 ease-out group-hover/back:-translate-x-1"
            />
            Back to feed
          </button>

          <h1 className="mt-8 text-[clamp(2rem,5vw,2.75rem)] leading-none font-semibold tracking-[-0.04em] text-ink">
            People
          </h1>

          <div className="mt-7">{searchInput}</div>

          <div className="mt-6">
            {statusBlocks}

            {showList ? (
              <>
                {users.length > 0 ? (
                  users.map((user) => renderUser(user, "grid"))
                ) : (
                  <StateMessage size="compact">No people found</StateMessage>
                )}

                {hasNextPage ? (
                  <button
                    type="button"
                    className={MORE_BUTTON_CLASS}
                    onClick={() => void discovery.fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Loading" : "More people"}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="border-b border-rail xl:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen((open) => !open)}
          aria-expanded={isMobileOpen}
          className="flex w-full cursor-pointer items-center justify-between py-3.5 text-left"
        >
          <Label tone="strong">People to follow</Label>
          <span className="font-mono text-micro tracking-[0.14em] text-ink-3 uppercase">
            {isMobileOpen ? "Hide" : "Show"}
          </span>
        </button>

        {isMobileOpen ? (
          <div className="pb-4">
            {searchInput}

            <div className="mt-4">
              {statusBlocks}

              {showList ? (
                <>
                  {users.length > 0 ? (
                    users.map((user) => renderUser(user, "list"))
                  ) : (
                    <StateMessage size="compact">No people found</StateMessage>
                  )}

                  <button
                    type="button"
                    className={MORE_BUTTON_CLASS}
                    onClick={() => setIsMobileBrowserOpen(true)}
                  >
                    Browse all
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <aside className="hidden h-fit xl:sticky xl:top-[73px] xl:block xl:pt-7">
      <Label as="p" className="mb-4 block">
        People
      </Label>

      {searchInput}

      <div className="mt-4">
        {statusBlocks}

        {showList ? (
          <>
            {users.length > 0 ? (
              users.map((user) => renderUser(user, "list"))
            ) : (
              <StateMessage size="compact">No people found</StateMessage>
            )}

            {hasNextPage ? (
              <button
                type="button"
                className={MORE_BUTTON_CLASS}
                onClick={() => void discovery.fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading" : "More"}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </aside>
  );
}

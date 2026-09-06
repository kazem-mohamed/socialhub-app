import { accessionNumber, auraFor, auraGradient, auraRingColor } from "@/shared/lib/aura";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { CameraIcon, ExpandIcon } from "./profileIcons";
import { TrashIcon } from "@/shared/ui/icons";

interface CollectionHeaderProps {
  name: string;
  handle: string;
  email?: string | null;
  avatarUrl: string | null | undefined;
  coverUrl: string;
  followersCount: number;
  followingCount: number;
  worksCount: number;
  /** Own profile: editing affordances. Someone else's: the follow control. */
  canEdit: boolean;
  isFollowing?: boolean;
  isFollowUpdating?: boolean;
  onToggleFollow?: () => void;
  isPhotoUploading?: boolean;
  isCoverUpdating?: boolean;
  onViewPhoto?: () => void;
  onSelectPhoto?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onViewCover?: () => void;
  onSelectCover?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCover?: () => void;
}

const COVER_ACTION =
  "pointer-events-auto inline-flex cursor-pointer items-center gap-1.5 rounded-[2px] bg-ground/75 px-2.5 py-1.5 font-mono text-micro font-medium tracking-[0.12em] text-ink uppercase backdrop-blur transition-colors duration-150 hover:bg-ground disabled:cursor-not-allowed disabled:opacity-45";

/**
 * The head of a personal collection.
 *
 * A person gets the same treatment their works do: a plate, then a label
 * stating only what is true — who they are, the number they hold, and the
 * measured colour that is theirs. With no cover uploaded the banner falls
 * back to their own aura rather than to stock decoration, so an empty
 * profile still belongs unmistakably to one person.
 */
export function CollectionHeader({
  name,
  handle,
  email,
  avatarUrl,
  coverUrl,
  followersCount,
  followingCount,
  worksCount,
  canEdit,
  isFollowing = false,
  isFollowUpdating = false,
  onToggleFollow,
  isPhotoUploading = false,
  isCoverUpdating = false,
  onViewPhoto,
  onSelectPhoto,
  onViewCover,
  onSelectCover,
  onRemoveCover,
}: CollectionHeaderProps) {
  const aura = auraFor(handle);

  return (
    <section>
      <div
        className="group/cover relative h-36 overflow-hidden border-b border-rail sm:h-48"
        style={coverUrl ? undefined : { background: auraGradient(handle) }}
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : null}

        {canEdit ? (
          <div className="pointer-events-none absolute top-3 right-3 flex flex-wrap justify-end gap-2 transition-opacity duration-150 sm:opacity-0 sm:group-hover/cover:opacity-100 sm:group-focus-within/cover:opacity-100">
            {coverUrl ? (
              <>
                <button type="button" onClick={onViewCover} className={COVER_ACTION}>
                  <ExpandIcon size={12} />
                  View
                </button>
                <label className={COVER_ACTION}>
                  <CameraIcon size={12} />
                  {isCoverUpdating ? "Updating" : "Change"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isCoverUpdating}
                    onChange={onSelectCover}
                  />
                </label>
                <button
                  type="button"
                  onClick={onRemoveCover}
                  disabled={isCoverUpdating}
                  className={COVER_ACTION}
                >
                  <TrashIcon size={12} />
                  Remove
                </button>
              </>
            ) : (
              <label className={COVER_ACTION}>
                <CameraIcon size={12} />
                {isCoverUpdating ? "Updating" : "Add cover"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={isCoverUpdating}
                  onChange={onSelectCover}
                />
              </label>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-6 pt-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="group/avatar relative shrink-0">
            <Avatar alt={name} seed={handle} size={72} src={avatarUrl} />

            {onViewPhoto ? (
              <button
                type="button"
                onClick={onViewPhoto}
                aria-label="View profile photo"
                className="absolute bottom-0 left-0 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-ground/85 text-ink backdrop-blur transition-opacity duration-150 sm:opacity-0 sm:group-hover/avatar:opacity-100 sm:group-focus-within/avatar:opacity-100"
              >
                <ExpandIcon size={13} />
              </button>
            ) : null}

            {canEdit ? (
              <label
                aria-label="Change profile photo"
                className="absolute right-0 bottom-0 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-ground/85 text-ink backdrop-blur transition-opacity duration-150 sm:opacity-0 sm:group-hover/avatar:opacity-100 sm:group-focus-within/avatar:opacity-100"
              >
                <CameraIcon size={13} />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={isPhotoUploading}
                  onChange={onSelectPhoto}
                />
              </label>
            ) : null}

            {isPhotoUploading ? (
              <span className="absolute -bottom-5 left-0 font-mono text-micro whitespace-nowrap text-verm-ink">
                Uploading
              </span>
            ) : null}
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] text-ink">
              {name}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 font-mono text-label text-ink-3 tabular-nums">
              <span className="truncate">{handle}</span>
              <span aria-hidden="true" className="text-rail-strong">
                ·
              </span>
              <span className="tracking-[0.06em]">{accessionNumber(handle)}</span>
            </div>

            {/* The colour-reference chip, stated with its measurement. */}
            <div className="mt-3 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-4 w-8 rounded-[1px]"
                style={{ background: auraRingColor(handle) }}
              />
              <span className="font-mono text-micro text-ink-3 tabular-nums">
                {aura.h1}° · {aura.sat}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 sm:items-end">
          {!canEdit && onToggleFollow ? (
            <Button
              variant={isFollowing ? "ghost" : "primary"}
              onClick={onToggleFollow}
              isBusy={isFollowUpdating}
              busyLabel="Updating"
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          ) : null}

          <dl className="flex gap-6">
            <Holding label="Works" value={worksCount} />
            <Holding label="Followers" value={followersCount} />
            <Holding label="Following" value={followingCount} />
          </dl>
        </div>
      </div>

      {canEdit && email ? (
        <p className="mt-5 border-t border-rail pt-4 font-mono text-micro text-ink-3">
          {email}
        </p>
      ) : null}
    </section>
  );
}

function Holding({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="font-mono text-lg leading-none font-semibold text-ink tabular-nums">
        {value}
      </dd>
      <dt className="mt-1.5 font-mono text-micro tracking-[0.14em] text-ink-3 uppercase">
        {label}
      </dt>
    </div>
  );
}

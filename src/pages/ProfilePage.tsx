import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { getErrorMessage } from "@/shared/api/errors";
import { FeedbackAlert } from "@/shared/ui/FeedbackAlert";
import { Plate } from "@/shared/ui/Plate";
import { WallSkeleton } from "@/shared/ui/Skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Wall } from "@/features/posts/components/Wall";
import { WorkPlate } from "@/features/posts/components/WorkPlate";
import { useUserPosts } from "@/features/posts/hooks/usePostsQueries";
import { extractSavedPostsFromProfile } from "@/features/posts/model/post.normalize";
import { CollectionHeader } from "@/features/users/components/profile/CollectionHeader";
import { CoverPrivacyModal } from "@/features/users/components/profile/CoverPrivacyModal";
import { ImageViewerModal } from "@/features/users/components/profile/ImageViewerModal";
import { ProfilePhotoEditorModal } from "@/features/users/components/profile/ProfilePhotoEditorModal";
import { ProfileTabs, type ProfileTab } from "@/features/users/components/profile/ProfileTabs";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { useProfileImages } from "@/features/users/hooks/useProfileImages";
import { useToggleFollow, type FollowOverride } from "@/features/users/hooks/useToggleFollow";
import { useUserProfile } from "@/features/users/hooks/useUserProfile";

type ImageViewer = { kind: "avatar" | "cover"; url: string } | null;

/**
 * A personal collection.
 *
 * The same wall as the main room, filtered to one contributor — so a
 * profile is not a different kind of page, it is the collection seen from
 * one person's shelf.
 */
export default function ProfilePage() {
  const { userId: routeUserId } = useParams();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [imageViewer, setImageViewer] = useState<ImageViewer>(null);
  const [followOverrides, setFollowOverrides] = useState<Record<string, FollowOverride>>({});

  const currentUserQuery = useCurrentUser();
  const { profile, isOtherProfile, activeUserId, isLoading, error } = useUserProfile(
    routeUserId,
    currentUserQuery.data ?? null,
  );

  const canEdit = isAuthenticated && !isOtherProfile;
  const images = useProfileImages(activeUserId ?? "me", canEdit);
  const follow = useToggleFollow(followOverrides, setFollowOverrides);

  const postsQuery = useUserPosts(activeUserId);
  const savedPosts = useMemo(
    () => extractSavedPostsFromProfile(profile?.raw ?? null),
    [profile],
  );

  const userPosts = postsQuery.data ?? [];
  const shownPosts = activeTab === "saved" ? savedPosts : userPosts;

  const isProfileLoading = currentUserQuery.isLoading || isLoading;
  const profileError = isOtherProfile ? error : currentUserQuery.error;

  const displayAvatar = images.avatarPreview || profile?.photo || "";
  const displayCover = images.isCoverRemoved
    ? images.coverPreview
    : images.coverPreview || (profile?.coverPhoto ?? "");

  const followState = follow.resolve(
    isOtherProfile ? (profile?.id ?? null) : null,
    profile?.isFollowing ?? false,
    profile?.followersCount ?? 0,
  );

  return (
    <div className="min-h-screen bg-ground">
      <div className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-8">
        {isProfileLoading ? (
          <div className="pt-10">
            <div className="skeleton h-36 rounded-[3px] sm:h-48" />
            <div className="mt-6 flex gap-4">
              <div className="skeleton h-[72px] w-[72px] rounded-full" />
              <div className="flex-1 space-y-2 pt-2">
                <div className="skeleton h-5 w-48 rounded-[2px]" />
                <div className="skeleton h-3 w-64 rounded-[2px]" />
              </div>
            </div>
          </div>
        ) : null}

        {!isProfileLoading && profileError ? (
          <Plate className="mt-10 border-l-2 border-l-verm p-6">
            <p className="font-mono text-micro font-medium tracking-[0.16em] text-verm-ink uppercase">
              Could not open this collection
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              {isAuthenticated
                ? getErrorMessage(profileError, "The record did not respond.")
                : "Sign in to view collections."}
            </p>
          </Plate>
        ) : null}

        {!isProfileLoading && !profileError && profile ? (
          <>
            <div className="-mx-5 sm:-mx-8">
              <CollectionHeader
                name={profile.name}
                handle={profile.handle}
                email={profile.email}
                avatarUrl={displayAvatar}
                coverUrl={displayCover}
                followersCount={followState.followersCount}
                followingCount={profile.followingCount}
                worksCount={userPosts.length}
                canEdit={canEdit}
                isFollowing={followState.isFollowing}
                isFollowUpdating={follow.pendingUserId === profile.id}
                onToggleFollow={
                  isOtherProfile && profile.id
                    ? () =>
                        follow.toggle({
                          userId: profile.id as string,
                          currentIsFollowing: followState.isFollowing,
                          currentFollowersCount: followState.followersCount,
                        })
                    : undefined
                }
                isPhotoUploading={images.isPhotoPending}
                isCoverUpdating={images.isCoverPending}
                onViewPhoto={() =>
                  displayAvatar && setImageViewer({ kind: "avatar", url: displayAvatar })
                }
                onSelectPhoto={images.selectPhotoFile}
                onViewCover={() =>
                  displayCover && setImageViewer({ kind: "cover", url: displayCover })
                }
                onSelectCover={images.selectCoverFile}
                onRemoveCover={images.removeCover}
              />
            </div>

            {canEdit ? (
              <FeedbackAlert
                state={images.alert}
                wrapperClassName="mt-6"
                onClose={images.dismissAlert}
              />
            ) : null}

            {follow.error ? (
              <p
                role="alert"
                className="mt-4 border-l-2 border-l-verm py-2 pl-3 font-mono text-micro text-verm-ink"
              >
                {getErrorMessage(follow.error, "Could not update that follow.")}
              </p>
            ) : null}

            <div className="mt-8">
              <ProfileTabs
                activeTab={activeTab}
                count={shownPosts.length}
                onTabChange={setActiveTab}
              />
            </div>

            <div className="mt-6">
              {activeTab === "posts" && postsQuery.isLoading ? (
                <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6">
                  <WallSkeleton count={3} />
                </div>
              ) : null}

              {activeTab === "posts" && !postsQuery.isLoading && postsQuery.error ? (
                <Plate className="mx-auto max-w-[640px] border-l-2 border-l-verm p-6">
                  <p className="font-mono text-micro font-medium tracking-[0.16em] text-verm-ink uppercase">
                    Could not load these works
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    {getErrorMessage(postsQuery.error, "Try again in a moment.")}
                  </p>
                </Plate>
              ) : null}

              {shownPosts.length > 0 ? (
                <Wall
                  items={shownPosts}
                  getKey={(post) => post.id}
                  renderItem={(post, index) => <WorkPlate post={post} index={index} />}
                />
              ) : null}

              {shownPosts.length === 0 &&
              !(activeTab === "posts" && (postsQuery.isLoading || postsQuery.error)) ? (
                <Plate className="mx-auto max-w-[640px] p-8 text-center">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                    {activeTab === "saved"
                      ? "Nothing set aside yet"
                      : canEdit
                        ? "Your wall is bare"
                        : "Nothing hung here yet"}
                  </h2>
                  <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-ink-2">
                    {activeTab === "saved"
                      ? "The bookmark on any plate keeps it here, visible only to you."
                      : canEdit
                        ? "Post from the blank plate on the wall and your first work lands here."
                        : "When they post, their work appears on this wall."}
                  </p>
                </Plate>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {imageViewer ? (
        <ImageViewerModal
          src={imageViewer.url}
          alt={`${profile?.name ?? "Profile"} ${imageViewer.kind}`}
          closeLabel={`Close ${imageViewer.kind}`}
          useAvatarFallback={imageViewer.kind === "avatar"}
          onClose={() => setImageViewer(null)}
        />
      ) : null}

      {images.isCoverDialogOpen ? (
        <CoverPrivacyModal
          isSaving={images.isCoverPending}
          onCancel={images.cancelCoverUpload}
          onSave={() => void images.confirmCoverUpload()}
        />
      ) : null}

      {images.photoEditorUrl ? (
        <ProfilePhotoEditorModal
          imageUrl={images.photoEditorUrl}
          isSaving={images.isPhotoPending}
          onCancel={images.cancelPhotoEditor}
          onSave={(zoom, offset) => void images.saveCroppedPhoto(zoom, offset)}
        />
      ) : null}
    </div>
  );
}

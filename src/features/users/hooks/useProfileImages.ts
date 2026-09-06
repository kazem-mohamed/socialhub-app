import { useState } from "react";
import { getErrorMessage } from "@/shared/api/errors";
import type { AlertState } from "@/shared/ui/alertState";
import { HIDDEN_ALERT } from "@/shared/ui/alertState";
import { cropToSquare, readFileAsDataUrl, type Offset } from "../lib/imageCrop";
import { useUploadCoverPhoto, useUploadProfilePhoto } from "./useProfilePhotoUpload";

/**
 * Everything the profile page needs to change its avatar and cover: staged
 * files, local previews, the two dialogs, and the upload mutations.
 *
 * Previews are keyed by profile so a preview from one profile never bleeds onto
 * another after navigation — the behaviour the page implemented with a
 * `profileKey` on each piece of state.
 */
export function useProfileImages(profileKey: string, canEdit: boolean) {
  const uploadPhoto = useUploadProfilePhoto();
  const uploadCover = useUploadCoverPhoto();

  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);
  const [previewKey, setPreviewKey] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [isCoverRemoved, setIsCoverRemoved] = useState(false);

  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [photoEditorUrl, setPhotoEditorUrl] = useState("");

  const isForCurrentProfile = previewKey === profileKey;

  function fail(message: string) {
    setAlert({
      isVisible: true,
      color: "danger",
      title: "Upload Failed",
      description: message,
    });
  }

  function succeed(message: string) {
    setAlert({
      isVisible: true,
      color: "success",
      title: "Success Notification",
      description: message,
    });
  }

  /** Shared validation for both pickers. Resets the input so re-picking works. */
  function takeFile(event: React.ChangeEvent<HTMLInputElement>): File | null {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return null;

    if (!file.type.startsWith("image/")) {
      fail("Please choose a valid image file.");
      return null;
    }

    if (!canEdit) {
      fail("You can only update images on your own profile.");
      return null;
    }

    setAlert(HIDDEN_ALERT);
    return file;
  }

  function selectCoverFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = takeFile(event);
    if (!file) return;

    setIsCoverRemoved(false);
    setPendingCoverFile(file);
  }

  async function confirmCoverUpload() {
    if (!pendingCoverFile) return;

    const file = pendingCoverFile;
    setPendingCoverFile(null);

    let preview = "";
    try {
      preview = await readFileAsDataUrl(file);
    } catch {
      preview = "";
    }

    uploadCover.mutate(file, {
      onSuccess: () => {
        if (preview) {
          setPreviewKey(profileKey);
          setCoverPreview(preview);
        }
        setIsCoverRemoved(false);
        succeed("Cover photo updated successfully.");
      },
      onError: (error) => fail(getErrorMessage(error, "Failed to update cover photo.")),
    });
  }

  function removeCover() {
    if (!canEdit || uploadCover.isPending) return;
    setPreviewKey(profileKey);
    setCoverPreview("");
    setIsCoverRemoved(true);
    succeed("Cover photo removed successfully.");
  }

  async function selectPhotoFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = takeFile(event);
    if (!file) return;

    try {
      const preview = await readFileAsDataUrl(file);
      if (!preview) throw new Error("Failed to preview selected profile photo.");

      setPendingPhotoFile(file);
      setPhotoEditorUrl(preview);
    } catch {
      fail("Failed to preview selected profile photo.");
    }
  }

  function cancelPhotoEditor() {
    if (uploadPhoto.isPending) return;
    setPendingPhotoFile(null);
    setPhotoEditorUrl("");
  }

  async function saveCroppedPhoto(zoom: number, offset: Offset) {
    if (!pendingPhotoFile || uploadPhoto.isPending) return;

    try {
      const { file, previewUrl } = await cropToSquare(
        photoEditorUrl,
        pendingPhotoFile,
        zoom,
        offset,
      );

      setPreviewKey(profileKey);
      setAvatarPreview(previewUrl);
      setPendingPhotoFile(null);
      setPhotoEditorUrl("");

      uploadPhoto.mutate(file, {
        onSuccess: () => succeed("Profile photo updated successfully."),
        onError: (error) => {
          setAvatarPreview("");
          fail(getErrorMessage(error, "Failed to update profile photo."));
        },
      });
    } catch (error) {
      fail(getErrorMessage(error, "Failed to prepare profile photo."));
    }
  }

  return {
    alert,
    dismissAlert: () => setAlert((previous) => ({ ...previous, isVisible: false })),

    avatarPreview: isForCurrentProfile ? avatarPreview : "",
    coverPreview: isForCurrentProfile ? coverPreview : "",
    isCoverRemoved: isForCurrentProfile && isCoverRemoved,

    isCoverPending: uploadCover.isPending,
    isPhotoPending: uploadPhoto.isPending,

    isCoverDialogOpen: pendingCoverFile !== null,
    photoEditorUrl,

    selectCoverFile,
    confirmCoverUpload,
    cancelCoverUpload: () => {
      if (uploadCover.isPending) return;
      setPendingCoverFile(null);
    },
    removeCover,

    selectPhotoFile,
    cancelPhotoEditor,
    saveCroppedPhoto,
  };
}

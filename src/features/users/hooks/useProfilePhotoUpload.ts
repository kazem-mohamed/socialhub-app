import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { usersApi } from "../api/usersApi";

/**
 * Photo and cover uploads.
 *
 * Both used to invalidate five hand-written keys apiece; invalidating the
 * `users` root covers the profile, the navbar and the composer in one call.
 */
export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => usersApi.uploadProfilePhoto(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useUploadCoverPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => usersApi.uploadCoverPhoto(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Alert } from "@heroui/react";
import { z } from "zod";

const DEFAULT_PROFILE_IMAGE =
  "https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png";

function EarthIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-earth"
      aria-hidden="true"
    >
      <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"></path>
      <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"></path>
      <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"></path>
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-image text-emerald-600"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
      <circle cx="9" cy="9" r="2"></circle>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-smile text-amber-500"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
      <line x1="9" x2="9.01" y1="9" y2="9"></line>
      <line x1="15" x2="15.01" y1="9" y2="9"></line>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-send"
      aria-hidden="true"
    >
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
      <path d="m21.854 2.147-10.94 10.939"></path>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-x"
      aria-hidden="true"
    >
      <path d="M18 6 6 18"></path>
      <path d="m6 6 12 12"></path>
    </svg>
  );
}

function getSafeImage(url) {
  if (typeof url !== "string") return DEFAULT_PROFILE_IMAGE;
  const trimmed = url.trim();
  return trimmed || DEFAULT_PROFILE_IMAGE;
}

const createPostSchema = z
  .object({
    body: z.string().optional(),
    imageFile: z.custom(
      (value) => value === null || value === undefined || value instanceof File,
      "Please select a valid image file."
    ),
  })
  .refine(
    (data) => Boolean(data?.body?.trim()) || data?.imageFile instanceof File,
    {
      message: "Post cannot be empty. Add text or upload an image.",
      path: ["body"],
    }
  )
  .refine(
    (data) =>
      !data?.imageFile ||
      (data.imageFile instanceof File && data.imageFile.type.startsWith("image/")),
    {
      message: "Only image files are allowed.",
      path: ["imageFile"],
    }
  );

async function fetchCurrentUser(token) {
  const profileEndpoints = [
    "https://route-posts.routemisr.com/users/profile-data",
    "https://route-posts.routemisr.com/users/profile",
  ];

  for (const url of profileEndpoints) {
    try {
      const res = await axios.request({
        method: "GET",
        url,
        headers: { token },
      });

      const user = res?.data?.data?.user || res?.data?.user || res?.data?.data || null;
      if (user) return user;
    } catch (error) {
      const status = error?.response?.status;
      if (status && status !== 404) throw error;
    }
  }

  return null;
}

async function createPostRequest(token, payload) {
  const formData = new FormData();
  const trimmedBody = payload?.body?.trim() || "";

  if (trimmedBody) {
    formData.append("body", trimmedBody);
  }

  if (payload?.imageFile instanceof File) {
    formData.append("image", payload.imageFile);
  }

  return axios.request({
    method: "POST",
    url: "https://route-posts.routemisr.com/posts",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: formData,
  });
}

function extractApiMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.errors?.[0]?.msg ||
    error?.message ||
    fallbackMessage
  );
}

export default function PostForm({ currentUser }) {
  const [privacy, setPrivacy] = useState("public");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [createAlertVisible, setCreateAlertVisible] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const token = localStorage.getItem("User_Token");

  const { data: apiUser } = useQuery({
    queryKey: ["post-form-profile", token],
    queryFn: () => fetchCurrentUser(token),
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const resolvedUser = currentUser || apiUser;
  const displayName = resolvedUser?.name || resolvedUser?.username || "User";
  const displayAvatar = getSafeImage(resolvedUser?.photo || resolvedUser?.avatar);
  const canPost = body.trim().length > 0 || imageFile instanceof File;

  const createPostMutation = useMutation({
    mutationFn: (payload) => createPostRequest(token, payload),
    onMutate: () => {
      setSubmitError("");
      setCreateAlertVisible(false);
    },
    onSuccess: () => {
      setBody("");
      handleRemoveImage();
      setCreateAlertVisible(true);
      queryClient.invalidateQueries({ queryKey: ["posts", token] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      setSubmitError(extractApiMessage(error, "Failed to create post."));
    },
  });

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewImage && previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    const nextPreview = URL.createObjectURL(file);
    setImageFile(file);
    setPreviewImage(nextPreview);
    setSubmitError("");
  }

  function handleRemoveImage() {
    if (previewImage && previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    setImageFile(null);
    setPreviewImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setSubmitError("You need to login first.");
      return;
    }

    const validation = createPostSchema.safeParse({ body, imageFile });
    if (!validation.success) {
      setSubmitError(validation.error.issues[0]?.message || "Invalid post data.");
      return;
    }

    createPostMutation.mutate(validation.data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      {createAlertVisible ? (
        <div className="mb-3">
          <Alert
            color="success"
            description="Your action has been completed successfully. We'll notify you when updates are available."
            isVisible={createAlertVisible}
            title="Success Notification"
            variant="faded"
            onClose={() => setCreateAlertVisible(false)}
          />
        </div>
      ) : null}

      <div className="mb-3 flex items-start gap-3">
        <img
          alt={displayName}
          className="h-11 w-11 rounded-full object-cover"
          src={displayAvatar}
          onError={(event) => {
            event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
          }}
        />
        <div className="flex-1">
          <p className="text-base font-extrabold text-slate-900">{displayName}</p>
          <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            <EarthIcon />
            <select
              value={privacy}
              onChange={(event) => setPrivacy(event.target.value)}
              className="bg-transparent outline-none"
            >
              <option value="public">Public</option>
              <option value="following">Followers</option>
              <option value="only_me">Only me</option>
            </select>
          </div>
        </div>
      </div>

      <div className="relative">
        <textarea
          rows="4"
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            if (submitError) setSubmitError("");
          }}
          placeholder={`What's on your mind, ${displayName}?`}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[17px] leading-relaxed text-slate-800 outline-none transition focus:border-[#1877f2] focus:bg-white"
        ></textarea>
      </div>

      {previewImage ? (
        <div className="relative mt-2">
          <img
            alt="Preview"
            className="max-h-60 w-full rounded-lg object-cover"
            src={previewImage}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white backdrop-blur-sm"
            aria-label="Remove selected image"
          >
            <CloseIcon />
          </button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
        <div className="relative flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
            <ImageIcon />
            <span className="hidden sm:inline">Photo/video</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <SmileIcon />
            <span className="hidden sm:inline">Feeling/activity</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canPost || createPostMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-[#1877f2] px-5 py-2 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createPostMutation.isPending ? "Posting..." : "Post"}
            <SendIcon />
          </button>
        </div>
      </div>

      {submitError ? (
        <p className="mt-2 text-sm font-semibold text-red-600">{submitError}</p>
      ) : null}
    </form>
  );
}

import { z } from "zod";

/**
 * Shared by the composer and the post editor, which previously carried two
 * near-identical copies of this schema.
 */
export const postDraftSchema = z
  .object({
    body: z.string().optional(),
    imageFile: z.custom<File | null>(
      (value) => value === null || value === undefined || value instanceof File,
      "Please select a valid image file.",
    ),
  })
  .refine((data) => Boolean(data.body?.trim()) || data.imageFile instanceof File, {
    message: "Post cannot be empty. Add text or upload an image.",
    path: ["body"],
  })
  .refine(
    (data) =>
      !data.imageFile ||
      (data.imageFile instanceof File && data.imageFile.type.startsWith("image/")),
    {
      message: "Only image files are allowed.",
      path: ["imageFile"],
    },
  );

export type PostDraft = z.infer<typeof postDraftSchema>;

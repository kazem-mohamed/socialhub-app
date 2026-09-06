import { useCallback, useEffect, useRef, useState } from "react";

interface ImagePreview {
  /** Currently selected file, or `null` when nothing is staged. */
  file: File | null;
  /** Object URL for the staged file, or the caller's initial URL. */
  previewUrl: string;
  select: (file: File) => void;
  clear: () => void;
}

function revoke(url: string): void {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

/**
 * Staged image selection with the object-URL lifecycle handled once.
 *
 * The post composer and the post editor each managed the file, the preview URL
 * and four separate `URL.revokeObjectURL` calls by hand — and leaked the URL
 * whenever the component unmounted mid-edit.
 */
export function useImagePreview(initialUrl = ""): ImagePreview {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const objectUrlRef = useRef<string>("");

  useEffect(() => () => revoke(objectUrlRef.current), []);

  const select = useCallback((nextFile: File) => {
    revoke(objectUrlRef.current);
    const nextUrl = URL.createObjectURL(nextFile);
    objectUrlRef.current = nextUrl;
    setFile(nextFile);
    setPreviewUrl(nextUrl);
  }, []);

  const clear = useCallback(() => {
    revoke(objectUrlRef.current);
    objectUrlRef.current = "";
    setFile(null);
    setPreviewUrl(initialUrl);
  }, [initialUrl]);

  return { file, previewUrl, select, clear };
}

import { useEffect } from "react";

/**
 * Freezes the page behind a fullscreen overlay and restores the scroll
 * position when it closes.
 */
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    const body = document.body.style;
    const html = document.documentElement.style;
    const previous = {
      position: body.position,
      top: body.top,
      left: body.left,
      right: body.right,
      width: body.width,
      bodyOverflow: body.overflow,
      htmlOverflow: html.overflow,
    };
    const scrollY = window.scrollY;

    body.position = "fixed";
    body.top = `-${scrollY}px`;
    body.left = "0";
    body.right = "0";
    body.width = "100%";
    body.overflow = "hidden";
    html.overflow = "hidden";

    return () => {
      body.position = previous.position;
      body.top = previous.top;
      body.left = previous.left;
      body.right = previous.right;
      body.width = previous.width;
      body.overflow = previous.bodyOverflow;
      html.overflow = previous.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}

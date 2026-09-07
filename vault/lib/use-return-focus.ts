"use client";

import * as React from "react";

/**
 * Give a Radix modal somewhere to put focus when it closes.
 *
 * WHY THIS EXISTS: Radix's Dialog does not use FocusScope's own restore. Its
 * content prevents the default and calls `context.triggerRef.current?.focus()`
 * instead, and `triggerRef` is only populated by a `<Dialog.Trigger>`. Every
 * modal in this app is controlled and opened from an ordinary button, so that
 * ref is null, the default is prevented, and focus lands on `<body>`: the
 * keyboard user loses their place and the next Tab restarts at the top of the
 * page. Reproduced in the browser on the apply dialog and the mobile drawer.
 *
 * WHY THE CAPTURE IS IN `onOpenAutoFocus`: the obvious version, reading
 * `document.activeElement` while rendering, captures the wrong element. The
 * wrapper stays mounted whether or not the modal is open, so a mount-time
 * capture records whatever had focus when the PAGE loaded, which is usually
 * body. `onOpenAutoFocus` fires when the content mounts and before FocusScope
 * moves focus inside, so it sees the button that was just pressed. That first
 * version passed typecheck and lint and did nothing at all; only clicking
 * through it in a browser showed focus still landing on body.
 */
export function useReturnFocus(handlers?: {
  onOpenAutoFocus?: ((event: Event) => void) | undefined;
  onCloseAutoFocus?: ((event: Event) => void) | undefined;
}): {
  onOpenAutoFocus: (event: Event) => void;
  onCloseAutoFocus: (event: Event) => void;
} {
  const target = React.useRef<HTMLElement | null>(null);
  const userOpen = handlers?.onOpenAutoFocus;
  const userClose = handlers?.onCloseAutoFocus;

  const onOpenAutoFocus = React.useCallback(
    (event: Event) => {
      const active = document.activeElement;
      // Body means nothing had focus, which is not somewhere to return to.
      target.current = active instanceof HTMLElement && active !== document.body ? active : null;
      userOpen?.(event);
    },
    [userOpen],
  );

  const onCloseAutoFocus = React.useCallback(
    (event: Event) => {
      userClose?.(event);
      if (event.defaultPrevented) return;

      // Preventing the default here also stops Radix's own handler, because it
      // composes ours first and skips its own once the default is prevented.
      event.preventDefault();
      const el = target.current;
      // A trigger can be gone by the time the modal closes: a row that was
      // deleted, a list that refetched. Falling back to main beats body, since
      // the next Tab then continues from the content rather than the page top.
      if (el?.isConnected) el.focus();
      else document.getElementById("main")?.focus();
    },
    [userClose],
  );

  return { onOpenAutoFocus, onCloseAutoFocus };
}

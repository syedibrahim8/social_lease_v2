import { API_BASE_URL } from "@/lib/api/client";

/**
 * Server-Sent Events over fetch.
 *
 * WHY NOT EventSource: `GET /notifications/stream` is behind the `authenticate`
 * middleware, which reads the token from the `Authorization: Bearer` header and
 * nowhere else. The browser's native EventSource cannot set request headers at
 * all, so it can never authenticate against this endpoint. That is almost
 * certainly why the previous frontend shipped a notification centre with no
 * live stream despite the backend having had one all along.
 *
 * The fix needs no backend change: fetch carries the header, and the response
 * body is a ReadableStream we can decode and frame-parse ourselves.
 */

export interface StreamEvent {
  event: string;
  data: unknown;
}

/**
 * Reads until the connection closes or `signal` aborts. Resolves on a clean
 * server close; throws on a failed handshake so the caller can back off.
 */
export async function openEventStream(opts: {
  path: string;
  token: string;
  signal: AbortSignal;
  onEvent: (event: StreamEvent) => void;
}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${opts.path}`, {
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "text/event-stream",
    },
    credentials: "include",
    signal: opts.signal,
    // Long-lived; must not sit in any cache.
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    throw new Error(`Notification stream failed (${response.status})`);
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      buffer += value;

      // Frames are separated by a blank line. A chunk can split a frame
      // anywhere, so anything after the last separator stays buffered.
      let split = buffer.indexOf("\n\n");
      while (split !== -1) {
        const frame = buffer.slice(0, split);
        buffer = buffer.slice(split + 2);
        const parsed = parseFrame(frame);
        if (parsed) opts.onEvent(parsed);
        split = buffer.indexOf("\n\n");
      }
    }
  } finally {
    // Releasing the lock lets the abort actually tear the socket down.
    reader.releaseLock();
  }
}

function parseFrame(frame: string): StreamEvent | null {
  let event = "message";
  const dataLines: string[] = [];

  for (const rawLine of frame.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    // A leading ':' is a comment — servers use these as keep-alive pings.
    if (line.startsWith(":") || line.length === 0) continue;
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) return null;

  const raw = dataLines.join("\n");
  try {
    return { event, data: JSON.parse(raw) };
  } catch {
    // Not JSON — hand the caller the text rather than dropping the event.
    return { event, data: raw };
  }
}

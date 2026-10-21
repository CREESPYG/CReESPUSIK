import { useEffect, useState } from "react";

export type Remote<T> = { status: "loading" } | { status: "ok"; data: T } | { status: "error"; message: string };

// Session memo, so going back from an artist to its genre shows the page instantly.
const memo = new Map<string, unknown>();
const MEMO_LIMIT = 60;

/** Loads `key` once per session; `retry` refetches after an error. */
export function useRemote<T>(key: string, load: (signal: AbortSignal) => Promise<T>): Remote<T> & { retry: () => void } {
  const [state, setState] = useState<Remote<T>>(() => (memo.has(key) ? { status: "ok", data: memo.get(key) as T } : { status: "loading" }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (memo.has(key)) return setState({ status: "ok", data: memo.get(key) as T });
    const ctrl = new AbortController();
    setState({ status: "loading" });
    load(ctrl.signal)
      .then((data) => {
        if (memo.size >= MEMO_LIMIT) memo.delete(memo.keys().next().value!);
        memo.set(key, data);
        setState({ status: "ok", data });
      })
      .catch((e: Error) => e.name !== "AbortError" && setState({ status: "error", message: e.message }));
    return () => ctrl.abort();
  }, [key, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

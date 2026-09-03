import type { ReactNode } from "react";

/**
 * Placeholder body for a route that exists but is not built yet.
 *
 * Deliberately plain. Its job is to prove the route resolves and to make it
 * obvious in the browser that nothing is implemented here — not to look like a
 * finished screen. Every use of this component is a piece of remaining work.
 */
export function RoutePlaceholder({
  route,
  purpose,
  children,
}: {
  route: string;
  purpose: string;
  children?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-3 px-6 py-16">
      <p className="font-mono text-xs text-ink-muted">{route}</p>
      <h1 className="text-xl font-medium">Not implemented</h1>
      <p className="text-sm text-ink-secondary">{purpose}</p>
      {children}
    </main>
  );
}

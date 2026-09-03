import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-ink-muted">404</p>
      <h1 className="text-2xl font-medium">This page does not exist</h1>
      <Link
        href="/"
        className="rounded-button px-4 py-2 text-sm text-ink underline underline-offset-4"
      >
        Back to the start
      </Link>
    </main>
  );
}

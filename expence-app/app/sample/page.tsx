import Link from "next/link";

export default function SamplePage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <Link
          href="/"
          className="w-fit text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Back to home
        </Link>

        <section className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Sample route
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            This is a new page
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            This file lives at <code>app/sample/page.tsx</code>, so Next.js
            automatically shows it at <code>/sample</code>.
          </p>
        </section>
      </div>
    </main>
  );
}

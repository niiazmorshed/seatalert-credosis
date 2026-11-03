// Replace with the public GitHub repo URL once it exists.
const REPO_URL = "https://github.com/your-username/seatalert-bd";

const steps = [
  {
    title: "Pick a route",
    text: "Choose Railway or Shohoz, your from and to stations, travel date and seat class.",
  },
  {
    title: "SeatAlert watches 24/7",
    text: "A background checker compares seat availability with the last snapshot on every run.",
  },
  {
    title: "Get alerted, buy it yourself",
    text: "When seats open you get a notification. SeatAlert never buys tickets, so no middleman.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-16 px-6 py-16 sm:py-24">
      <section className="flex flex-col gap-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          SeatAlert BD
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Know the moment train and bus seats open.
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          During Eid, tickets on Bangladesh Railway and bus sites sell out in minutes, and cancelled
          seats reappear at random times. People refresh all day or pay brokers. SeatAlert watches for
          you.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="/docs"
            className="rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white hover:bg-emerald-800"
          >
            View API Docs
          </a>
          <a
            href={REPO_URL}
            className="rounded-lg border border-zinc-300 px-5 py-3 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            GitHub repo
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                {i + 1}
              </span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
        Demo for the Credosis Backend Engineer Intern (CRM) Phase 02. Uses a mock ticket source, not
        the real Railway or Shohoz sites. Source on{" "}
        <a href={REPO_URL} className="underline hover:text-zinc-800 dark:hover:text-zinc-200">
          GitHub
        </a>
        .
      </footer>
    </main>
  );
}

import React from "react";
import fs from "fs/promises";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";

async function loadPolicyMarkdown() {
  const candidatePaths = [
    path.join(process.cwd(), "../docs/return_policy.md"),
    path.join(process.cwd(), "docs/return_policy.md"),
  ];

  for (const candidatePath of candidatePaths) {
    try {
      const content = await fs.readFile(candidatePath, "utf-8");
      return { content, loadError: false };
    } catch {
      continue;
    }
  }

  return {
    content: "# Policy unavailable\nWe could not load the return policy document right now.",
    loadError: true,
  };
}

export default async function PoliciesPage() {
  const { content, loadError } = await loadPolicyMarkdown();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-4 py-24 dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 md:p-10">
          <SectionHeader
            eyebrow="Policies"
            title="Return and protection rules"
            description="This page turns the raw policy document into a calmer reading experience so travelers can review refund and resolution rules without digging through dense text."
          />

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">What this covers</p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Protected bookings, refunds, cancellations, and the prototype dispute path.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Best use</p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Keep this open while reviewing protected checkout outcomes or traveler support flows.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Source</p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Markdown is loaded from the repo docs folder so the app and docs stay in sync.
              </p>
            </div>
          </div>
        </section>

        {loadError ? (
          <StatusBanner tone="warning" title="Fallback content shown">
            The policy markdown file could not be loaded from the docs directory, so a fallback message is being rendered instead.
          </StatusBanner>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950/85">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 md:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Policy document</p>
          </div>

          <div className="px-6 py-8 md:px-10 md:py-10">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: (props) => <h1 className="mb-6 text-3xl font-black tracking-tight text-slate-950 dark:text-white" {...props} />,
                h2: (props) => (
                  <h2
                    className="mb-4 mt-10 border-b border-slate-200 pb-3 text-2xl font-bold text-slate-900 dark:border-slate-800 dark:text-slate-100"
                    {...props}
                  />
                ),
                h3: (props) => <h3 className="mb-3 mt-8 text-lg font-bold text-slate-900 dark:text-slate-200" {...props} />,
                p: (props) => <p className="mb-4 text-base leading-7 text-slate-600 dark:text-slate-300" {...props} />,
                ul: (props) => <ul className="mb-6 list-disc space-y-2 pl-6 text-base text-slate-600 dark:text-slate-300" {...props} />,
                li: (props) => <li className="pl-1 leading-7" {...props} />,
                table: (props) => (
                  <div className="mb-8 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full border-collapse text-left" {...props} />
                  </div>
                ),
                th: (props) => (
                  <th
                    className="border-b border-slate-200 bg-slate-100 p-4 text-sm font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    {...props}
                  />
                ),
                td: (props) => (
                  <td
                    className="border-b border-slate-200 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300"
                    {...props}
                  />
                ),
                strong: (props) => <strong className="font-semibold text-slate-950 dark:text-white" {...props} />,
                blockquote: (props) => (
                  <blockquote
                    className="my-6 rounded-r-2xl border-l-4 border-sky-500 bg-sky-50 px-5 py-4 text-slate-700 dark:bg-sky-950/20 dark:text-slate-200"
                    {...props}
                  />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </section>
      </div>
    </main>
  );
}

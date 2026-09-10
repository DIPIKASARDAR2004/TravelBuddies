import React from "react";

interface TransportFooterProps {
  title: string;
  sections: Array<{ title: string; body: string }>;
}

export default function TransportFooter({ title, sections }: TransportFooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 py-16 text-slate-300 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Transport notes</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{title}</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <section key={section.title} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-5">
              <h3 className="text-lg font-bold text-white">{section.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </footer>
  );
}

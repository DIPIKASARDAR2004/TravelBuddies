import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default async function PoliciesPage() {
  let content = '';
  try {
    const filePath = path.join(process.cwd(), '../docs/return_policy.md');
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    try {
      // Fallback if process.cwd() is different in production
      const fallbackPath = path.join(process.cwd(), 'docs/return_policy.md');
      content = fs.readFileSync(fallbackPath, 'utf-8');
    } catch (e) {
      content = '# Error\nPolicy document could not be loaded.';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="p-8 sm:p-12">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl font-extrabold mb-6 text-slate-900 dark:text-white tracking-tight" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-8 mb-4 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-6 mb-3 text-slate-800 dark:text-slate-200" {...props} />,
              p: ({node, ...props}) => <p className="mb-4 text-slate-600 dark:text-slate-400 leading-relaxed text-base" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-600 dark:text-slate-400 text-base" {...props} />,
              li: ({node, ...props}) => <li className="pl-1" {...props} />,
              table: ({node, ...props}) => (
                <div className="overflow-x-auto mb-8 rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left border-collapse" {...props} />
                </div>
              ),
              th: ({node, ...props}) => <th className="bg-slate-100 dark:bg-slate-800 p-4 font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700" {...props} />,
              td: ({node, ...props}) => <td className="p-4 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400" {...props} />,
              strong: ({node, ...props}) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 italic my-6 text-slate-700 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-r-lg" {...props} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

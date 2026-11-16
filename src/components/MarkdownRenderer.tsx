import React from 'react';

interface Props {
  content: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  // Simple, robust client-side parser for our generated notes
  const renderFormatted = (md: string) => {
    const lines = md.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let inCode = false;
    let codeLines: string[] = [];

    const flushTable = (key: number) => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const bodyRows = tableRows.slice(1);
        elements.push(
          <div key={`table-${key}`} className="overflow-x-auto my-6 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-amber-50 dark:bg-slate-800">
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-4 py-3 text-left font-semibold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                      {parseInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-slate-900">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/50 dark:bg-slate-800/40'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2.5 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
      inTable = false;
    };

    const flushCode = (key: number) => {
      if (codeLines.length > 0) {
        elements.push(
          <pre key={`code-${key}`} className="bg-gray-900 text-amber-200 p-4 rounded-lg overflow-x-auto my-4 text-xs font-mono">
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
      }
      inCode = false;
    };

    const parseInline = (text: string): React.ReactNode => {
      // Split by bold (**text**)
      const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
        } else if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i} className="italic text-amber-700 dark:text-amber-400">{part.slice(1, -1)}</em>;
        } else if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-amber-600 dark:text-amber-400 font-mono text-xs">{part.slice(1, -1)}</code>;
        }
        return part;
      });
    };

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();

      // Handle Code Blocks
      if (line.startsWith('```')) {
        if (inCode) {
          flushCode(idx);
        } else {
          if (inTable) flushTable(idx);
          inCode = true;
        }
        return;
      }

      if (inCode) {
        codeLines.push(rawLine);
        return;
      }

      // Handle Tables
      if (line.startsWith('|') && line.endsWith('|')) {
        // Skip separator line (|---|---|)
        if (line.includes('---')) {
          return;
        }
        inTable = true;
        const cells = line
          .slice(1, -1)
          .split('|')
          .map(c => c.trim());
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      // Handle Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-2xl sm:text-3xl font-extrabold text-blue-900 dark:text-blue-300 border-b border-gray-200 dark:border-gray-700 pb-3 mt-6 mb-4">
            {parseInline(line.replace('# ', ''))}
          </h1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-xl sm:text-2xl font-bold text-amber-800 dark:text-amber-400 border-b border-gray-100 dark:border-gray-800 pb-2 mt-8 mb-3 flex items-center gap-2">
            <span className="w-2 h-6 bg-amber-500 rounded-sm inline-block"></span>
            {parseInline(line.replace('## ', ''))}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-2">
            {parseInline(line.replace('### ', ''))}
          </h3>
        );
        return;
      }

      // Handle Blockquotes / Alerts
      if (line.startsWith('>')) {
        const text = line.replace(/^>\s*/, '');
        let alertClass = "border-l-4 border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200";
        if (text.includes('[!NOTE]')) {
          alertClass = "border-l-4 border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200";
        } else if (text.includes('[!TIP]')) {
          alertClass = "border-l-4 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200";
        } else if (text.includes('[!IMPORTANT]')) {
          alertClass = "border-l-4 border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200";
        }

        elements.push(
          <div key={idx} className={`p-4 my-4 rounded-r-lg shadow-xs ${alertClass}`}>
            {parseInline(text.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/, ''))}
          </div>
        );
        return;
      }

      // Handle Horizontal Rule
      if (line === '---' || line === '***') {
        elements.push(<hr key={idx} className="my-8 border-gray-200 dark:border-gray-700" />);
        return;
      }

      // Handle Lists
      if (line.startsWith('* ') || line.startsWith('- ')) {
        elements.push(
          <li key={idx} className="ml-6 list-disc my-1 text-gray-700 dark:text-gray-300 leading-relaxed">
            {parseInline(line.slice(2))}
          </li>
        );
        return;
      }

      // Handle Ordered Lists (1. 2. etc)
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={idx} className="flex gap-2 my-1.5 ml-2 text-gray-700 dark:text-gray-300 leading-relaxed">
            <span className="font-bold text-amber-600 dark:text-amber-400">{numMatch[1]}.</span>
            <div>{parseInline(numMatch[2])}</div>
          </div>
        );
        return;
      }

      // Regular Paragraph
      if (line.length > 0) {
        elements.push(
          <p key={idx} className="my-3 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
            {parseInline(line)}
          </p>
        );
      }
    });

    if (inTable) flushTable(lines.length);
    if (inCode) flushCode(lines.length);

    return elements;
  };

  return <div className="study-note-content prose max-w-none">{renderFormatted(content)}</div>;
};

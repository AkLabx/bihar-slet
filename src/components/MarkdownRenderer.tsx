import React from 'react';
import { useQuizStore } from '../store/useQuizStore';
import { Language } from '../types';

interface Props {
  content: string;
  language?: Language;
  stripTopHeader?: boolean;
}

export const MarkdownRenderer: React.FC<Props> = ({
  content,
  language: propLanguage,
  stripTopHeader = true,
}) => {
  const storeLanguage = useQuizStore((state) => state.language);
  const activeLang: Language = propLanguage || storeLanguage;

  // Helper: clean heading text based on language
  const formatHeadingText = (rawText: string, lang: Language): React.ReactNode => {
    if (lang === 'bilingual') {
      const match = rawText.match(/^(.*?)\s*\(([^)]+)\)\s*(:?)$/);
      if (match) {
        const hi = match[1].trim();
        const en = match[2].trim();
        const colon = match[3] || '';
        return (
          <>
            <span>{hi}</span>
            <span className="text-amber-700 dark:text-amber-400 font-normal text-sm sm:text-base ml-2">
              ({en}){colon}
            </span>
          </>
        );
      }
      return parseInline(rawText);
    }

    // Pattern 1: Hindi (English)
    const match = rawText.match(/^(.*?)\s*\(([^)]+)\)\s*(:?)$/);
    if (match) {
      const hi = match[1].trim();
      const en = match[2].trim();
      const colon = match[3] || '';
      const hasDev = /[\u0900-\u097F]/.test(hi);
      const hasLat = /[a-zA-Z]/.test(en);

      if (hasDev && hasLat) {
        if (lang === 'english') {
          // Check for numerical prefixes in Hindi like "1. " or "भाग 1: "
          const numMatch = hi.match(/^(\d+\.|\bभाग\s*\d+:?)/);
          if (numMatch && !en.match(/^\d+/)) {
            const prefix = numMatch[1].replace('भाग', 'Part');
            return parseInline(`${prefix} ${en}${colon}`);
          }
          return parseInline(`${en}${colon}`);
        } else {
          return parseInline(`${hi}${colon}`);
        }
      }
    }

    // Pattern 2: Slash "Hindi / English:"
    const slashMatch = rawText.match(/^(.*?)\s*\/\s*(.*?)(:?)$/);
    if (slashMatch) {
      const hi = slashMatch[1].trim();
      const en = slashMatch[2].trim();
      const colon = slashMatch[3] || '';
      const hasDev = /[\u0900-\u097F]/.test(hi);
      const hasLat = /[a-zA-Z]/.test(en);

      if (hasDev && hasLat) {
        return parseInline(lang === 'english' ? `${en}${colon}` : `${hi}${colon}`);
      }
    }

    return parseInline(rawText);
  };

  // Helper: clean inline tokens like **परिभाषा / Definition:**
  const cleanInlineTerms = (text: string, lang: Language): string => {
    if (lang === 'bilingual') return text;

    // Pattern: **Hindi / English:**
    let res = text.replace(/\*\*([^\*]+?)\s*\/\s*([^\*]+?)\*\*/g, (match, hi, en) => {
      const hasDev = /[\u0900-\u097F]/.test(hi);
      const hasLat = /[a-zA-Z]/.test(en);
      if (hasDev && hasLat) {
        return lang === 'english' ? `**${en.trim()}**` : `**${hi.trim()}**`;
      }
      return match;
    });

    // Pattern: **Hindi (English):**
    res = res.replace(/\*\*([^\*]+?)\s*\(([A-Za-z\s,\.\-&]+)\)\s*(:?)\*\*/g, (match, hi, en, colon) => {
      const hasDev = /[\u0900-\u097F]/.test(hi);
      const hasLat = /[a-zA-Z]/.test(en);
      if (hasDev && hasLat) {
        return lang === 'english' ? `**${en.trim()}${colon}**` : `**${hi.trim()}${colon}**`;
      }
      return match;
    });

    return res;
  };

  // Parse inline markdown: bold, italic, code
  const parseInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-gray-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-amber-700 dark:text-amber-400">
            {part.slice(1, -1)}
          </em>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-amber-600 dark:text-amber-400 font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Check if a line is an English translation line (mostly Latin/English, no Devanagari)
  const isPureEnglishLine = (line: string): boolean => {
    const hasDev = /[\u0900-\u097F]/.test(line);
    const hasLat = /[a-zA-Z]/.test(line);
    return !hasDev && hasLat;
  };

  const renderFormatted = (md: string) => {
    let rawLines = md.split('\n');

    // Strip top redundant document header banner if requested
    if (stripTopHeader) {
      let sepIdx = -1;
      for (let i = 0; i < Math.min(rawLines.length, 12); i++) {
        const trimmed = rawLines[i].trim();
        if (trimmed === '---' || trimmed === '***') {
          sepIdx = i;
          break;
        }
      }
      if (sepIdx !== -1 && sepIdx <= 10) {
        rawLines = rawLines.slice(sepIdx + 1);
      }
    }

    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let inCode = false;
    let codeLines: string[] = [];

    const flushTable = (key: number) => {
      if (tableRows.length > 0) {
        const rawHeaderRow = tableRows[0];
        const rawBodyRows = tableRows.slice(1);

        // Detect column filtering for Hindi vs English
        // E.g. | Attribute | तथ्य (Hindi) | Facts (English) |
        let colIndicesToKeep = rawHeaderRow.map((_, i) => i);

        const hasHindiCol = rawHeaderRow.some((c) => c.includes('(Hindi)'));
        const hasEnglishCol = rawHeaderRow.some((c) => c.includes('(English)'));

        if (hasHindiCol && hasEnglishCol) {
          if (activeLang === 'english') {
            colIndicesToKeep = rawHeaderRow
              .map((c, i) => (c.includes('(Hindi)') ? -1 : i))
              .filter((i) => i !== -1);
          } else if (activeLang === 'hindi') {
            colIndicesToKeep = rawHeaderRow
              .map((c, i) => (c.includes('(English)') ? -1 : i))
              .filter((i) => i !== -1);
          }
        }

        const filteredHeaderRow = colIndicesToKeep.map((i) => rawHeaderRow[i]);
        const filteredBodyRows = rawBodyRows.map((row) => colIndicesToKeep.map((i) => row[i] || ''));

        elements.push(
          <div key={`table-${key}`} className="overflow-x-auto my-6 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xs">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-amber-50 dark:bg-slate-800">
                <tr>
                  {filteredHeaderRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-4 py-3 text-left font-semibold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                      {formatHeadingText(cell, activeLang)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-slate-900">
                {filteredBodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/50 dark:bg-slate-800/40'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2.5 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                        {parseInline(cleanInlineTerms(cell, activeLang))}
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
          <pre key={`code-${key}`} className="bg-gray-900 text-amber-200 p-4 rounded-lg overflow-x-auto my-4 text-xs font-mono leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
      }
      inCode = false;
    };

    let prevLineWasHindi = false;

    rawLines.forEach((rawLine, idx) => {
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
        if (line.includes('---')) {
          return;
        }
        inTable = true;
        const cells = line
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      // Empty line
      if (line.length === 0) {
        return;
      }

      // Check if this line is a pure English translation line
      const isEnglishTranslation = isPureEnglishLine(line);

      // In Hindi mode: omit pure English translation follow-up lines
      if (activeLang === 'hindi' && isEnglishTranslation && prevLineWasHindi) {
        return;
      }

      // Track if current line is Hindi for translation pairing
      prevLineWasHindi = /[\u0900-\u097F]/.test(line);

      // Handle Headers
      if (line.startsWith('# ')) {
        const text = line.replace('# ', '');
        elements.push(
          <h1 key={idx} className="text-2xl sm:text-3xl font-extrabold text-blue-900 dark:text-blue-300 border-b border-gray-200 dark:border-gray-700 pb-3 mt-6 mb-4">
            {formatHeadingText(text, activeLang)}
          </h1>
        );
        return;
      }

      if (line.startsWith('## ')) {
        const text = line.replace('## ', '');
        elements.push(
          <h2 key={idx} className="text-xl sm:text-2xl font-bold text-amber-800 dark:text-amber-400 border-b border-gray-100 dark:border-gray-800 pb-2 mt-8 mb-3 flex items-center gap-2">
            <span className="w-2 h-6 bg-amber-500 rounded-xs inline-block"></span>
            <span>{formatHeadingText(text, activeLang)}</span>
          </h2>
        );
        return;
      }

      if (line.startsWith('### ')) {
        const text = line.replace('### ', '');
        elements.push(
          <h3 key={idx} className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-2">
            {formatHeadingText(text, activeLang)}
          </h3>
        );
        return;
      }

      if (line.startsWith('#### ')) {
        const text = line.replace('#### ', '');
        elements.push(
          <h4 key={idx} className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">
            {formatHeadingText(text, activeLang)}
          </h4>
        );
        return;
      }

      // Handle Blockquotes / Alerts
      if (line.startsWith('>')) {
        const text = line.replace(/^>\s*/, '');
        let alertClass = 'border-l-4 border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200';
        if (text.includes('[!NOTE]')) {
          alertClass = 'border-l-4 border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200';
        } else if (text.includes('[!TIP]')) {
          alertClass = 'border-l-4 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
        } else if (text.includes('[!IMPORTANT]')) {
          alertClass = 'border-l-4 border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200';
        }

        const cleanedAlert = text.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/, '').trim();
        elements.push(
          <div key={idx} className={`p-4 my-4 rounded-r-lg shadow-xs ${alertClass}`}>
            {parseInline(cleanInlineTerms(cleanedAlert, activeLang))}
          </div>
        );
        return;
      }

      // Handle Horizontal Rule
      if (line === '---' || line === '***') {
        elements.push(<hr key={idx} className="my-8 border-gray-200 dark:border-gray-700" />);
        return;
      }

      // Handle Bilingual Translation Callout styling in bilingual mode
      if (activeLang === 'bilingual' && isEnglishTranslation && (line.startsWith('*') || line.startsWith('_'))) {
        const cleanText = line.replace(/^\*+|\*+$/g, '').replace(/^_+|_+$/g, '').trim();
        elements.push(
          <div
            key={idx}
            className="border-l-2 border-amber-400 dark:border-amber-500 bg-amber-50/40 dark:bg-slate-800/40 pl-3 py-1.5 my-1.5 rounded-r-md text-xs sm:text-sm text-gray-700 dark:text-gray-300 italic"
          >
            <span className="not-italic text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mr-1.5 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
              EN
            </span>
            {parseInline(cleanText)}
          </div>
        );
        return;
      }

      // Handle Lists
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const listText = cleanInlineTerms(line.slice(2), activeLang);
        elements.push(
          <li key={idx} className="ml-6 list-disc my-1 text-gray-700 dark:text-gray-300 leading-relaxed">
            {parseInline(listText)}
          </li>
        );
        return;
      }

      // Handle Ordered Lists (1. 2. etc)
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        const num = numMatch[1];
        const itemText = cleanInlineTerms(numMatch[2], activeLang);
        elements.push(
          <div key={idx} className="flex gap-2 my-1.5 ml-2 text-gray-700 dark:text-gray-300 leading-relaxed">
            <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">{num}.</span>
            <div>{parseInline(itemText)}</div>
          </div>
        );
        return;
      }

      // Regular Paragraph
      const paragraphText = cleanInlineTerms(line, activeLang);
      elements.push(
        <p key={idx} className="my-3 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
          {parseInline(paragraphText)}
        </p>
      );
    });

    if (inTable) flushTable(rawLines.length);
    if (inCode) flushCode(rawLines.length);

    return elements;
  };

  return <div className="study-note-content prose max-w-none">{renderFormatted(content)}</div>;
};

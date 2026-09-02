import { type ReactNode } from 'react';

import { parseGuideMarkdown, type GuideMarkdownBlock } from './GuideMarkdownParser';

export function GuideMarkdown({ content }: { content: string }) {
  const blocks = parseGuideMarkdown(content);

  return (
    <div className="space-y-3 text-sm leading-6 text-hoopjot-ink sm:text-base sm:leading-7">
      {blocks.map((block, index) => renderMarkdownBlock(block, index))}
    </div>
  );
}

function renderMarkdownBlock(block: GuideMarkdownBlock, index: number): ReactNode {
  switch (block.kind) {
    case 'heading':
      return (
        <h4 className="pt-3 text-base font-black leading-tight text-hoopjot-ink" key={index}>
          {renderInlineMarkdown(block.text)}
        </h4>
      );
    case 'list':
      return (
        <ul className="space-y-2 pl-1" key={index}>
          {block.items.map((item) => (
            <li className="flex gap-2" key={item}>
              <span
                aria-hidden="true"
                className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-hoopjot-ink/40"
              />
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote
          className="rounded-card border-l-4 border-hoopjot-purple bg-hoopjot-purple/10 px-4 py-3 font-bold"
          key={index}
        >
          {renderInlineMarkdown(block.text)}
        </blockquote>
      );
    case 'table':
      return (
        <div className="overflow-x-auto" key={index}>
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                {block.headers.map((header) => (
                  <th
                    className="border-b-2 border-hoopjot-ink/20 px-3 py-2 font-black"
                    key={header}
                    scope="col"
                  >
                    {renderInlineMarkdown(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={row.join('|') || rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      className="border-b border-hoopjot-line px-3 py-2"
                      key={`${cell}-${cellIndex}`}
                    >
                      {renderInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'paragraph':
      return <p key={index}>{renderInlineMarkdown(block.text)}</p>;
  }
}

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}

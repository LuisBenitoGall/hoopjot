export type GuideMarkdownBlock =
  | {
      kind: 'heading';
      text: string;
    }
  | {
      items: string[];
      kind: 'list';
    }
  | {
      kind: 'paragraph';
      text: string;
    }
  | {
      kind: 'quote';
      text: string;
    }
  | {
      headers: string[];
      kind: 'table';
      rows: string[][];
    };

export function parseGuideMarkdown(content: string): GuideMarkdownBlock[] {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: GuideMarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? '';

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ kind: 'heading', text: line.replace(/^#{1,6}\s+/, '') });
      index += 1;
      continue;
    }

    if (line.startsWith('>')) {
      const quoteLines: string[] = [];

      while ((lines[index] ?? '').trim().startsWith('>')) {
        quoteLines.push((lines[index] ?? '').trim().replace(/^>\s?/, ''));
        index += 1;
      }

      blocks.push({ kind: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    if (isTableRow(line) && isTableSeparator((lines[index + 1] ?? '').trim())) {
      const headers = parseTableCells(line);
      const rows: string[][] = [];
      index += 2;

      while (isTableRow((lines[index] ?? '').trim())) {
        rows.push(parseTableCells((lines[index] ?? '').trim()));
        index += 1;
      }

      blocks.push({ headers, kind: 'table', rows });
      continue;
    }

    if (/^- /.test(line)) {
      const items: string[] = [];

      while (/^- /.test((lines[index] ?? '').trim())) {
        items.push((lines[index] ?? '').trim().replace(/^- /, ''));
        index += 1;
      }

      blocks.push({ items, kind: 'list' });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const paragraphLine = (lines[index] ?? '').trim();

      if (
        !paragraphLine ||
        paragraphLine.startsWith('### ') ||
        paragraphLine.startsWith('>') ||
        (isTableRow(paragraphLine) && isTableSeparator((lines[index + 1] ?? '').trim())) ||
        /^- /.test(paragraphLine)
      ) {
        break;
      }

      paragraphLines.push(paragraphLine);
      index += 1;
    }

    blocks.push({ kind: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
}

function isTableRow(line: string): boolean {
  return line.startsWith('|') && line.endsWith('|') && line.split('|').length >= 3;
}

function isTableSeparator(line: string): boolean {
  return isTableRow(line) && parseTableCells(line).every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseTableCells(line: string): string[] {
  return line
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

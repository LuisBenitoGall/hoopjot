import { render, screen, within } from '@testing-library/react';

import {
  guidePositions,
  resolveGuide,
  type ResolvedGuide,
} from '../../content/guide';
import { guidePointIds } from '../../content/guide/sourceTypes';
import { GuideMarkdown } from './GuideMarkdown';
import { parseGuideMarkdown } from './GuideMarkdownParser';

describe('GuideMarkdown', () => {
  it('parses the supported Guide markdown blocks deterministically', () => {
    expect(
      parseGuideMarkdown(
        [
          'First paragraph with **strong text**.',
          '',
          '- One',
          '- Two',
          '',
          '### Subsection',
          '',
          '> **Callout**',
        ].join('\n'),
      ),
    ).toEqual([
      { kind: 'paragraph', text: 'First paragraph with **strong text**.' },
      { items: ['One', 'Two'], kind: 'list' },
      { kind: 'heading', text: 'Subsection' },
      { kind: 'quote', text: '**Callout**' },
    ]);
  });

  it('renders Guide markdown as semantic React elements without raw HTML', () => {
    render(
      <GuideMarkdown
        content={[
          'First paragraph with **strong text** and <unsafe> text.',
          '',
          '- One',
          '- Two',
          '',
          '### Subsection',
          '',
          '> **Callout**',
        ].join('\n')}
      />,
    );

    expect(screen.getByText('Subsection')).toBeInTheDocument();
    expect(screen.getByText('strong text').tagName).toBe('STRONG');
    expect(screen.getByText('<unsafe>', { exact: false })).toBeInTheDocument();

    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Callout').closest('blockquote')).toBeInTheDocument();
  });

  it('renders the Guide table syntax used by point P25 as a semantic table', () => {
    render(
      <GuideMarkdown
        content={[
          '| Area | Score |',
          '| --- | --- |',
          '| Sleep | /5 |',
          '| Nutrition | /5 |',
        ].join('\n')}
      />,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Area' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Score' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Sleep' })).toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: '/5' })).toHaveLength(2);
  });

  it('parses every player-facing Guide bundle fragment without unsupported metadata or unsafe HTML', () => {
    const parsedTexts = collectResolvedGuideMarkdown().map(({ context, text }) => {
      const blocks = parseGuideMarkdown(text);

      expect(blocks.length, context).toBeGreaterThan(0);
      expect(flattenBlocks(blocks), context).toContain(normalizeExpectedText(text));
      expect(text, context).not.toMatch(/<[^>]+>/);
      expect(text, context).not.toMatch(/\b(?:INSERT|OVERRIDE|BRIDGE)\b/);
      expect(text, context).not.toMatch(/\b[A-Z]{2}_[A-Z]{2}\b/);
      expect(text, context).not.toMatch(/(?:Tipo|Type|Estado editorial|Editorial status):/);
      expect(text, context).not.toMatch(/(?:Role Purpose|Bridge Purpose|slotId|filenames)/i);

      return context;
    });

    expect(parsedTexts).toEqual(expect.arrayContaining(['en introduction', 'es introduction']));
    expect(parsedTexts).toEqual(expect.arrayContaining(['en closing', 'es closing']));
    expect(parsedTexts.filter((context) => context.endsWith('rules intro'))).toHaveLength(60);
    expect(parsedTexts.filter((context) => / rule R\d{2}$/.test(context))).toHaveLength(720);
    expect(parsedTexts.filter((context) => / point P\d{2}$/.test(context))).toHaveLength(1800);
  });
});

function collectResolvedGuideMarkdown(): Array<{ context: string; text: string }> {
  const records: Array<{ context: string; text: string }> = [];

  for (const locale of ['en', 'es'] as const) {
    const selections = guidePositions.flatMap((primaryPosition) =>
      [null, ...guidePositions].map((secondaryPosition) => ({
        locale,
        primaryPosition,
        secondaryPosition,
      })),
    );

    for (const selection of selections) {
      const guide = resolveGuide({
        locale: selection.locale,
        primaryPosition: selection.primaryPosition,
        secondaryPosition:
          selection.secondaryPosition === selection.primaryPosition
            ? null
            : selection.secondaryPosition,
      });

      addGuideMarkdown(records, guide);
    }
  }

  return records;
}

function addGuideMarkdown(records: Array<{ context: string; text: string }>, guide: ResolvedGuide) {
  records.push({ context: `${guide.locale} introduction`, text: guide.introduction.content });
  records.push({ context: `${guide.locale} rules intro`, text: guide.rulesIntro });

  for (const rule of guide.rules) {
    records.push({ context: `${guide.locale} rule ${rule.id}`, text: rule.title });
  }

  for (const pointId of guidePointIds) {
    const point = guide.points.find((item) => item.id === pointId);

    if (!point) {
      throw new Error(`Missing resolved Guide point ${pointId}`);
    }

    records.push({ context: `${guide.locale} point ${pointId}`, text: point.content });
  }

  records.push({ context: `${guide.locale} closing`, text: guide.closing.content });
}

function flattenBlocks(blocks: ReturnType<typeof parseGuideMarkdown>): string {
  return blocks
    .flatMap((block) => {
      if (block.kind === 'list') {
        return block.items;
      }

      if (block.kind === 'table') {
        return [...block.headers, ...block.rows.flat()];
      }

      return block.text;
    })
    .join(' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeExpectedText(text: string): string {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n');
  const normalized: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? '';

    if (!line) {
      continue;
    }

    if (isTableLine(line) && isTableSeparator(lines[index + 1]?.trim() ?? '')) {
      normalized.push(...parseTableCells(line));
      index += 1;

      while (isTableLine(lines[index + 1]?.trim() ?? '')) {
        index += 1;
        normalized.push(...parseTableCells(lines[index] ?? ''));
      }

      continue;
    }

    normalized.push(
      line
        .trim()
        .replace(/^#{1,6}\s+/, '')
        .replace(/^>\s?/, '')
        .replace(/^- /, ''),
    );
  }

  return normalized
    .join(' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function isTableLine(line: string): boolean {
  return /^\|.+\|$/.test(line);
}

function isTableSeparator(line: string): boolean {
  return /^\|(?:\s*:?-{3,}:?\s*\|)+$/.test(line);
}

function parseTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean);
}

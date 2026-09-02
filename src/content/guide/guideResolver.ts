import compiledBundleJson from './generated/compiledBundle.json';
import { getBridgeKey } from './bridge';
import type {
  GuideCompiledBridge,
  GuideCompiledBundle,
  GuideCompiledCore,
  GuideCompiledIntervention,
  GuideCompiledPointTemplate,
  GuideCompiledRole,
  ResolvedGuide,
  ResolvedGuidePoint,
} from './compiledTypes';
import type { GuideSelection } from './types';

export const guideCompiledBundle = compiledBundleJson as GuideCompiledBundle;

export function resolveGuide(selection: GuideSelection): ResolvedGuide {
  return resolveGuideFromBundle(guideCompiledBundle, selection);
}

export function resolveGuideFromBundle(
  bundle: GuideCompiledBundle,
  selection: GuideSelection,
): ResolvedGuide {
  const bridgeKey = getBridgeKey(selection.primaryPosition, selection.secondaryPosition);
  const secondaryPosition = bridgeKey ? selection.secondaryPosition ?? null : null;
  const localeBundle = bundle.locales[selection.locale];
  assert(localeBundle, `Unsupported Guide locale: ${selection.locale}`);

  const role = localeBundle.roles[selection.primaryPosition];
  assert(role, `Missing Guide role pack: ${selection.primaryPosition}`);

  const bridge = bridgeKey ? localeBundle.bridges[bridgeKey] : null;
  if (bridgeKey) {
    assert(bridge, `Missing Guide bridge: ${bridgeKey}`);
  }

  return composeGuide({
    core: localeBundle.core,
    role,
    bridge,
    locale: selection.locale,
    primaryPosition: selection.primaryPosition,
    secondaryPosition,
    bridgeKey,
  });
}

export function composeGuide({
  core,
  role,
  bridge,
  locale,
  primaryPosition,
  secondaryPosition,
  bridgeKey,
}: {
  core: GuideCompiledCore;
  role: GuideCompiledRole;
  bridge: GuideCompiledBridge | null;
  locale: ResolvedGuide['locale'];
  primaryPosition: ResolvedGuide['primaryPosition'];
  secondaryPosition: ResolvedGuide['secondaryPosition'];
  bridgeKey: ResolvedGuide['bridgeKey'];
}): ResolvedGuide {
  return {
    locale,
    primaryPosition,
    secondaryPosition,
    bridgeKey,
    title: core.title,
    subtitle: core.subtitle,
    introduction: core.introduction,
    chapters: core.chapters,
    points: core.pointTemplates.map((template) => resolvePoint(template, role, bridge)),
    rulesIntro: core.rulesIntro,
    rules: core.rules,
    closing: core.closing,
  };
}

function resolvePoint(
  template: GuideCompiledPointTemplate,
  role: GuideCompiledRole,
  bridge: GuideCompiledBridge | null,
): ResolvedGuidePoint {
  const primaryIntervention = role.interventions[template.id];
  const bridgeIntervention = bridge?.interventions[template.id] ?? null;

  return {
    id: template.id,
    number: template.number,
    title: template.title,
    chapterId: template.chapterId,
    content: renderFragments(template, primaryIntervention, bridgeIntervention),
  };
}

function renderFragments(
  template: GuideCompiledPointTemplate,
  primaryIntervention: GuideCompiledIntervention | undefined,
  bridgeIntervention: GuideCompiledIntervention | null,
): string {
  const rendered = template.fragments.flatMap((fragment) => {
    if (fragment.kind === 'core') {
      return [fragment.content];
    }

    if (fragment.kind === 'bridge') {
      return bridgeIntervention ? [bridgeIntervention.content] : [];
    }

    if (!primaryIntervention) {
      return [];
    }

    if (fragment.partId === 'full') {
      return [primaryIntervention.content];
    }

    const part = primaryIntervention.parts?.[fragment.partId];
    assert(part, `Missing primary ${fragment.partId} content for ${template.id}`);

    return [part];
  });

  return joinMarkdownBlocks(rendered);
}

function joinMarkdownBlocks(blocks: readonly string[]): string {
  return blocks
    .map((block) => block.trim())
    .filter(Boolean)
    .join('\n\n');
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[Guide resolver] ${message}`);
  }
}

import type {
  BasketballContentRepository,
  Guideline,
  PositionAffinity,
  Skill
} from '../../domain';
import { basketballCatalog } from './catalog';

export class BundledBasketballContentRepository implements BasketballContentRepository {
  async getGuidelineById(id: string): Promise<Guideline | null> {
    const guideline = basketballCatalog.guidelines.find((item) => item.id === id);

    return guideline ? cloneGuideline(guideline) : null;
  }

  async getSkillById(id: string): Promise<Skill | null> {
    const skill = basketballCatalog.skills.find((item) => item.id === id);

    return skill ? cloneSkill(skill) : null;
  }

  async listGuidelines(): Promise<Guideline[]> {
    return basketballCatalog.guidelines.map(cloneGuideline);
  }

  async listSkills(): Promise<Skill[]> {
    return basketballCatalog.skills.map(cloneSkill);
  }
}

export const basketballContentRepository = new BundledBasketballContentRepository();

function cloneSkill(skill: Skill): Skill {
  return {
    ...skill,
    positionAffinity: clonePositionAffinity(skill.positionAffinity),
    tags: [...skill.tags]
  };
}

function cloneGuideline(guideline: Guideline): Guideline {
  return {
    ...guideline,
    contexts: [...guideline.contexts],
    positions: clonePositionAffinity(guideline.positions),
    skillIds: [...guideline.skillIds]
  };
}

function clonePositionAffinity(value: PositionAffinity): PositionAffinity {
  return value[0] === 'all' ? ['all'] : [...value];
}

export interface RubricDescriptor {
  level: string;
  description: string;
  score: string;
}

export interface RubricItem {
  itemName: string;
  weight: number;
  descriptors: RubricDescriptor[];
}

export interface ScaleHeader {
    level: string;
    score: string;
}

export interface Rubric {
  title: string;
  scaleHeaders: ScaleHeader[];
  items: RubricItem[];
  specificCriteria: string[];
}

export interface WeightedCriterion {
    name: string;
    weight: number;
}

export interface FormData {
  stage: string;
  course: string;
  subject: string;
  evaluationElement: string;
  performanceLevels: string[];
  specificCriteria: string[];
  evaluationCriteria: WeightedCriterion[];
}
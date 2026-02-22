
export interface LessonPart {
  id: string;
  name: string;
  originalContent: string;
  digitalActivity: string;
  digitalTools: string[];
  nlsType?: string;
}

export interface DigitalCompetencyGoal {
  id: string;
  description: string;
  frameworkRef: string;
}

export interface LessonPlanData {
  title: string;
  grade: string;
  subject: string;
  originalFullText: string;
  summary: string;
  digitalGoals: DigitalCompetencyGoal[];
  recommendedTools: string[];
  activities: LessonPart[];
}

export enum AppStep {
  SELECTION = 'SELECTION',
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  REVIEW = 'REVIEW',
  EXPORT = 'EXPORT'
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
}

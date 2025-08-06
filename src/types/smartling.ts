export interface SmartlingConfig {
  userIdentifier: string;
  userSecret: string;
  baseUrl?: string;
  accountId?: string | undefined;
}

export interface SmartlingProject {
  projectId: string;
  projectName: string;
  accountUid: string;
  projectTypeCode: string;
  sourceLocaleId: string;
  targetLocales: TargetLocale[];
}

export interface TargetLocale {
  localeId: string;
  description: string;
  enabled: boolean;
}

export interface FileUploadResponse {
  wordCount: number;
  stringCount: number;
  overWritten: boolean;
}

export interface FileStatus {
  fileUri: string;
  totalStringCount: number;
  totalWordCount: number;
  authorizedStringCount: number;
  completedStringCount: number;
  excludedStringCount: number;
  completedWordCount: number;
  authorizedWordCount: number;
  excludedWordCount: number;
  localeCompletionStats: LocaleCompletionStats[];
}

export interface LocaleCompletionStats {
  localeId: string;
  authorizedStringCount: number;
  completedStringCount: number;
  excludedStringCount: number;
  completedWordCount: number;
  authorizedWordCount: number;
  excludedWordCount: number;
}

export interface SmartlingJob {
  translationJobUid: string;
  jobName: string;
  description?: string;
  targetLocaleIds: string[];
  createdDate: string;
  dueDate?: string;
  jobStatus: 'AWAITING_AUTHORIZATION' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  fileUris: string[];
  workflowUid?: string;
}

export interface JobProgress {
  percentComplete: number;
  totalWordCount: number;
  completedWordCount: number;
  localeProgress?: {
    localeId: string;
    percentComplete: number;
    wordCount: number;
    completedWordCount: number;
  }[];
}

export interface WorkflowStep {
  stepUid: string;
  stepName: string;
  stepType: 'TRANSLATION' | 'REVIEW' | 'APPROVAL';
  assignedUserUid?: string;
  stepStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
}

export interface QualityCheckResult {
  checkType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceString: string;
  targetString: string;
  issues: QualityIssue[];
}

export interface QualityIssue {
  issueType: string;
  description: string;
  suggestion?: string;
}

export interface GlossaryTerm {
  termUid?: string;
  sourceText: string;
  targetText: string;
  localeId: string;
  definition?: string;
  partOfSpeech?: string;
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

export interface TaggedString {
  stringUid: string;
  sourceString: string;
  tags: string[];
  fileUri: string;
  localeId?: string;
}

export interface WebhookConfiguration {
  webhookUid?: string;
  url: string;
  events: WebhookEvent[];
  secretKey?: string;
  enabled: boolean;
}

export type WebhookEvent = 
  | 'job.completed' 
  | 'file.uploaded' 
  | 'translation.completed'
  | 'workflow.step.completed'
  | 'quality.check.completed';

export interface Glossary {
  glossaryUid: string;
  name: string;
  description?: string;
  sourceLocaleId: string;
  targetLocaleIds: string[];
  createdDate: string;
}

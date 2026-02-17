export interface Requirement {
  text: string;
  weight: number;
}

export interface EvidenceLink {
  url: string;
  snippet: string;
}

export interface MatchedFeature {
  requirement: string;
  satisfied: boolean;
  notes: string;
  weight: number;
}

export interface Vendor {
  name: string;
  website: string;
  priceRange: string;
  matchedFeatures: MatchedFeature[];
  risks: string[];
  evidenceLinks: EvidenceLink[];
  overallScore: number;
  matchScore: number;
  tags: string[];
  excluded: boolean;
}

export interface ShortlistResult {
  vendors: Vendor[];
  summary: string;
  recommendation: string;
  markdownReport?: string;
}

export interface Shortlist {
  id: string;
  need: string;
  requirements: Requirement[];
  excluded_vendors: string[];
  result: ShortlistResult | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: string | null;
  error_message: string | null;
  created_at: string;
}

export interface HealthStatus {
  status: string;
  backend: boolean;
  database: boolean;
  llm: boolean;
  llm_model: string;
  latency_ms: number;
}

export interface ShortlistFormData {
  need: string;
  requirements: Requirement[];
  excluded_vendors: string[];
}

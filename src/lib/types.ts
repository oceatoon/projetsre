export interface Project {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  value_added: string;
  needs_answered: string;
  objectives: string[];
  commune: string;
  theme: string;
  stage: string;
  need_types: string[];
  image_url: string | null;
  budget_needed: number;
  budget_secured: number;
  community_size: number;
  impact: { label: string; value: string }[];
  carrier_name: string;
  contact_email: string | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  status: string;
  position: number;
}

export interface ProjectAction {
  id: string;
  milestone_id: string | null;
  title: string;
  author_name: string;
  status: string;
  needs_peer_validation: boolean;
  validated_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  label: string;
  category: string;
  amount: number;
  spent_on: string | null;
}

export interface Funder {
  id: string;
  name: string;
  kind: string;
  amount: number;
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  published_at: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  location: string;
  starts_at: string;
}

export interface Feedback {
  id: string;
  author_name: string;
  kind: string;
  body: string;
  rating: number | null;
  created_at: string;
}

export interface Support {
  id: string;
  kind: string;
  supporter_name: string;
  amount: number | null;
  message: string;
  created_at: string;
}

export interface MaturationQuestion {
  id: string;
  question: string;
  answer: string;
  asked_by: string;
  created_at: string;
}

export interface ProjectDetail {
  project: Project;
  milestones: Milestone[];
  actions: ProjectAction[];
  expenses: Expense[];
  funders: Funder[];
  news: NewsItem[];
  events: AgendaEvent[];
  feedback: Feedback[];
  supports: Support[];
  questions: MaturationQuestion[];
}

export interface CallQuestion {
  id: string;
  label: string;
}

export interface Call {
  id: string;
  slug: string;
  title: string;
  institution: string;
  description: string;
  criteria: string[];
  themes: string[];
  need_types: string[];
  budget_max: number | null;
  deadline: string | null;
  extra_questions: CallQuestion[];
  is_open: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  status: string;
  granted_amount: number | null;
  created_at: string;
  answers: { question: string; answer: string }[];
  selected_sections: string[];
  project: { slug: string; name: string; commune: string; theme: string } | null;
  call?: { slug: string; title: string; institution: string } | null;
}

export interface CoopProjectRef {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  commune: string;
  theme: string;
  stage: string;
  need_types: string[];
}

export interface Cooperation {
  id: string;
  kind: string;
  title: string;
  created_at: string;
}

export interface CooperationMessage {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface CooperationStep {
  id: string;
  title: string;
  deliverable: string;
  owner_name: string;
  due_date: string | null;
  status: string;
  position: number;
}

export interface CooperationDetail {
  cooperation: Cooperation | null;
  projects: [CoopProjectRef, CoopProjectRef];
  messages: CooperationMessage[];
  steps: CooperationStep[];
}

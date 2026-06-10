import { Timestamp } from "firebase/firestore";

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  githubId: string | null;
  googleId: string | null;
  creditBalance: number;
  feedbacksGiven: number;
  feedbacksReceived: number;
  reputationScore: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Project ─────────────────────────────────────────────────────────────────

export type ProjectStatus = "active" | "paused" | "archived";
export type ProjectVisibility = "public" | "private";

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  url: string;
  description: string;
  testInstructions: string;
  techStack: string[];
  niche: string;
  helpTypes: string[];
  status: ProjectStatus;
  visibility: ProjectVisibility;
  creditsRequired: number;
  viewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// A project as returned by the API (url may be stripped for private projects)
export type ProjectPublic = Omit<Project, "url"> & { url?: string };

// ─── Feedback ────────────────────────────────────────────────────────────────

export type FeedbackStatus = "pending" | "approved" | "rejected";

export interface Feedback {
  id: string;
  projectId: string;
  reviewerId: string;
  qualitativeText: string;
  uxScore: number; // 1–5
  bugCount: number;
  bugLogs: string;
  promptEvaluation: string | null;
  status: FeedbackStatus;
  creditsHeld: number;
  submittedAt: Timestamp;
  approvedAt: Timestamp | null;
}

// ─── Credit Transaction ───────────────────────────────────────────────────────

export type CreditTxType =
  | "earn"
  | "spend"
  | "hold"
  | "release"
  | "refund"
  | "purchase";

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTxType;
  amount: number;
  refId: string;
  description: string;
  createdAt: Timestamp;
}

// ─── Access Request ───────────────────────────────────────────────────────────

export type AccessRequestStatus = "pending" | "approved" | "rejected";

export interface AccessRequest {
  id: string;
  projectId: string;
  requesterId: string;
  ownerId: string;
  status: AccessRequestStatus;
  message: string;
  requestedAt: Timestamp;
  resolvedAt: Timestamp | null;
}

// ─── Ship Log ────────────────────────────────────────────────────────────────

export type ShipLogSource = "github" | "n8n" | "manual";

export interface ShipLog {
  id: string;
  projectId: string;
  authorId: string;
  content: string;
  source: ShipLogSource;
  externalRef: string | null;
  createdAt: Timestamp;
}

// ─── Stripe Payment ──────────────────────────────────────────────────────────

export type StripePaymentStatus = "pending" | "completed" | "failed";

export interface StripePayment {
  id: string;
  userId: string;
  stripeSessionId: string;
  stripeEventId: string;
  creditsGranted: number;
  amountCents: number;
  currency: string;
  status: StripePaymentStatus;
  processedAt: Timestamp;
}

// ─── Credit Packages ─────────────────────────────────────────────────────────

export interface CreditPackage {
  id: string;
  credits: number;
  amountCents: number;
  currency: string;
  label: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "pkg_20",
    credits: 20,
    amountCents: 500,
    currency: "eur",
    label: "Starter",
  },
  {
    id: "pkg_60",
    credits: 60,
    amountCents: 1200,
    currency: "eur",
    label: "Growth",
  },
  {
    id: "pkg_150",
    credits: 150,
    amountCents: 2500,
    currency: "eur",
    label: "Pro",
  },
];

// ─── Business Rules Constants ─────────────────────────────────────────────────

export const CREDITS_ON_SIGNUP = 10;
export const CREDITS_TO_LIST_PROJECT = 5;
export const CREDITS_PER_APPROVED_FEEDBACK = 3;
export const CREDITS_ON_FIRST_POST = 15;
export const MIN_FEEDBACK_CHARS = 150;
export const MAX_FEEDBACKS_PER_HOUR = 5;

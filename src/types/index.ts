export type UserRole = 'SUPER_ADMIN' | 'SERVICE_PROVIDER' | 'STUDENT' | 'PARENT' | 'TEACHER' | 'TRANSPORTER';
export type ProviderType = 'TEACHER' | 'TRANSPORTER' | 'INSTITUTION';
export type PaymentStatus = 'PENDING' | 'COMPLETED';
export type SubscriptionPlan = 'BASIC' | 'PRO' | 'ENTERPRISE';
export type SubscriptionBilling = 'MONTHLY' | 'YEARLY';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
  phoneNumber?: string;
  paymentStatus: PaymentStatus;
  isDemo?: boolean;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionBilling?: SubscriptionBilling;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  blocked?: boolean;
}

export interface ServiceProviderProfile extends UserProfile {
  role: 'SERVICE_PROVIDER' | 'TEACHER' | 'TRANSPORTER';
  providerType: ProviderType | string;
  teacherCategory?: TeacherCategory | string;
  bio?: string;
  rating?: number;
  services: string[];
  earnings?: number;
  institutionName?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
}

export interface StudentProfile extends UserProfile {
  role: 'STUDENT';
  parentId?: string;
  assignedServices: string[];
  grade?: string;
  school?: string;
  board?: string;
}

export interface ParentProfile extends UserProfile {
  role: 'PARENT';
  children: string[];
}

export interface AppSettings {
  registrationFee: number;
  allowedServiceProviderTypes: string[];
  maintenanceMode: boolean;
  adminKey: string;
  platformCommission?: number;
  /** When enabled, escrow funds are released automatically after service completion. */
  instantEscrowRelease?: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: number;
  paymentMethod?: string;
  plan?: SubscriptionPlan;
  billing?: SubscriptionBilling;
}

export type RateUnit = "PER_HOUR" | "PER_SESSION" | "PER_DAY" | "PER_MONTH";
export type TeacherCategory =
  | "SCHOOL_TEACHER"
  | "RETIRED_PRIVATE_SCHOOL_TEACHER"
  | "RETIRED_GOVT_SCHOOL_TEACHER"
  | "OTHER";

export const RATE_UNIT_LABELS: Record<RateUnit, string> = {
  PER_HOUR: "hour",
  PER_SESSION: "session",
  PER_DAY: "day",
  PER_MONTH: "month",
};

export const TEACHER_CATEGORY_LABELS: Record<TeacherCategory, string> = {
  SCHOOL_TEACHER: "School Teacher",
  RETIRED_PRIVATE_SCHOOL_TEACHER: "Retired (Private School)",
  RETIRED_GOVT_SCHOOL_TEACHER: "Retired (Govt. School)",
  OTHER: "Other",
};

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  price: number;
  rateUnit?: RateUnit;
  providerType: string;
  category?: string;
  teacherCategory?: TeacherCategory;
  subject?: string;
  hobby?: string;
  school?: string;
  area?: string;
  vehicleType?: string;
  location?: string;
  rating?: number;
  reviews?: number;
}

export interface ServiceRequest {
  id: string;
  serviceId: string;
  studentId: string;
  providerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  updatedAt: number;
}

export interface Child {
  uid: string;
  name: string;
  grade: string;
  school: string;
  services: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
  createdAt: number;
}

export interface EscrowTransaction {
  id: string;
  payerId: string;
  providerId: string;
  amount: number;
  commission: number;
  status: 'HELD' | 'RELEASED' | 'REFUNDED';
  serviceName: string;
  createdAt: number;
  releasedAt?: number;
}

export interface SubscriptionConfig {
  plan: SubscriptionPlan;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  color: string;
}

// ---------------------------------------------------------------------------
// Master services catalog (admin-managed master list of all service types)
// ---------------------------------------------------------------------------
export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: string;
  providerType: string; // TEACHER | TRANSPORTER | INSTITUTION
  active: boolean;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Marketplace (buy & sell, old books)
// ---------------------------------------------------------------------------
export type MarketplaceCategory = "BOOK" | "UNIFORM" | "STATIONERY" | "ELECTRONICS" | "OTHER";
export type MarketplaceCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR";

export interface MarketplaceItem {
  id: string;
  sellerId: string;
  sellerName?: string;
  title: string;
  description: string;
  price: number;
  category: MarketplaceCategory;
  condition?: MarketplaceCondition;
  grade?: string; // book-specific
  school?: string; // book-specific
  board?: string; // book-specific
  status: "ACTIVE" | "SOLD";
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Job board
// ---------------------------------------------------------------------------
export interface Job {
  id: string;
  posterId: string;
  posterName?: string;
  title: string;
  description: string;
  category: string;
  budget?: number;
  location?: string;
  lat?: number;
  lng?: number;
  status: "OPEN" | "CLOSED";
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Engagement: referrals, feedback, contest entries
// ---------------------------------------------------------------------------
export interface Referral {
  id: string;
  referrerId: string;
  refereeId?: string;
  refereeEmail?: string;
  refereeName?: string;
  status: "PENDING" | "SIGNED_UP" | "PAID";
  commission: number;
  createdAt: number;
}

export interface FeedbackEntry {
  id: string;
  userId: string;
  userName?: string;
  message: string;
  rating?: number;
  createdAt: number;
}

export interface ContestEntry {
  id: string;
  userId: string;
  userName?: string;
  feedbackId?: string;
  month: string; // e.g. "2025-08"
  createdAt: number;
}

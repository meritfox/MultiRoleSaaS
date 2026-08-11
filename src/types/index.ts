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

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  price: number;
  providerType: string;
  category?: string;
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

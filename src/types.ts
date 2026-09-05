export type WorkType = 'Customer' | 'Workshop' | 'Office' | 'Delivery' | 'Other';
export type UserRole = 'ADMIN' | 'ENGINEER';
export type UserStatus = 'Active' | 'Disabled';

export interface UserProfile {
  uid?: string; // Firebase Auth UID (Document ID)
  userId: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

export interface TimeDuration {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

export interface WorkEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  workType: WorkType;
  deliveryType?: 'Delivery of Consumables' | 'Delivery of Parts';
  customerName: string;
  location: string;
  
  travelStart: string; // HH:mm
  travelStop: string;
  
  jobStart: string;
  jobStop: string;
  
  jobCategory: string;
  remarks: string;
  createdAt: number;
  updatedAt: number;
  syncStatus?: 'synced' | 'pending';
}

export type ViewState = 'login' | 'dashboard' | 'form' | 'report' | 'admin';

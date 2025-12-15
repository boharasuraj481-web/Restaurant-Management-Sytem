export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  BOOKINGS = 'BOOKINGS',
  POS = 'POS',
  CRM = 'CRM',
  INVENTORY = 'INVENTORY',
  STAFF = 'STAFF',
  SETTINGS = 'SETTINGS',
  CUSTOMER_VIEW = 'CUSTOMER_VIEW'
}

export type UserRole = 'ADMIN' | 'WAITER' | 'CUSTOMER';

export interface AuthUser {
  id: string;
  password: string;
  role: UserRole;
  name: string;
}

export interface Booking {
  id: string;
  customerName: string;
  time: string;
  guests: number;
  table?: string;
  status: 'confirmed' | 'pending' | 'seated' | 'completed' | 'cancelled';
  tags: string[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  totalSpent: number;
  lastVisit: string;
  preferences: string[];
  segment: 'VIP' | 'Regular' | 'New' | 'At Risk';
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Starter' | 'Main' | 'Dessert' | 'Drink';
  image?: string;
  description?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  costPerUnit: number;
  expiryDate: string;
  status: 'Good' | 'Low' | 'Critical';
}

export interface SaleData {
  time: string;
  amount: number;
}

export interface Employee {
  id: string;
  name: string;
  role: 'Chef' | 'Server' | 'Bartender' | 'Host' | 'Manager';
  rate: number;
  status: 'Working' | 'Off' | 'Break';
  weeklyHours: number;
  email: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  day: string;
  startTime: string;
  endTime: string;
  area: string;
}
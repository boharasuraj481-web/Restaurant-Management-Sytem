import { Booking, Customer, MenuItem, InventoryItem, Employee, Shift, AuthUser } from '../types';

// Constants for initial data
const INITIAL_USERS: AuthUser[] = [
  { id: 'admin', password: 'password', role: 'ADMIN', name: 'Administrator' }
];

const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Chicken Momo', price: 250, category: 'Starter' },
  { id: '2', name: 'Buff Chowmein', price: 200, category: 'Main' },
  { id: '3', name: 'Thakali Set (Veg)', price: 450, category: 'Main' },
  { id: '4', name: 'Chicken Sekuwa', price: 350, category: 'Starter' },
  { id: '5', name: 'Sel Roti', price: 50, category: 'Starter' },
  { id: '6', name: 'Milk Tea', price: 40, category: 'Drink' },
  { id: '7', name: 'Gorkha Beer', price: 650, category: 'Drink' },
  { id: '8', name: 'Lassi', price: 150, category: 'Drink' },
];

const INITIAL_INVENTORY_CATEGORIES = ['Produce', 'Meat', 'Dairy', 'Dry Goods', 'Beverage', 'Supplies'];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Wagyu Beef A5', category: 'Meat', quantity: 4.5, unit: 'kg', minThreshold: 5, costPerUnit: 1200, expiryDate: '2023-11-20', status: 'Low' },
  { id: '2', name: 'Truffle Oil', category: 'Dry Goods', quantity: 12, unit: 'btl', minThreshold: 2, costPerUnit: 4500, expiryDate: '2024-05-15', status: 'Good' },
  { id: '3', name: 'San Marzano Tomatoes', category: 'Produce', quantity: 8, unit: 'cans', minThreshold: 10, costPerUnit: 1200, expiryDate: '2025-01-01', status: 'Low' },
  { id: '4', name: 'House Red Wine', category: 'Beverage', quantity: 2, unit: 'cases', minThreshold: 3, costPerUnit: 15000, expiryDate: '2024-12-31', status: 'Critical' },
  { id: '5', name: '00 Flour', category: 'Dry Goods', quantity: 25, unit: 'kg', minThreshold: 10, costPerUnit: 250, expiryDate: '2024-03-20', status: 'Good' },
  { id: '6', name: 'Atlantic Salmon', category: 'Meat', quantity: 3.2, unit: 'kg', minThreshold: 4, costPerUnit: 2800, expiryDate: '2023-11-15', status: 'Low' },
];

const INITIAL_BOOKINGS: Booking[] = [
  { id: '1', customerName: 'Alice Johnson', time: '19:00', guests: 2, status: 'confirmed', tags: ['Anniversary'] },
  { id: '2', customerName: 'Michael Chen', time: '19:15', guests: 4, status: 'seated', tags: ['VIP', 'Regular'], table: 'T4' },
  { id: '3', customerName: 'Sarah Smith', time: '19:30', guests: 6, status: 'pending', tags: ['Allergy: Nuts'] },
  { id: '4', customerName: 'James Wilson', time: '20:00', guests: 2, status: 'confirmed', tags: [] },
  { id: '5', customerName: 'Emma Davis', time: '20:15', guests: 3, status: 'confirmed', tags: ['Outdoor'] },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', phone: '+1 234 567 8900', visits: 12, totalSpent: 14500, lastVisit: '2 days ago', preferences: ['Window seat', 'Red Wine'], segment: 'VIP' },
  { id: '2', name: 'Michael Chen', email: 'michael@example.com', phone: '+1 234 567 8901', visits: 4, totalSpent: 3200, lastVisit: '1 week ago', preferences: ['Quiet area'], segment: 'Regular' },
  { id: '3', name: 'Sarah Smith', email: 'sarah@example.com', phone: '+1 234 567 8902', visits: 1, totalSpent: 850, lastVisit: '1 month ago', preferences: ['Vegan'], segment: 'New' },
];

const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Ram Bahadur', role: 'Chef', rate: 1200.00, status: 'Working', weeklyHours: 42, email: 'ram@cenit.com' },
  { id: '2', name: 'Sita Sharma', role: 'Manager', rate: 1500.00, status: 'Working', weeklyHours: 40, email: 'sita@cenit.com' },
  { id: '3', name: 'Rohan Gupta', role: 'Server', rate: 600.00, status: 'Off', weeklyHours: 32, email: 'rohan@cenit.com' },
  { id: '4', name: 'Anita Sherpa', role: 'Host', rate: 550.00, status: 'Break', weeklyHours: 28, email: 'anita@cenit.com' },
  { id: '5', name: 'Bikash Thapa', role: 'Bartender', rate: 800.00, status: 'Off', weeklyHours: 35, email: 'bikash@cenit.com' },
];

const INITIAL_SHIFTS: Shift[] = [
  { id: '1', employeeId: '1', day: 'Today', startTime: '10:00', endTime: '22:00', area: 'Kitchen' },
  { id: '2', employeeId: '2', day: 'Today', startTime: '09:00', endTime: '18:00', area: 'FOH' },
  { id: '3', employeeId: '4', day: 'Today', startTime: '17:00', endTime: '23:00', area: 'Reception' },
  { id: '4', employeeId: '3', day: 'Tomorrow', startTime: '16:00', endTime: '00:00', area: 'Dining' },
];

const load = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(`cenit_${key}`);
  return stored ? JSON.parse(stored) : initial;
};

const save = (key: string, data: any) => {
  localStorage.setItem(`cenit_${key}`, JSON.stringify(data));
};

export const db = {
  users: {
    getAll: () => load<AuthUser[]>('users', INITIAL_USERS),
    save: (data: AuthUser[]) => save('users', data),
    add: (user: AuthUser) => {
      const users = db.users.getAll();
      users.push(user);
      save('users', users);
    }
  },
  menu: {
    getAll: () => load<MenuItem[]>('menu', INITIAL_MENU_ITEMS),
    save: (data: MenuItem[]) => save('menu', data),
  },
  inventory: {
    getAll: () => load<InventoryItem[]>('inventory', INITIAL_INVENTORY),
    save: (data: InventoryItem[]) => save('inventory', data),
    getCategories: () => load<string[]>('inventory_categories', INITIAL_INVENTORY_CATEGORIES),
    saveCategories: (data: string[]) => save('inventory_categories', data),
  },
  bookings: {
    getAll: () => load<Booking[]>('bookings', INITIAL_BOOKINGS),
    save: (data: Booking[]) => save('bookings', data),
  },
  customers: {
    getAll: () => load<Customer[]>('customers', INITIAL_CUSTOMERS),
    save: (data: Customer[]) => save('customers', data),
  },
  staff: {
    getEmployees: () => load<Employee[]>('employees', INITIAL_EMPLOYEES),
    saveEmployees: (data: Employee[]) => save('employees', data),
    getShifts: () => load<Shift[]>('shifts', INITIAL_SHIFTS),
    saveShifts: (data: Shift[]) => save('shifts', data),
  }
};
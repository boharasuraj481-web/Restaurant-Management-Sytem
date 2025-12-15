import React from 'react';
import { LayoutDashboard, CalendarDays, Users, UtensilsCrossed, Store, Settings, LogOut, Briefcase } from 'lucide-react';
import { ViewState, UserRole, AuthUser } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  currentUser: AuthUser;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, currentUser, onLogout }) => {
  
  // Define available menu items based on role
  const getMenuItems = () => {
    const allItems = [
      { id: ViewState.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN'] },
      { id: ViewState.BOOKINGS, icon: CalendarDays, label: 'Bookings', roles: ['ADMIN', 'WAITER'] },
      { id: ViewState.POS, icon: Store, label: 'Point of Sale', roles: ['ADMIN', 'WAITER'] },
      { id: ViewState.CRM, icon: Users, label: 'Customers', roles: ['ADMIN'] },
      { id: ViewState.INVENTORY, icon: UtensilsCrossed, label: 'Inventory', roles: ['ADMIN'] },
      { id: ViewState.STAFF, icon: Briefcase, label: 'Staff & Payroll', roles: ['ADMIN'] },
    ];

    return allItems.filter(item => item.roles.includes(currentUser.role));
  };

  const menuItems = getMenuItems();

  return (
    <div className="h-screen w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white tracking-tight leading-none">Cénit</span>
          <span className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">{currentUser.name}</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentView === item.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} className={currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        {currentUser.role === 'ADMIN' && (
          <button 
            onClick={() => onChangeView(ViewState.SETTINGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors mb-1 ${currentView === ViewState.SETTINGS ? 'text-white bg-slate-800' : 'text-slate-400'}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        )}
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
            <LogOut size={20} />
            <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
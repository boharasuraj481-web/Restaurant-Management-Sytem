import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Bookings from './components/Bookings';
import POS from './components/POS';
import CRM from './components/CRM';
import Inventory from './components/Inventory';
import Staff from './components/Staff';
import Settings from './components/Settings';
import CustomerView from './components/CustomerView';
import { ViewState, MenuItem, UserRole, AuthUser } from './types';
import { User, Shield, Coffee, Key, ArrowRight, CheckCircle } from 'lucide-react';
import { db } from './services/db';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // Authentication State
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Menu State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // Load data on mount
  useEffect(() => {
    setAuthUsers(db.users.getAll());
    setMenuItems(db.menu.getAll());
  }, []);

  // Update DB when auth users change (e.g. new registration or admin adding waiter)
  const handleUpdateAuthUsers = (users: AuthUser[]) => {
      setAuthUsers(users);
      db.users.save(users);
  };

  // Update DB when menu changes
  const handleUpdateMenuItems = (items: MenuItem[]) => {
      setMenuItems(items); // React State
      // In the setter passed to Settings, we'll need to call this or directly db.save
  };
  
  // Login Form State
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regSuccessId, setRegSuccessId] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Re-fetch users to ensure we have latest (in case of multiple tabs, though local state is usually enough here)
    const currentUsers = db.users.getAll(); 
    const user = currentUsers.find(u => u.id === loginId && u.password === loginPass);
    
    if (user) {
      setCurrentUser(user);
      setLoginId('');
      setLoginPass('');
      setLoginError('');
      
      // Route to appropriate initial view
      if (user.role === 'CUSTOMER') {
        setCurrentView(ViewState.CUSTOMER_VIEW);
      } else if (user.role === 'WAITER') {
        setCurrentView(ViewState.POS);
      } else {
        setCurrentView(ViewState.DASHBOARD);
      }
    } else {
      setLoginError('Invalid ID or Password');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regPass) return;

    // Generate Customer ID (e.g., CUST-1234)
    const newId = `CUST-${regPhone.slice(-4)}`;
    const newUser: AuthUser = {
      id: newId,
      password: regPass,
      name: regName,
      role: 'CUSTOMER'
    };

    const updatedUsers = [...authUsers, newUser];
    handleUpdateAuthUsers(updatedUsers);
    
    setRegSuccessId(newId);
  };

  const switchToLogin = () => {
    setIsRegistering(false);
    setRegSuccessId('');
    setRegName('');
    setRegPhone('');
    setRegPass('');
  };

  // Wrapper for settings to update DB
  const updateMenuItemsWrapper = (action: React.SetStateAction<MenuItem[]>) => {
      if (typeof action === 'function') {
          setMenuItems(prev => {
              const newData = action(prev);
              db.menu.save(newData);
              return newData;
          });
      } else {
          setMenuItems(action);
          db.menu.save(action);
      }
  };

  // ------------------------------------------------------------------
  // Render Login / Register Screens
  // ------------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Left Side: Branding */}
          <div className="text-white flex flex-col justify-center space-y-6">
            <div>
               <h1 className="text-5xl font-bold mb-2 tracking-tight">Cénit</h1>
               <div className="h-1 w-20 bg-indigo-500 rounded-full"></div>
            </div>
            <p className="text-xl text-slate-400 font-light leading-relaxed">
              The Intelligent Operating System for modern restaurants in Nepal.
            </p>
            <div className="flex gap-3 pt-4">
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                <Shield size={16} className="text-indigo-400" /> <span className="text-sm">Admin</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                <User size={16} className="text-purple-400" /> <span className="text-sm">Staff</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                <Coffee size={16} className="text-green-400" /> <span className="text-sm">Customer</span>
              </div>
            </div>
          </div>
          
          {/* Right Side: Auth Forms */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            
            {/* REGISTER SUCCESS OVERLAY */}
            {regSuccessId && (
              <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
                <p className="text-slate-500 mb-6">Your Customer Login ID is:</p>
                <div className="bg-slate-100 px-6 py-4 rounded-xl border border-slate-200 mb-8">
                  <span className="text-3xl font-mono font-bold text-slate-900 tracking-wider">{regSuccessId}</span>
                </div>
                <button 
                  onClick={switchToLogin}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            )}

            {/* LOGIN FORM */}
            {!isRegistering ? (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome Back</h2>
                <p className="text-slate-500 mb-8 text-sm">Please login to access your dashboard.</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">User ID / Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="Enter your ID"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="password" 
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="Enter password"
                        required
                      />
                    </div>
                  </div>
                  
                  {loginError && (
                    <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                      {loginError}
                    </p>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex justify-center items-center gap-2 mt-4"
                  >
                    Login <ArrowRight size={18} />
                  </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-slate-100">
                  <p className="text-slate-500 text-sm">New Customer?</p>
                  <button 
                    onClick={() => setIsRegistering(true)}
                    className="text-indigo-600 font-bold hover:text-indigo-800 text-sm mt-1"
                  >
                    Create an Account
                  </button>
                </div>
              </div>
            ) : (
              // REGISTER FORM
              <div className="animate-fade-in">
                 <button onClick={switchToLogin} className="text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1 text-sm font-medium">
                    ← Back to Login
                 </button>
                 <h2 className="text-2xl font-bold text-slate-900 mb-1">Create Account</h2>
                 <p className="text-slate-500 mb-6 text-sm">Sign up to order online and track rewards.</p>

                 <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                    <input 
                        type="text" 
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="e.g. John Doe"
                        required
                      />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                    <input 
                        type="tel" 
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="e.g. 9841XXXXXX"
                        required
                      />
                  </div>
                   <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Set Password</label>
                    <input 
                        type="password" 
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="Choose a password"
                        required
                      />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 mt-4"
                  >
                    Register Now
                  </button>
                 </form>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Main Application Render
  // ------------------------------------------------------------------

  // Customer View
  if (currentUser.role === 'CUSTOMER' || currentView === ViewState.CUSTOMER_VIEW) {
    return <CustomerView menuItems={menuItems} onExit={() => setCurrentUser(null)} />;
  }

  // Admin/Waiter View Container
  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard />;
      case ViewState.BOOKINGS:
        return <Bookings />;
      case ViewState.POS:
        return <POS menuItems={menuItems} currentUser={currentUser} />;
      case ViewState.CRM:
        return <CRM />;
      case ViewState.INVENTORY:
        return <Inventory />;
      case ViewState.STAFF:
        // Pass authUsers and wrapper setter to Staff so Admin can add Waiters and persist to DB
        return (
            <Staff 
                authUsers={authUsers} 
                setAuthUsers={(action) => {
                     // Handle both function update and direct value update
                     if (typeof action === 'function') {
                         const newUsers = action(authUsers);
                         handleUpdateAuthUsers(newUsers);
                     } else {
                         handleUpdateAuthUsers(action);
                     }
                }} 
            />
        );
      case ViewState.SETTINGS:
        return <Settings menuItems={menuItems} setMenuItems={updateMenuItemsWrapper} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
      />
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
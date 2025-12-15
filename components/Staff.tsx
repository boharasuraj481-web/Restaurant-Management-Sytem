import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Clock, DollarSign, Sparkles, Calendar, MoreHorizontal, Mail, Briefcase, Plus, Key, Shield, Trash2 } from 'lucide-react';
import { Employee, Shift, AuthUser } from '../types';
import { generateStaffingInsight } from '../services/geminiService';
import { db } from '../services/db';

interface StaffProps {
  authUsers: AuthUser[];
  setAuthUsers: React.Dispatch<React.SetStateAction<AuthUser[]>>;
}

const Staff: React.FC<StaffProps> = ({ authUsers, setAuthUsers }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'schedule' | 'payroll' | 'access'>('team');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  
  // New Waiter Form State
  const [newWaiter, setNewWaiter] = useState({ id: '', password: '', name: '' });

  useEffect(() => {
    setEmployees(db.staff.getEmployees());
    setShifts(db.staff.getShifts());
  }, []);

  const handleSmartSchedule = async () => {
    setLoadingAi(true);
    const context = employees.map(e => `${e.name} (${e.role}): ${e.weeklyHours}hrs/week`).join(', ');
    const result = await generateStaffingInsight(context);
    setAiInsight(result);
    setLoadingAi(false);
  };

  const calculatePayroll = (emp: Employee) => (emp.rate * emp.weeklyHours).toLocaleString();

  const handleCreateWaiter = () => {
    if (!newWaiter.id || !newWaiter.password || !newWaiter.name) return;
    
    const newUser: AuthUser = {
      id: newWaiter.id,
      password: newWaiter.password,
      name: newWaiter.name,
      role: 'WAITER'
    };

    setAuthUsers(prev => [...prev, newUser]); // This triggers update in App.tsx which saves to DB
    setNewWaiter({ id: '', password: '', name: '' });
    alert(`Waiter ${newUser.name} created successfully!`);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to remove this user access?')) {
      setAuthUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-8 overflow-y-auto animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff & Payroll</h1>
          <p className="text-slate-500 mt-1">Manage team, attendance, and schedules</p>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={handleSmartSchedule}
            disabled={loadingAi}
            className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-70"
          >
            <Sparkles size={18} className={loadingAi ? "animate-spin" : ""} />
            {loadingAi ? "Optimizing..." : "Smart Schedule"}
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg">
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

       {/* AI Insight Section */}
       {aiInsight && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 relative overflow-hidden animate-slide-in-right">
            <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                    <Sparkles size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-purple-900 mb-2">AI Staffing Recommendations</h3>
                    <div className="text-purple-800 prose prose-purple max-w-none whitespace-pre-line">
                        {aiInsight}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                <UserCheck size={28} />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Active Now</p>
                <p className="text-2xl font-bold text-slate-900">
                    {employees.filter(e => e.status === 'Working').length} / {employees.length}
                </p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                <DollarSign size={28} />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Est. Weekly Payroll</p>
                <p className="text-2xl font-bold text-slate-900">
                    Rs. {employees.reduce((acc, curr) => acc + (curr.rate * curr.weeklyHours), 0).toLocaleString()}
                </p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
                <Clock size={28} />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Total Hours (Week)</p>
                <p className="text-2xl font-bold text-slate-900">
                     {employees.reduce((acc, curr) => acc + curr.weeklyHours, 0)} hrs
                </p>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {(['team', 'schedule', 'payroll', 'access'] as const).map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm transition-all relative whitespace-nowrap ${
                    activeTab === tab 
                    ? 'text-indigo-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                {tab === 'access' ? 'System Access' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
                )}
            </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 overflow-hidden">
        
        {/* TEAM VIEW */}
        {activeTab === 'team' && (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {employees.map(emp => (
                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{emp.name}</p>
                                            <p className="text-xs text-slate-400">ID: #{emp.id.padStart(4, '0')}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-slate-600">
                                    <span className="flex items-center gap-2">
                                        <Briefcase size={16} className="text-slate-400" /> {emp.role}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                        emp.status === 'Working' ? 'bg-green-50 text-green-700 border-green-100' :
                                        emp.status === 'Break' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-slate-50 text-slate-500 border-slate-100'
                                    }`}>
                                        {emp.status}
                                    </span>
                                </td>
                                <td className="p-6 text-slate-500 flex items-center gap-2">
                                    <Mail size={14} /> {emp.email}
                                </td>
                                <td className="p-6 text-right">
                                    <button className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* SCHEDULE VIEW */}
        {activeTab === 'schedule' && (
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shifts.map(shift => {
                        const emp = employees.find(e => e.id === shift.employeeId);
                        return (
                            <div key={shift.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-slate-50/50">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wide">
                                        {shift.day}
                                    </span>
                                    <span className="text-slate-400 text-xs flex items-center gap-1">
                                        <Clock size={12} /> {shift.startTime} - {shift.endTime}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                                        {emp?.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 text-sm">{emp?.name}</p>
                                        <p className="text-xs text-slate-500">{emp?.role}</p>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex items-center gap-2">
                                    Area: <span className="text-slate-700">{shift.area}</span>
                                </div>
                            </div>
                        );
                    })}
                     <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer min-h-[140px]">
                        <Plus size={24} className="mb-2" />
                        <span className="font-medium text-sm">Add Shift</span>
                    </div>
                </div>
            </div>
        )}

        {/* PAYROLL VIEW */}
        {activeTab === 'payroll' && (
            <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Hourly Rate</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Hours Worked</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Estimated Pay</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                         {employees.map(emp => (
                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6 font-medium text-slate-900">{emp.name}</td>
                                <td className="p-6 text-slate-500">{emp.role}</td>
                                <td className="p-6 text-slate-600">Rs. {emp.rate.toFixed(2)}/hr</td>
                                <td className="p-6 text-slate-600">{emp.weeklyHours} hrs</td>
                                <td className="p-6 text-right font-bold text-green-600">
                                    Rs. {calculatePayroll(emp)}
                                </td>
                            </tr>
                         ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* ACCESS VIEW */}
        {activeTab === 'access' && (
             <div className="p-6 flex flex-col h-full overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                    {/* List */}
                    <div className="lg:col-span-2 overflow-y-auto pr-2">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">System Users</h3>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 text-xs font-bold uppercase">Name</th>
                                        <th className="p-4 text-xs font-bold uppercase">User ID</th>
                                        <th className="p-4 text-xs font-bold uppercase">Role</th>
                                        <th className="p-4 text-xs font-bold uppercase text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {authUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-100">
                                            <td className="p-4 font-medium text-slate-900">{user.name}</td>
                                            <td className="p-4 text-slate-600 font-mono text-sm">{user.id}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                                                    user.role === 'WAITER' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {user.role !== 'ADMIN' && (
                                                    <button 
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Create Form */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Key size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Create Waiter Login</h3>
                                <p className="text-xs text-slate-500">Generate credentials for staff</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                <input 
                                    type="text"
                                    value={newWaiter.name}
                                    onChange={e => setNewWaiter({...newWaiter, name: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">User ID</label>
                                <input 
                                    type="text"
                                    value={newWaiter.id}
                                    onChange={e => setNewWaiter({...newWaiter, id: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. waiter1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                                <input 
                                    type="text" 
                                    value={newWaiter.password}
                                    onChange={e => setNewWaiter({...newWaiter, password: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                    placeholder="Set password"
                                />
                            </div>
                            <button 
                                onClick={handleCreateWaiter}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-2"
                            >
                                Create Credentials
                            </button>
                        </div>
                    </div>
                </div>
             </div>
        )}

      </div>
    </div>
  );
};

export default Staff;
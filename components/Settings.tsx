import React, { useState } from 'react';
import { Plus, Trash2, Save, X, Edit3, DollarSign, Database, Mail, AlertTriangle } from 'lucide-react';
import { MenuItem } from '../types';
import { db } from '../services/db';

interface SettingsProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
}

const Settings: React.FC<SettingsProps> = ({ menuItems, setMenuItems }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    category: 'Main'
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setMenuItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAdd = () => {
    if (!newItem.name || !newItem.price) return;
    
    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      price: Number(newItem.price),
      category: newItem.category as any,
      image: newItem.image
    };

    setMenuItems(prev => [...prev, item]);
    setIsAdding(false);
    setNewItem({ name: '', price: 0, category: 'Main' });
  };

  const handleEmailBackup = () => {
    // Aggregate all system data
    const allData = {
        credentials: db.users.getAll(),
        menu: db.menu.getAll(),
        inventory: db.inventory.getAll(),
        bookings: db.bookings.getAll(),
        customers: db.customers.getAll(),
        staff: db.staff.getEmployees(),
        shifts: db.staff.getShifts()
    };
    
    const jsonString = JSON.stringify(allData, null, 2);
    const recipient = "boharasuraj481@gmail.com";
    const subject = encodeURIComponent("Cénit System Backup & Admin Credentials");
    
    // Attempt to construct body
    const bodyContent = `Here is the requested system export containing Admin ID/Password and all database entries:\n\n${jsonString}`;
    const body = encodeURIComponent(bodyContent);
    
    // Check for URL length limits (approx 2000 chars is safe limit for mailto)
    if (body.length > 1800) {
        // Fallback for large data
        navigator.clipboard.writeText(bodyContent).then(() => {
             alert("Data is too large for the direct email link.\n\nThe data (including Admin ID & Password) has been COPIED to your clipboard.\n\nA draft email to " + recipient + " will now open. Please PASTE the data into the email body.");
             window.open(`mailto:${recipient}?subject=${subject}`);
        }).catch(err => {
            alert("Failed to copy data. Please check console.");
            console.error(err);
        });
    } else {
        window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    }
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-8 overflow-y-auto animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage restaurant configuration and menu</p>
        </div>
      </div>

      {/* Menu Management Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Menu Management</h2>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>

        {isAdding && (
          <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fade-in">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
              <input 
                type="text" 
                value={newItem.name} 
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Momo"
              />
            </div>
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
               <select 
                 value={newItem.category} 
                 onChange={e => setNewItem({...newItem, category: e.target.value as any})}
                 className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
               >
                 <option value="Starter">Starter</option>
                 <option value="Main">Main</option>
                 <option value="Dessert">Dessert</option>
                 <option value="Drink">Drink</option>
               </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Price (Rs.)</label>
              <input 
                type="number" 
                value={newItem.price} 
                onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
                className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleAdd}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} /> Save
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Item Name</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Price</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {menuItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">{item.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">{item.category}</span>
                  </td>
                  <td className="p-4 text-slate-600">Rs. {item.price}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Currency Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Currency Settings</h2>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <span className="font-bold text-xl">Rs</span>
              </div>
              <div>
                  <h3 className="font-bold text-slate-900">Nepalese Rupee (NPR)</h3>
                  <p className="text-sm text-slate-500">System currency set to Nepal standards.</p>
              </div>
          </div>
      </div>

      {/* System Data Export */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">System Data & Backup</h2>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Database size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-900">Export System Data</h3>
                      <p className="text-sm text-slate-500 mb-2">
                        Backup all Admin credentials, Menu items, Inventory, and User entries.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-amber-600 font-medium bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 inline-flex">
                          <AlertTriangle size={14} />
                          Warning: This includes sensitive Admin ID & Password data.
                      </div>
                  </div>
              </div>
              
              <button 
                  onClick={handleEmailBackup}
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                  <Mail size={18} /> Email Backup to boharasuraj481@gmail.com
              </button>
          </div>
      </div>
    </div>
  );
};

export default Settings;
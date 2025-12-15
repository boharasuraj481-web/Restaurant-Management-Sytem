import React, { useState, useEffect } from 'react';
import { Search, Package, AlertTriangle, DollarSign, Trash2, RefreshCw, Sparkles, Filter, TrendingDown, Plus, X, Save } from 'lucide-react';
import { InventoryItem } from '../types';
import { generateInventoryInsight } from '../services/geminiService';
import { db } from '../services/db';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('All'); // 'All' | 'Low' | 'Critical' | CategoryName
  const [wasteCost, setWasteCost] = useState(14500);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Modal States
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // Form States
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '', category: '', quantity: 0, unit: 'kg', minThreshold: 5, costPerUnit: 0, status: 'Good'
  });
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    setItems(db.inventory.getAll());
    setCategories(db.inventory.getCategories());
  }, []);

  const saveInventory = (updatedItems: InventoryItem[]) => {
    setItems(updatedItems);
    db.inventory.save(updatedItems);
  };

  const saveCategories = (updatedCategories: string[]) => {
    setCategories(updatedCategories);
    db.inventory.saveCategories(updatedCategories);
  };

  const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.costPerUnit), 0);
  const lowStockCount = items.filter(i => i.status === 'Low' || i.status === 'Critical').length;

  const handleGenerateInsight = async () => {
    setLoadingAi(true);
    const context = items.map(i => `${i.name}: ${i.quantity}${i.unit} (${i.status})`).join(', ');
    const result = await generateInventoryInsight(context);
    setAiInsight(result);
    setLoadingAi(false);
  };

  const handleLogWaste = (item: InventoryItem) => {
    const wasteAmount = item.unit === 'kg' ? 0.5 : 1;
    const wasteValue = wasteAmount * item.costPerUnit;
    
    setWasteCost(prev => prev + wasteValue);
    const updatedItems = items.map(i => {
        if (i.id === item.id) {
            const newQty = Math.max(0, i.quantity - wasteAmount);
            let newStatus: 'Good' | 'Low' | 'Critical' = i.status;
            if (newQty < i.minThreshold / 2) newStatus = 'Critical';
            else if (newQty < i.minThreshold) newStatus = 'Low';
            
            return { ...i, quantity: newQty, status: newStatus };
        }
        return i;
    });
    saveInventory(updatedItems);
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category) return;
    const item: InventoryItem = {
      id: Date.now().toString(),
      name: newItem.name || 'Unknown',
      category: newItem.category || 'Uncategorized',
      quantity: Number(newItem.quantity),
      unit: newItem.unit || 'kg',
      minThreshold: Number(newItem.minThreshold),
      costPerUnit: Number(newItem.costPerUnit),
      expiryDate: new Date().toISOString().split('T')[0],
      status: 'Good'
    };
    saveInventory([...items, item]);
    setIsAddingItem(false);
    setNewItem({ name: '', category: '', quantity: 0, unit: 'kg', minThreshold: 5, costPerUnit: 0, status: 'Good' });
  };

  const handleAddCategory = () => {
    if (!newCategory || categories.includes(newCategory)) return;
    saveCategories([...categories, newCategory]);
    setNewCategory('');
    setIsAddingCategory(false);
  };

  const handleDeleteItem = (id: string) => {
      if(confirm('Are you sure you want to delete this item?')) {
          saveInventory(items.filter(i => i.id !== id));
      }
  }

  const filteredItems = items.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Low') return item.status === 'Low';
    if (filter === 'Critical') return item.status === 'Critical';
    return item.category === filter;
  });

  return (
    <div className="p-8 h-full flex flex-col space-y-8 overflow-y-auto animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 mt-1">Real-time stock monitoring & food cost control</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleGenerateInsight}
            disabled={loadingAi}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Sparkles size={18} className={loadingAi ? "animate-spin" : ""} />
            {loadingAi ? "Analyzing..." : "AI Stock Analysis"}
          </button>
          <button 
            onClick={() => setIsAddingItem(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-bounce-in">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-xl font-bold text-slate-900">Add New Inventory Item</h3>
                      <button onClick={() => setIsAddingItem(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-8 grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                          <label className="block text-sm font-bold text-slate-700 mb-1">Item Name</label>
                          <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                          <select className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                              <option value="">Select Category</option>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Unit Type</label>
                          <select className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})}>
                              <option value="kg">Kilogram (kg)</option>
                              <option value="ltr">Liter (ltr)</option>
                              <option value="btl">Bottle (btl)</option>
                              <option value="cans">Cans</option>
                              <option value="cases">Cases</option>
                              <option value="pcs">Pieces</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Quantity</label>
                          <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Cost Per Unit</label>
                          <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={newItem.costPerUnit} onChange={e => setNewItem({...newItem, costPerUnit: Number(e.target.value)})} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Min. Threshold</label>
                          <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={newItem.minThreshold} onChange={e => setNewItem({...newItem, minThreshold: Number(e.target.value)})} />
                      </div>
                  </div>
                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setIsAddingItem(false)} className="px-6 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white">Cancel</button>
                      <button onClick={handleAddItem} className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">Save Item</button>
                  </div>
              </div>
          </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                <DollarSign size={28} />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Total Stock Value</p>
                <p className="text-2xl font-bold text-slate-900">Rs. {totalValue.toLocaleString()}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-red-50 text-red-600 rounded-xl">
                <AlertTriangle size={28} />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Low Stock Items</p>
                <p className="text-2xl font-bold text-slate-900">{lowStockCount} <span className="text-sm font-normal text-slate-400">items</span></p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
                <Trash2 size={28} />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Waste Cost (This Month)</p>
                <p className="text-2xl font-bold text-slate-900">Rs. {wasteCost.toLocaleString()}</p>
            </div>
        </div>
      </div>

      {/* AI Insight Section */}
      {aiInsight && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden animate-slide-in-right">
            <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                    <Sparkles size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">Smart Restocking Recommendations</h3>
                    <div className="text-indigo-800 prose prose-indigo max-w-none whitespace-pre-line">
                        {aiInsight}
                    </div>
                </div>
                <button onClick={() => setAiInsight("")} className="text-indigo-400 hover:text-indigo-600"><X size={18} /></button>
            </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search ingredients..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                <button 
                    onClick={() => setFilter('All')} 
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${filter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}
                >
                    All
                </button>
                 <button 
                    onClick={() => setFilter('Low')} 
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${filter === 'Low' ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-600'}`}
                >
                    Low Stock
                </button>
                <button 
                    onClick={() => setFilter('Critical')} 
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${filter === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-slate-50 text-slate-600'}`}
                >
                    Critical
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
                {categories.map(cat => (
                     <button 
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${filter === cat ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'}`}
                    >
                        {cat}
                    </button>
                ))}
                 {isAddingCategory ? (
                    <div className="flex items-center gap-1 animate-fade-in">
                        <input 
                            autoFocus
                            type="text" 
                            className="w-24 px-2 py-1.5 text-sm border border-indigo-300 rounded-lg outline-none"
                            placeholder="New Cat..."
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                        />
                        <button onClick={handleAddCategory} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"><Plus size={14}/></button>
                        <button onClick={() => setIsAddingCategory(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"><X size={14}/></button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAddingCategory(true)}
                        className="px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 whitespace-nowrap flex items-center gap-1"
                    >
                        <Plus size={14} /> New Category
                    </button>
                )}
            </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Item Name</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Level</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Cost</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Value</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="p-4 font-medium text-slate-900">{item.name}</td>
                            <td className="p-4 text-slate-500">
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs">{item.category}</span>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-700 w-16">{item.quantity} {item.unit}</span>
                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                item.status === 'Critical' ? 'bg-red-500' : 
                                                item.status === 'Low' ? 'bg-amber-400' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${Math.min(100, (item.quantity / (item.minThreshold * 2)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                    item.status === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                    item.status === 'Low' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-green-50 text-green-600 border-green-100'
                                }`}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="p-4 text-slate-600">Rs. {item.costPerUnit.toLocaleString()}</td>
                            <td className="p-4 font-medium text-slate-900">Rs. {(item.quantity * item.costPerUnit).toLocaleString()}</td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleLogWaste(item)}
                                        className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                        title="Log Waste"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Item"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                     {filteredItems.length === 0 && (
                        <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400">
                                No inventory items found for this filter.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, CreditCard, Trash2, Plus, Minus, LayoutGrid, User, Phone, MapPin, CheckCircle, ExternalLink, Map, Receipt, Printer, X, Edit2, Save } from 'lucide-react';
import { MenuItem, AuthUser, Order } from '../types';
import { verifyAddress } from '../services/geminiService';
import { db } from '../services/db';

interface CartItem extends MenuItem {
  qty: number;
}

interface POSProps {
  menuItems: MenuItem[];
  currentUser: AuthUser | null;
  onUpdateMenu?: (action: React.SetStateAction<MenuItem[]>) => void;
}

const POS: React.FC<POSProps> = ({ menuItems, currentUser, onUpdateMenu }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [category, setCategory] = useState<string>('All');
  const [tableNumber, setTableNumber] = useState<string>('5');
  const [customerDetails, setCustomerDetails] = useState({ phone: '', address: '' });
  
  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{text: string, mapUri?: string} | null>(null);

  // Checkout Modal State
  const [showReceipt, setShowReceipt] = useState(false);

  // Admin Management State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageItem, setManageItem] = useState<Partial<MenuItem>>({});

  useEffect(() => {
    // Load dynamic categories
    setCategories(['All', ...db.menu.getCategories()]);
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        return { ...i, qty: Math.max(1, i.qty + delta) };
      }
      return i;
    }));
  };

  const handleVerifyAddress = async () => {
      if (!customerDetails.address) return;
      setIsVerifying(true);
      setVerificationResult(null);
      
      // Optional: Get current geolocation to help verification
      let location = undefined;
      if (navigator.geolocation) {
          try {
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
              });
              location = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
              };
          } catch (e) {
              console.log("Geolocation skipped");
          }
      }

      const result = await verifyAddress(customerDetails.address, location);
      setVerificationResult(result);
      setIsVerifying(false);
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const tax = total * 0.13;
  const grandTotal = total + tax;

  const handleCheckoutClick = () => {
      if (cart.length === 0) return;
      setShowReceipt(true);
  };

  const handleConfirmPayment = () => {
    const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty
        })),
        subtotal: total,
        tax: tax,
        total: grandTotal,
        timestamp: new Date().toISOString(),
        // POS orders go to Pending so they appear in Kitchen. 
        // In a real system, payment status and kitchen status would be separate.
        status: 'pending', 
        method: 'Cash', // Default for POS
        customerDetails: currentUser?.role === 'CUSTOMER' ? {
            name: currentUser.name,
            phone: customerDetails.phone,
            address: customerDetails.address
        } : undefined,
        table: currentUser?.role !== 'CUSTOMER' ? tableNumber : undefined
    };

    db.orders.add(newOrder);
    
    // Clear and Close
    setCart([]);
    setShowReceipt(false);
    alert('Order Sent to Kitchen!');
  };

  // --- Admin CRUD Handlers ---

  const handleAdminAddClick = () => {
      setManageItem({ category: categories.length > 1 ? categories[1] : 'Main', price: 0, name: '' });
      setIsManageModalOpen(true);
  };

  const handleAdminEditClick = (item: MenuItem, e: React.MouseEvent) => {
      e.stopPropagation();
      setManageItem({ ...item });
      setIsManageModalOpen(true);
  };

  const handleAdminDeleteClick = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm("Are you sure you want to remove this item from the menu?")) {
          if (onUpdateMenu) {
              onUpdateMenu(prev => prev.filter(i => i.id !== id));
          }
      }
  };

  const handleAdminSaveItem = () => {
      if(!manageItem.name || !manageItem.price || !onUpdateMenu) return;

      const itemToSave: MenuItem = {
          id: manageItem.id || Date.now().toString(),
          name: manageItem.name,
          price: Number(manageItem.price),
          category: manageItem.category || 'Main',
          description: manageItem.description
      };

      onUpdateMenu(prev => {
          const index = prev.findIndex(i => i.id === itemToSave.id);
          if (index > -1) {
              // Edit existing
              const newArr = [...prev];
              newArr[index] = itemToSave;
              return newArr;
          } else {
              // Add new
              return [...prev, itemToSave];
          }
      });
      setIsManageModalOpen(false);
  };

  return (
    <div className="h-full flex gap-6 p-6 relative">
      {/* Checkout Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-bounce-in flex flex-col max-h-[90vh]">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><Receipt size={20} className="text-indigo-600"/> Bill Receipt</h3>
                    <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 font-mono text-sm">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Cénit Restaurant</h2>
                        <p className="text-slate-500">Kathmandu, Nepal</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date().toLocaleString()}</p>
                    </div>

                    <div className="border-t border-b border-dashed border-slate-300 py-4 space-y-2 mb-4">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between">
                                <span>{item.qty}x {item.name}</span>
                                <span>{(item.price * item.qty).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Tax (13%)</span>
                            <span>{tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t border-slate-100 mt-2">
                            <span>Total</span>
                            <span>{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 flex justify-center items-center gap-2">
                        <Printer size={18} /> Print
                    </button>
                    <button 
                        onClick={handleConfirmPayment}
                        className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex justify-center items-center gap-2"
                    >
                        <CheckCircle size={18} /> Send to Kitchen
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Admin Item Management Modal */}
      {isManageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-bounce-in">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-xl font-bold text-slate-900">{manageItem.id ? 'Edit Item' : 'Add New Item'}</h3>
                      <button onClick={() => setIsManageModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Item Name</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={manageItem.name} 
                            onChange={e => setManageItem({...manageItem, name: e.target.value})} 
                            placeholder="e.g. Spicy Wings"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                              <select 
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                                value={manageItem.category} 
                                onChange={e => setManageItem({...manageItem, category: e.target.value})}
                              >
                                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Price (Rs.)</label>
                              <input 
                                type="number" 
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                                value={manageItem.price} 
                                onChange={e => setManageItem({...manageItem, price: Number(e.target.value)})} 
                              />
                          </div>
                      </div>
                  </div>
                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setIsManageModalOpen(false)} className="px-6 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white">Cancel</button>
                      <button onClick={handleAdminSaveItem} className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-2">
                          <Save size={18} /> Save Item
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Menu Area */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex gap-4 overflow-x-auto pb-2">
            {categories.map(cat => (
                <button 
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        category === cat 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2">
            {/* Admin Add Button */}
            {currentUser?.role === 'ADMIN' && onUpdateMenu && (
                <button 
                    onClick={handleAdminAddClick}
                    className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 transition-all h-40 group animate-fade-in"
                >
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold text-sm">Add Item</span>
                </button>
            )}

            {menuItems
                .filter(item => category === 'All' || item.category === category)
                .map(item => (
                <div key={item.id} className="relative group h-40">
                    <button 
                        onClick={() => addToCart(item)}
                        className="w-full h-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-500 hover:shadow-md transition-all text-left flex flex-col justify-between"
                    >
                        <span className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors line-clamp-2">{item.name}</span>
                        <div className="flex justify-between items-end">
                            <span className="text-slate-400 text-sm">{item.category}</span>
                            <span className="font-bold text-slate-900 text-xl">Rs. {item.price}</span>
                        </div>
                    </button>
                    
                    {/* Admin Actions Overlay */}
                    {currentUser?.role === 'ADMIN' && onUpdateMenu && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handleAdminEditClick(item, e)}
                                className="p-2 bg-white text-slate-500 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-100 hover:border-indigo-200"
                                title="Edit Item"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleAdminDeleteClick(item.id, e)}
                                className="p-2 bg-white text-slate-500 hover:text-red-600 rounded-lg shadow-sm border border-slate-100 hover:border-red-200"
                                title="Delete Item"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-96 bg-white rounded-3xl shadow-xl flex flex-col border border-slate-100">
        <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <ShoppingBag className="text-indigo-600" /> Current Order
            </h2>
            
            {currentUser?.role === 'CUSTOMER' ? (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                        <span className="text-xs font-bold text-indigo-500 uppercase block mb-1">Customer Name</span>
                        <div className="font-bold text-indigo-900 flex items-center gap-2">
                             <User size={18} /> {currentUser.name}
                        </div>
                    </div>
                    <div>
                         <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Contact Number</label>
                         <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                            <Phone size={18} className="text-slate-400" />
                            <input 
                                type="text"
                                value={customerDetails.phone}
                                onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})}
                                placeholder="Enter Mobile Number"
                                className="bg-transparent text-sm font-medium w-full focus:outline-none text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                     <div>
                         <div className="flex justify-between items-center mb-1">
                             <label className="text-xs font-bold text-slate-500 uppercase">Delivery Address</label>
                             <button 
                                onClick={handleVerifyAddress}
                                disabled={isVerifying || !customerDetails.address}
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium disabled:opacity-50"
                             >
                                 {isVerifying ? 'Verifying...' : <><Map size={12} /> Verify Address</>}
                             </button>
                         </div>
                         <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                            <MapPin size={18} className="text-slate-400 mt-0.5" />
                            <textarea 
                                value={customerDetails.address}
                                onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})}
                                placeholder="Enter full delivery address"
                                className="bg-transparent text-sm font-medium w-full focus:outline-none text-slate-900 placeholder:text-slate-400 resize-none min-h-[60px]"
                            />
                        </div>
                        {verificationResult && (
                             <div className="mt-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-xs">
                                 <p className="text-indigo-900 mb-1">{verificationResult.text}</p>
                                 {verificationResult.mapUri && (
                                     <a 
                                        href={verificationResult.mapUri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-indigo-600 font-bold hover:underline flex items-center gap-1 mt-1"
                                     >
                                         <ExternalLink size={12} /> View on Google Maps
                                     </a>
                                 )}
                             </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Table Assignment</label>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm text-slate-400">
                            <LayoutGrid size={20} />
                        </div>
                        <input 
                            type="text" 
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Table #"
                        />
                    </div>
                </div>
            )}
            
            <p className="text-slate-400 text-xs mt-4 flex justify-between">
                <span>Order ID: #2034</span>
                <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <ShoppingBag size={48} className="mb-4 opacity-20" />
                    <p>No items added</p>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{item.name}</h4>
                            <p className="text-slate-500 text-sm">Rs. {item.price * item.qty}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                                <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-slate-100 rounded"><Minus size={14} /></button>
                                <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-slate-100 rounded"><Plus size={14} /></button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="p-6 bg-slate-50 rounded-b-3xl space-y-4">
            <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>Rs. {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
                <span>Tax (13%)</span>
                <span>Rs. {(total * 0.13).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-slate-900 pt-4 border-t border-slate-200">
                <span>Total</span>
                <span>Rs. {(total * 1.13).toFixed(2)}</span>
            </div>
            
            <button 
                onClick={handleCheckoutClick}
                disabled={cart.length === 0}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <CreditCard size={20} /> Checkout {currentUser?.role !== 'CUSTOMER' && `(Table ${tableNumber})`}
            </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
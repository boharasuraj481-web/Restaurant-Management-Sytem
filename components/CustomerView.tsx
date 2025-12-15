import React, { useState, useEffect } from 'react';
import { MenuItem, Order } from '../types';
import { ShoppingBag, Utensils, Wine, Cake, Plus, Minus, X, User, Phone, MapPin, CheckCircle, ArrowRight, Map, ExternalLink } from 'lucide-react';
import { verifyAddress } from '../services/geminiService';
import { db } from '../services/db';

interface CustomerViewProps {
  menuItems: MenuItem[];
  onExit: () => void;
}

interface CartItem extends MenuItem {
  qty: number;
}

const CustomerView: React.FC<CustomerViewProps> = ({ menuItems, onExit }) => {
  const [categories, setCategories] = useState<{name: string, icon: any}[]>([]);
  const [category, setCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStep, setOrderStep] = useState<'CART' | 'DETAILS' | 'SUCCESS'>('CART');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    address: ''
  });
  
  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{text: string, mapUri?: string} | null>(null);

  useEffect(() => {
    // Map known categories to icons, fallback to Utensils for unknown/custom
    const fetchedCats = db.menu.getCategories();
    const mapped = fetchedCats.map(cat => {
        let icon = Utensils;
        if (cat === 'Drink' || cat === 'Beverage') icon = Wine;
        if (cat === 'Dessert') icon = Cake;
        if (cat === 'Starter') icon = Utensils;
        return { name: cat, icon };
    });
    setCategories([{ name: 'All', icon: ShoppingBag }, ...mapped]);
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        return { ...i, qty: Math.max(0, i.qty + delta) };
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const handleCheckout = () => {
    setOrderStep('DETAILS');
  };

  const handlePlaceOrder = () => {
    // Save to DB
    const tax = total * 0.13;
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
        total: total + tax,
        timestamp: new Date().toISOString(),
        status: 'pending', // Online orders usually pending initially
        method: 'Online',
        customerDetails: {
            name: customerDetails.name,
            phone: customerDetails.phone,
            address: customerDetails.address
        }
    };
    db.orders.add(newOrder);

    // Show Success UI
    setOrderStep('SUCCESS');
    setTimeout(() => {
        setCart([]);
        setOrderStep('CART');
        setIsCartOpen(false);
        setCustomerDetails({ name: '', phone: '', address: '' });
        setVerificationResult(null);
    }, 3000);
  };

  const handleVerifyAddress = async () => {
      if (!customerDetails.address) return;
      setIsVerifying(true);
      setVerificationResult(null);
      
      // Get current geolocation to help verification
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

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden relative font-sans">
      {/* Header */}
      <div className="bg-indigo-600 p-4 shadow-lg z-10 shrink-0 safe-top">
        <div className="flex justify-between items-center mb-4">
           <h1 className="text-xl font-bold text-white tracking-tight">Cénit Menu</h1>
           <button onClick={onExit} className="text-indigo-100 hover:text-white text-xs bg-indigo-700/50 px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors">Exit</button>
        </div>
        
        {/* Categories - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setCategory(cat.name)}
              className={`flex flex-col items-center justify-center gap-1.5 min-w-[72px] p-2 rounded-xl transition-all active:scale-95 ${
                category === cat.name 
                  ? 'bg-white text-indigo-600 shadow-md transform scale-100' 
                  : 'bg-indigo-700/40 text-indigo-100 hover:bg-indigo-700/60'
              }`}
            >
              <cat.icon size={20} className={category === cat.name ? "stroke-2" : "stroke-1.5"} />
              <span className="text-[10px] font-bold uppercase tracking-wide leading-none">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 md:pb-24 overscroll-y-contain">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {menuItems
            .filter(item => category === 'All' || item.category === category)
            .map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-4 hover:shadow-md transition-shadow active:bg-slate-50">
                <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0 self-center">
                  <Utensils size={24} />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">{item.name}</h3>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">Delicious {item.category.toLowerCase()} prepared fresh.</p>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="font-bold text-indigo-600 text-base">Rs. {item.price}</span>
                    <button 
                        onClick={() => addToCart(item)}
                        className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-indigo-100 transition-colors active:scale-95 active:bg-indigo-200"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {menuItems.filter(item => category === 'All' || item.category === category).length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                    <p>No items found in this category.</p>
                </div>
            )}
        </div>
      </div>

      {/* Cart Float Button */}
      {cart.length > 0 && !isCartOpen && (
        <div className="absolute bottom-6 left-4 right-4 z-20 md:w-96 md:left-auto md:right-6">
            <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center animate-bounce-in active:scale-[0.98] transition-transform ring-4 ring-white/20"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {cart.reduce((a, b) => a + b.qty, 0)}
                    </div>
                    <span className="font-medium text-sm">View your order</span>
                </div>
                <span className="font-bold text-lg">Rs. {total.toLocaleString()}</span>
            </button>
        </div>
      )}

      {/* Cart Overlay - Fixed to ensure it sits on top of everything nicely on mobile */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end font-sans">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
            <div className="relative w-full md:w-[480px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-up md:animate-slide-in-right">
                
                {/* Cart Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ShoppingBag className="text-indigo-600" size={20} /> 
                        {orderStep === 'CART' ? 'Your Cart' : orderStep === 'DETAILS' ? 'Checkout' : 'Order Status'}
                    </h2>
                    <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Cart Content */}
                <div className="flex-1 overflow-y-auto p-4 overscroll-y-contain">
                    {orderStep === 'CART' && (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex gap-3 items-center bg-slate-50/50 p-2 rounded-xl">
                                    <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100 shadow-sm">
                                        <Utensils size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 truncate text-sm">{item.name}</h4>
                                        <p className="text-indigo-600 font-bold text-sm">Rs. {item.price * item.qty}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-100 shadow-sm">
                                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-md transition-all text-slate-600 active:bg-slate-100"><Minus size={14} /></button>
                                        <span className="font-bold w-6 text-center text-sm">{item.qty}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-md transition-all text-slate-600 active:bg-slate-100"><Plus size={14} /></button>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                    <ShoppingBag size={40} className="mb-2 opacity-50" />
                                    <p className="text-sm">Your cart is empty</p>
                                </div>
                            )}
                        </div>
                    )}

                    {orderStep === 'DETAILS' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-1">Total Amount</h3>
                                <p className="text-3xl font-bold text-indigo-600">Rs. {total.toLocaleString()}</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            value={customerDetails.name}
                                            onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="tel" 
                                            value={customerDetails.phone}
                                            onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                                            placeholder="Mobile number"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Delivery Address</label>
                                        <button 
                                            onClick={handleVerifyAddress}
                                            disabled={isVerifying || !customerDetails.address}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium disabled:opacity-50"
                                        >
                                            {isVerifying ? 'Verifying...' : <><Map size={12} /> Verify Address</>}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <textarea 
                                            value={customerDetails.address}
                                            onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] text-base resize-none"
                                            placeholder="Delivery location details..."
                                        />
                                    </div>
                                    {verificationResult && (
                                         <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-sm">
                                             <p className="text-indigo-900 mb-1">{verificationResult.text}</p>
                                             {verificationResult.mapUri && (
                                                 <a 
                                                    href={verificationResult.mapUri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-indigo-600 font-bold hover:underline flex items-center gap-1 mt-1"
                                                 >
                                                     <ExternalLink size={14} /> View on Google Maps
                                                 </a>
                                             )}
                                         </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {orderStep === 'SUCCESS' && (
                        <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in pb-12">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-sm">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h3>
                            <p className="text-slate-500 text-base px-6">
                                Thanks {customerDetails.name.split(' ')[0]}!<br/>
                                We've sent a confirmation to<br/>
                                <span className="font-bold text-slate-900">{customerDetails.phone}</span>
                            </p>
                            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 w-full max-w-xs">
                                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Estimated Delivery</p>
                                <p className="text-xl font-bold text-slate-800">30 - 45 mins</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Footer */}
                {orderStep !== 'SUCCESS' && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 safe-bottom">
                        {orderStep === 'CART' ? (
                            <button 
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                Checkout • Rs. {total.toLocaleString()} <ArrowRight size={18} />
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setOrderStep('CART')}
                                    className="px-5 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors active:scale-95"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={handlePlaceOrder}
                                    disabled={!customerDetails.name || !customerDetails.phone || !customerDetails.address}
                                    className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                                >
                                    Place Order <CheckCircle size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;
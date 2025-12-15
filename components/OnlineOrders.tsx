import React, { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, ChefHat, Truck, Package, XCircle, AlertCircle, Phone, Sparkles } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { db } from '../services/db';
import { generateInsights } from '../services/geminiService';

const OnlineOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryEstimation, setDeliveryEstimation] = useState<{id: string, text: string} | null>(null);

  useEffect(() => {
    // Initial Load
    refreshOrders();
    // Poll every 10 seconds for new online orders
    const interval = setInterval(refreshOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const refreshOrders = () => {
    const all = db.orders.getAll();
    // Filter only active online orders (excluding completed ones that are old, maybe keep today's delivered)
    const active = all.filter(o => o.method === 'Online' && o.status !== 'cancelled').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setOrders(active);
  };

  const updateStatus = (orderId: string, newStatus: OrderStatus) => {
    const all = db.orders.getAll();
    const updated = all.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    db.orders.save(updated);
    refreshOrders();
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 border-amber-200';
      case 'preparing': return 'bg-blue-50 border-blue-200';
      case 'ready': return 'bg-indigo-50 border-indigo-200';
      case 'out_for_delivery': return 'bg-purple-50 border-purple-200';
      case 'delivered': return 'bg-green-50 border-green-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const estimateDelivery = async (order: Order) => {
      setDeliveryEstimation({ id: order.id, text: "Calculating..." });
      const address = order.customerDetails?.address || "Unknown";
      const items = order.items.map(i => i.name).join(', ');
      
      const prompt = `Estimate delivery time for:
      Address: ${address}
      Items: ${items} (Prep time considerations)
      Traffic: Moderate
      Return just the time estimate (e.g. "35-45 mins").`;
      
      const result = await generateInsights(prompt);
      setDeliveryEstimation({ id: order.id, text: result });
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const elapsedMins = Math.floor((Date.now() - new Date(order.timestamp).getTime()) / 60000);
    
    return (
      <div className={`p-4 rounded-xl border-2 mb-4 shadow-sm transition-all hover:shadow-md ${getStatusColor(order.status)}`}>
        <div className="flex justify-between items-start mb-2">
            <div>
                <h4 className="font-bold text-slate-900">{order.customerDetails?.name}</h4>
                <p className="text-xs text-slate-500 font-mono">#{order.id.slice(-6)}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-white/50 px-2 py-1 rounded-lg">
                <Clock size={12} /> {elapsedMins}m ago
            </div>
        </div>

        <div className="mb-3 space-y-1">
            {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm text-slate-700">
                    <span>{item.qty}x {item.name}</span>
                </div>
            ))}
        </div>

        <div className="bg-white/60 p-2 rounded-lg mb-3">
             <div className="flex items-start gap-2 text-xs text-slate-600 mb-1">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span className="line-clamp-2">{order.customerDetails?.address}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone size={14} />
                <span>{order.customerDetails?.phone}</span>
            </div>
             {deliveryEstimation?.id === order.id ? (
                 <div className="mt-2 text-xs font-bold text-indigo-600 flex items-center gap-1 animate-fade-in">
                     <Sparkles size={12} /> Est: {deliveryEstimation.text}
                 </div>
             ) : (
                 order.status === 'pending' && (
                    <button onClick={() => estimateDelivery(order)} className="mt-2 text-[10px] text-indigo-500 hover:text-indigo-700 underline decoration-dashed">
                        Est. Time (AI)
                    </button>
                 )
             )}
        </div>

        <div className="flex gap-2 mt-2">
            {order.status === 'pending' && (
                <>
                    <button 
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 flex justify-center items-center gap-1"
                    >
                        <ChefHat size={14} /> Accept
                    </button>
                    <button 
                         onClick={() => updateStatus(order.id, 'cancelled')}
                         className="px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:text-red-500"
                    >
                        <XCircle size={16} />
                    </button>
                </>
            )}
            {order.status === 'preparing' && (
                <button 
                    onClick={() => updateStatus(order.id, 'ready')}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 flex justify-center items-center gap-1"
                >
                    <Package size={14} /> Ready
                </button>
            )}
            {order.status === 'ready' && (
                <button 
                    onClick={() => updateStatus(order.id, 'out_for_delivery')}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-purple-700 flex justify-center items-center gap-1"
                >
                    <Truck size={14} /> Dispatch
                </button>
            )}
             {order.status === 'out_for_delivery' && (
                <button 
                    onClick={() => updateStatus(order.id, 'delivered')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 flex justify-center items-center gap-1"
                >
                    <CheckCircle size={14} /> Complete
                </button>
            )}
             {order.status === 'delivered' && (
                <div className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1">
                    <CheckCircle size={14} /> Delivered
                </div>
            )}
        </div>
      </div>
    );
  };

  const columns = [
      { id: 'pending', label: 'Incoming', icon: AlertCircle, color: 'text-amber-500' },
      { id: 'preparing', label: 'Kitchen', icon: ChefHat, color: 'text-blue-500' },
      { id: 'ready', label: 'Ready / Dispatch', icon: Truck, color: 'text-purple-500' }, // Merging ready/out for delivery visually in logic or separate? Let's verify.
      { id: 'delivered', label: 'Completed', icon: CheckCircle, color: 'text-green-500' }
  ];

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Online Orders</h1>
          <p className="text-slate-500 mt-1">Manage delivery lifecycle and logistics</p>
        </div>
        <div className="flex gap-3">
             <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium">
                 Active Orders: <span className="text-indigo-600 font-bold">{orders.filter(o => o.status !== 'delivered').length}</span>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-[1000px]">
            {/* Custom Column Logic needed because statuses map to columns differently */}
            
            {/* Column 1: Incoming */}
            <div className="flex-1 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-100 h-full">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><AlertCircle size={18}/></div>
                    <span className="font-bold text-slate-700">Incoming</span>
                    <span className="ml-auto bg-slate-200 px-2 py-0.5 rounded-full text-xs font-bold text-slate-600">{orders.filter(o => o.status === 'pending').length}</span>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                    {orders.filter(o => o.status === 'pending').map(o => <OrderCard key={o.id} order={o} />)}
                    {orders.filter(o => o.status === 'pending').length === 0 && <div className="text-center text-slate-400 text-sm mt-10">No pending orders</div>}
                </div>
            </div>

            {/* Column 2: Kitchen */}
            <div className="flex-1 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-100 h-full">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ChefHat size={18}/></div>
                    <span className="font-bold text-slate-700">Kitchen</span>
                     <span className="ml-auto bg-slate-200 px-2 py-0.5 rounded-full text-xs font-bold text-slate-600">{orders.filter(o => o.status === 'preparing').length}</span>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                     {orders.filter(o => o.status === 'preparing').map(o => <OrderCard key={o.id} order={o} />)}
                </div>
            </div>

            {/* Column 3: Logistics (Ready + Out) */}
            <div className="flex-1 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-100 h-full">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Truck size={18}/></div>
                    <span className="font-bold text-slate-700">Logistics</span>
                     <span className="ml-auto bg-slate-200 px-2 py-0.5 rounded-full text-xs font-bold text-slate-600">{orders.filter(o => o.status === 'ready' || o.status === 'out_for_delivery').length}</span>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                     {orders.filter(o => o.status === 'ready' || o.status === 'out_for_delivery').map(o => <OrderCard key={o.id} order={o} />)}
                </div>
            </div>

             {/* Column 4: Delivered */}
             <div className="flex-1 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-100 h-full">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={18}/></div>
                    <span className="font-bold text-slate-700">Delivered</span>
                    <span className="ml-auto bg-slate-200 px-2 py-0.5 rounded-full text-xs font-bold text-slate-600">{orders.filter(o => o.status === 'delivered').length}</span>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                     {orders.filter(o => o.status === 'delivered').map(o => <OrderCard key={o.id} order={o} />)}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default OnlineOrders;
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, ChefHat, Timer, Flame, Bell } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { db } from '../services/db';

const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    refreshOrders();
    const interval = setInterval(() => {
        refreshOrders();
        setCurrentTime(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshOrders = () => {
    const all = db.orders.getAll();
    // Filter for active kitchen orders (pending, preparing)
    // We also show 'ready' briefly or keep them in a separate column
    const kitchenOrders = all.filter(o => 
        o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
    ).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // FIFO
    setOrders(kitchenOrders);
  };

  const updateStatus = (orderId: string, newStatus: OrderStatus) => {
    const all = db.orders.getAll();
    const updated = all.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    db.orders.save(updated);
    refreshOrders();
  };

  const getElapsedTime = (isoString: string) => {
      const diff = Math.floor((currentTime.getTime() - new Date(isoString).getTime()) / 60000);
      return diff;
  };

  const TicketCard = ({ order }: { order: Order }) => {
    const elapsed = getElapsedTime(order.timestamp);
    const isLate = elapsed > 20; // 20 mins threshold
    const isUrgent = elapsed > 30;

    return (
        <div className={`flex flex-col rounded-xl border-2 overflow-hidden shadow-sm transition-all animate-bounce-in ${
            order.status === 'ready' ? 'bg-green-50 border-green-200 opacity-80' : 
            order.status === 'preparing' ? 'bg-white border-blue-400 shadow-md transform scale-105 z-10' :
            'bg-white border-slate-200'
        }`}>
            {/* Ticket Header */}
            <div className={`p-3 flex justify-between items-center text-white ${
                order.status === 'ready' ? 'bg-green-600' :
                isUrgent ? 'bg-red-600 animate-pulse' :
                isLate ? 'bg-amber-500' :
                order.status === 'preparing' ? 'bg-blue-600' :
                'bg-slate-700'
            }`}>
                <div className="font-bold text-lg">
                    {order.table ? `Table ${order.table}` : order.customerDetails?.name || 'Online Order'}
                </div>
                <div className="flex items-center gap-1 font-mono text-sm">
                    <Timer size={16} /> {elapsed}m
                </div>
            </div>

            {/* Order Items */}
            <div className="p-4 flex-1 space-y-3 bg-white">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                        <span className="font-bold text-xl text-slate-800">{item.qty}x</span>
                        <span className="flex-1 ml-3 text-lg font-medium text-slate-700 leading-tight">{item.name}</span>
                    </div>
                ))}
            </div>

            {/* Footer Action */}
            <div className="p-3 bg-slate-50 border-t border-slate-100">
                {order.status === 'pending' && (
                    <button 
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Flame size={20} /> Start Prep
                    </button>
                )}
                {order.status === 'preparing' && (
                    <button 
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Bell size={20} /> Ready
                    </button>
                )}
                {order.status === 'ready' && (
                    <button 
                        onClick={() => updateStatus(order.id, 'delivered')} // Or clear from KDS
                        className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={20} /> Clear
                    </button>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
             <div className="p-3 bg-slate-800 text-white rounded-xl">
                <ChefHat size={32} />
             </div>
             <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kitchen Display System</h1>
                <p className="text-slate-500 font-medium">Live Order Management</p>
             </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 px-3">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="font-bold text-slate-600">Preparing: {orders.filter(o => o.status === 'preparing').length}</span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-2 px-3">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <span className="font-bold text-slate-600">Pending: {orders.filter(o => o.status === 'pending').length}</span>
            </div>
             <div className="w-px h-6 bg-slate-200"></div>
            <div className="font-mono text-xl font-bold text-slate-800 px-2">
                {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {orders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                <ChefHat size={120} className="mb-6" />
                <h2 className="text-3xl font-bold">All caught up!</h2>
                <p className="text-xl">Waiting for new orders...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Preparing Orders First */}
                {orders.filter(o => o.status === 'preparing').map(order => (
                    <TicketCard key={order.id} order={order} />
                ))}
                
                {/* Then Pending Orders */}
                {orders.filter(o => o.status === 'pending').map(order => (
                    <TicketCard key={order.id} order={order} />
                ))}

                 {/* Then Ready Orders (Bottom priority visual, maybe separate section ideally but grid is fine for simple KDS) */}
                 {orders.filter(o => o.status === 'ready').map(order => (
                    <TicketCard key={order.id} order={order} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;
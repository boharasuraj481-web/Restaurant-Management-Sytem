import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Booking } from '../types';
import { db } from '../services/db';

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isAllocating, setIsAllocating] = useState(false);

  useEffect(() => {
    setBookings(db.bookings.getAll());
  }, []);

  const saveBookings = (newBookings: Booking[]) => {
    setBookings(newBookings);
    db.bookings.save(newBookings);
  };

  const handleAutoAllocate = () => {
    setIsAllocating(true);
    // Simulate AI thinking time
    setTimeout(() => {
      const updated = bookings.map((b, i) => ({
        ...b,
        table: b.table || `T${i + 10}`,
        status: b.status === 'pending' ? 'confirmed' : b.status
      } as Booking));
      saveBookings(updated);
      setIsAllocating(false);
    }, 1500);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Bookings</h1>
            <p className="text-slate-500">Smart calendar & table management</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleAutoAllocate}
            disabled={isAllocating}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-purple-200 disabled:opacity-70"
          >
            <Sparkles size={18} className={isAllocating ? "animate-spin" : ""} />
            {isAllocating ? "Optimizing..." : "Smart Allocate"}
          </button>
          <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-lg">
            <Plus size={18} />
            New Booking
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search bookings..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
            <option>All Statuses</option>
            <option>Confirmed</option>
            <option>Pending</option>
          </select>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
            <div className="grid grid-cols-1 gap-3">
                {bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                {booking.time}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{booking.customerName}</h3>
                                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                    <span className="flex items-center gap-1"><User size={14} /> {booking.guests} guests</span>
                                    {booking.table && <span className="flex items-center gap-1 font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Table {booking.table}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex gap-2">
                                {booking.tags.map(tag => (
                                    <span key={tag} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{tag}</span>
                                ))}
                            </div>
                            
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                  booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                  booking.status === 'seated' ? 'bg-indigo-100 text-indigo-700' :
                                  'bg-slate-100 text-slate-500'}`}>
                                {booking.status}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
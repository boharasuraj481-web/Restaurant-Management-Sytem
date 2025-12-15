import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Sparkles, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { generateInsights } from '../services/geminiService';

const data = [
  { name: '12pm', sales: 4000, visitors: 24 },
  { name: '2pm', sales: 3000, visitors: 18 },
  { name: '4pm', sales: 2000, visitors: 12 },
  { name: '6pm', sales: 12000, visitors: 65 },
  { name: '8pm', sales: 18000, visitors: 85 },
  { name: '10pm', sales: 14000, visitors: 55 },
  { name: '12am', sales: 6000, visitors: 30 },
];

const StatCard = ({ icon: Icon, label, value, trend, trendUp }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${trendUp ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
        <Icon size={24} />
      </div>
      <span className={`text-sm font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {trend}
      </span>
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{label}</h3>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [insight, setInsight] = useState<string>("Loading AI prediction...");

  useEffect(() => {
    const fetchInsight = async () => {
      const context = "Current Time: 7:30 PM. Occupancy: 85%. Waitlist: 4 parties. Trending Menu Item: Truffle Pasta. Inventory Alert: Red Wine low.";
      const aiResponse = await generateInsights(context);
      setInsight(aiResponse);
    };
    fetchInsight();
  }, []);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time overview & performance metrics</p>
        </div>
        <div className="bg-indigo-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-200">
            <Clock size={18} />
            <span className="font-mono">19:32 PM</span>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} className="text-yellow-300" />
                <h3 className="font-semibold text-indigo-100 uppercase tracking-wider text-xs">Cénit AI Insight</h3>
            </div>
            <p className="text-lg font-medium leading-relaxed max-w-3xl">
                {insight}
            </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={DollarSign} label="Total Revenue (Today)" value="Rs. 42,890" trend="+12.5%" trendUp={true} />
        <StatCard icon={Users} label="Total Guests" value="142" trend="+8.2%" trendUp={true} />
        <StatCard icon={TrendingUp} label="Avg. Table Turn" value="52m" trend="-4.1%" trendUp={false} />
        <StatCard icon={Clock} label="Waitlist Time" value="15m" trend="+2m" trendUp={false} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    formatter={(value: any) => [`Rs. ${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Occupancy by Hour</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="visitors" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, Star, Send, X, MessageSquareQuote } from 'lucide-react';
import { Customer } from '../types';
import { generateMarketingCampaign } from '../services/geminiService';
import { db } from '../services/db';

const CRM: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [marketingDraft, setMarketingDraft] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    setCustomers(db.customers.getAll());
  }, []);

  const handleGenerateCampaign = async (customer: Customer) => {
    setLoadingAI(true);
    const draft = await generateMarketingCampaign(customer.segment, `Name: ${customer.name}, Likes: ${customer.preferences.join(', ')}`);
    setMarketingDraft(draft);
    setLoadingAI(false);
  };

  return (
    <div className="p-8 h-full flex gap-8">
      {/* List */}
      <div className="flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Customers</h1>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-4 text-sm font-semibold text-slate-500">Name</th>
                        <th className="p-4 text-sm font-semibold text-slate-500">Segment</th>
                        <th className="p-4 text-sm font-semibold text-slate-500">Visits</th>
                        <th className="p-4 text-sm font-semibold text-slate-500">Total Spent</th>
                        <th className="p-4 text-sm font-semibold text-slate-500"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {customers.map(customer => (
                        <tr 
                            key={customer.id} 
                            onClick={() => setSelectedCustomer(customer)}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            <td className="p-4">
                                <div className="font-medium text-slate-900">{customer.name}</div>
                                <div className="text-sm text-slate-400">{customer.email}</div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    customer.segment === 'VIP' ? 'bg-purple-100 text-purple-700' :
                                    customer.segment === 'New' ? 'bg-green-100 text-green-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {customer.segment}
                                </span>
                            </td>
                            <td className="p-4 text-slate-600">{customer.visits}</td>
                            <td className="p-4 text-slate-600">Rs. {customer.totalSpent}</td>
                            <td className="p-4 text-right text-slate-400"><Star size={16} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedCustomer && (
        <div className="w-96 bg-white border-l border-slate-200 shadow-xl fixed right-0 top-0 h-full p-8 overflow-y-auto animate-slide-in-right z-30">
            <button onClick={() => setSelectedCustomer(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
            
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto flex items-center justify-center text-indigo-600 font-bold text-2xl mb-4">
                    {selectedCustomer.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedCustomer.name}</h2>
                <p className="text-slate-500">{selectedCustomer.segment} Customer</p>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Info</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-600">
                            <Mail size={18} /> {selectedCustomer.email}
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <Phone size={18} /> {selectedCustomer.phone}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Preferences</h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedCustomer.preferences.map(pref => (
                            <span key={pref} className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-600">
                                {pref}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <MessageSquareQuote size={18} className="text-indigo-600" />
                        AI Marketing Assistant
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Generate personalized outreach for {selectedCustomer.name}</p>
                    
                    {!marketingDraft ? (
                        <button 
                            onClick={() => handleGenerateCampaign(selectedCustomer)}
                            disabled={loadingAI}
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex justify-center items-center gap-2"
                        >
                            {loadingAI ? 'Generating...' : 'Generate Email Draft'}
                        </button>
                    ) : (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap italic mb-4">"{marketingDraft}"</p>
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                                    <Send size={12} /> Send
                                </button>
                                <button onClick={() => setMarketingDraft('')} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-500">
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CRM;
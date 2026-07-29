import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { API_BASE_URL } from '../services/apiBase';
import { Calendar, RefreshCcw, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export default function Transactions() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'cancelled'>('all');
  const [dateRange, setDateRange] = useState('All Time');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBookings = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/all`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const isDateInRange = (dateString: string, range: string) => {
    if (range === 'All Time') return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0,0,0,0);
    date.setHours(0,0,0,0);

    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (range === 'Today') return diffDays === 0;
    if (range === 'Last 7 Days') return diffDays <= 7;
    if (range === 'Last 30 Days') return diffDays <= 30;
    if (range === 'This Year') return date.getFullYear() === today.getFullYear();
    return true;
  };

  const filteredBookings = bookings.filter(b => {
    // Search filter
    const searchMatch = b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        b.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (searchQuery && !searchMatch) return false;

    // Date filter
    if (!isDateInRange(b.booking_date || b.appointment_date, dateRange)) return false;

    // Tab filter
    if (activeTab === 'upcoming') {
      const bDate = new Date(b.booking_date || b.appointment_date);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (bDate < today || b.booking_status === 'cancelled') return false;
    }
    if (activeTab === 'cancelled' && b.booking_status !== 'cancelled') return false;

    return true;
  });

  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-indigo-600 animate-spin" />
            <p className="text-stone-500 font-medium animate-pulse">Loading transactions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6 pb-10"
      >
        <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-1 flex items-center gap-3">
              Transactions
              <button 
                onClick={fetchBookings}
                className={`p-1.5 rounded-full hover:bg-stone-100 transition-all ${refreshing ? 'animate-spin text-indigo-500' : 'text-stone-400'}`}
                title="Refresh Data"
              >
                <RefreshCcw size={18} />
              </button>
            </h1>
            <p className="text-stone-500">View and manage all platform bookings.</p>
          </div>
        </motion.div>

        <motion.div variants={itemVars}>
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-100 pb-4 gap-4">
              <div className="flex bg-stone-100/80 p-1 rounded-xl">
                {[
                  { id: 'all', label: 'All Bookings' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'cancelled', label: 'Cancelled' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id 
                        ? 'bg-white text-stone-900 shadow-sm' 
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search customer, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-sm w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white/50"
                  />
                </div>

                <div className="relative">
                  <Button 
                    onClick={() => setShowDateDropdown(!showDateDropdown)} 
                    variant="outline" 
                    className="gap-2 text-stone-600 bg-white/50 backdrop-blur-xl border-stone-200/60 w-[150px] justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Filter size={16} />
                      {dateRange}
                    </div>
                  </Button>
                  {showDateDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowDateDropdown(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-stone-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                        {['All Time', 'Today', 'Last 7 Days', 'Last 30 Days', 'This Year'].map(range => (
                          <button 
                            key={range}
                            onClick={() => { setDateRange(range); setShowDateDropdown(false); }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                              dateRange === range 
                                ? 'bg-indigo-50 text-indigo-700 font-medium' 
                                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                            }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-100">
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Booking Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Slot Time</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-sm text-stone-900 font-medium">
                            {b.booking_date || b.appointment_date ? new Date(b.booking_date || b.appointment_date).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="text-xs text-stone-400 font-mono mt-0.5">#{b.id?.substring(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-stone-900 font-medium">
                            {b.booking_time || b.appointment_time || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {b.customer_name?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-stone-900">{b.customer_name}</div>
                              <div className="text-xs text-stone-500">{b.customer_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-stone-800 font-medium">{b.hairstyle || b.service_name || "Service"}</div>
                          <div className="text-xs text-stone-500 mt-0.5">{b.stylist || 'Stylist'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-stone-900">
                            ${Number(b.total_price || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={b.booking_status === 'confirmed' ? 'success' : b.booking_status === 'cancelled' ? 'destructive' : 'warning'}>
                            {b.booking_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && !loading && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                          No bookings found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { API_BASE_URL } from '../services/apiBase';
import { TrendingUp, Users, Store, DollarSign, Calendar, ChevronRight, Activity } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

// Animated Number Component
function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { bounce: 0, duration: 2000 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export default function Dashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, salonsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/bookings/all`),
          fetch(`${API_BASE_URL}/salons`)
        ]);
        
        const bData = await bookingsRes.json();
        const sData = await salonsRes.json();

        if (bData.success) setBookings(bData.data || []);
        if (sData.success) setSalons(sData.data || []);
      } catch (err) {
        console.error("Failed to fetch global stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  // Filter Chart Data based on Date Range
  let sliceCount = 30;
  if (dateRange === 'Today') sliceCount = 1;
  else if (dateRange === 'Last 7 Days') sliceCount = 7;
  else if (dateRange === 'Last 30 Days') sliceCount = 30;
  else if (dateRange === 'This Year') sliceCount = 365;

  const chartData = bookings.reduce((acc: any, b: any) => {
    const date = new Date(b.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find((item: any) => item.name === date);
    if (existing) {
      existing.Revenue += Number(b.total_price || 0);
      existing.Bookings += 1;
    } else {
      acc.push({ name: date, Revenue: Number(b.total_price || 0), Bookings: 1 });
    }
    return acc;
  }, []).slice(-sliceCount);

  const handleDownloadReport = () => {
    const headers = ['Date,Revenue,Bookings'];
    const rows = chartData.map((row: any) => `${row.name},${row.Revenue},${row.Bookings}`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `glowup_report_${dateRange.replace(/ /g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const serviceData = [
    { name: 'Haircut', value: 400 },
    { name: 'Coloring', value: 300 },
    { name: 'Styling', value: 300 },
    { name: 'Treatment', value: 200 },
  ];
  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'];

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
            <p className="text-stone-500 font-medium animate-pulse">Initializing workspace...</p>
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
        className="flex flex-col gap-8 pb-10"
      >
        
        {/* Header Section */}
        <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-1">Overview</h1>
            <p className="text-stone-500">Monitor your global salon network metrics.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Button 
                onClick={() => setShowDateDropdown(!showDateDropdown)} 
                variant="outline" 
                className="gap-2 text-stone-600 bg-white/50 backdrop-blur-xl border-stone-200/60 w-[160px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
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
                    {['Today', 'Last 7 Days', 'Last 30 Days', 'This Year'].map(range => (
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
            <Button 
              onClick={handleDownloadReport}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25 shadow-lg border-0 text-white"
            >
              Download Report
            </Button>
          </div>
        </motion.div>
        
        {/* KPI Cards Grid */}
        <motion.div variants={itemVars} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Card className="relative overflow-hidden group hover:border-indigo-200 transition-colors">
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-stone-900">$<AnimatedNumber value={totalRevenue} /></div>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp size={12} /> +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:border-purple-200 transition-colors">
            <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-stone-900"><AnimatedNumber value={bookings.length} /></div>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp size={12} /> +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:border-pink-200 transition-colors">
            <div className="absolute right-0 top-0 w-32 h-32 bg-pink-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">Active Salons</CardTitle>
              <Store className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-stone-900"><AnimatedNumber value={salons.length} /></div>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                Across 14 regions
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-stone-900"><AnimatedNumber value={8493} /></div>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp size={12} /> +5.2% from last week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          <motion.div variants={itemVars} className="lg:col-span-4 xl:col-span-5">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Daily revenue aggregated across all global salons.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }}
                        itemStyle={{ color: '#1f2937' }}
                      />
                      <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVars} className="lg:col-span-3 xl:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Popular Services</CardTitle>
                <CardDescription>Top booked categories this month.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {serviceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                  {serviceData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs font-medium text-stone-600">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      {s.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Global Booking Logs Table */}
        <motion.div variants={itemVars}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity size={18} className="text-indigo-500" />
                  Recent Booking Activity
                </CardTitle>
                <CardDescription className="mt-1">Latest 10 transactions across the platform.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                View All <ChevronRight size={14} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-100">
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookings.slice(0, 10).map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-sm text-stone-900 font-medium">{new Date(b.booking_date).toLocaleDateString()}</div>
                          <div className="text-xs text-stone-400 font-mono mt-0.5">#{b.id.substring(0, 8)}</div>
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
                          <div className="text-xs text-stone-500 mt-0.5">{b.booking_time}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-stone-900">
                            ${Number(b.total_price || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={b.booking_status === 'confirmed' ? 'success' : 'warning'}>
                            {b.booking_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                          No recent bookings found.
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

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { API_BASE_URL } from '../services/apiBase';
import { Plus, Edit2, Key, MapPin, Phone, User, Store, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function Salons() {
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showSalonModal, setShowSalonModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  
  // Form states
  const [editingSalonId, setEditingSalonId] = useState<string | null>(null);
  const [salonForm, setSalonForm] = useState({ 
    name: '', city: '', address: '', phone: '', admin_email: '', 
    google_maps_link: '', latitude: '', longitude: '' 
  });
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  
  // Admin form state
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });

  const [isSubmittingSalon, setIsSubmittingSalon] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/salons`);
      const data = await res.json();
      if (data.success) {
        setSalons(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddSalon = () => {
    setEditingSalonId(null);
    setSalonForm({ 
      name: '', city: '', address: '', phone: '', admin_email: '',
      google_maps_link: '', latitude: '', longitude: ''
    });
    setShowSalonModal(true);
  };

  const openEditSalon = (salon: any) => {
    setEditingSalonId(salon.id);
    setSalonForm({
      name: salon.name || '',
      city: salon.city || '',
      address: salon.address || '',
      phone: salon.phone || '',
      admin_email: salon.admin_email || '',
      google_maps_link: salon.google_maps_link || '',
      latitude: salon.latitude || '',
      longitude: salon.longitude || ''
    });
    setShowSalonModal(true);
  };

  const handleResolveLocation = async () => {
    if (!salonForm.address) return alert("Please enter an address first.");
    setIsResolvingLocation(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(salonForm.address)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setSalonForm({
          ...salonForm,
          latitude: data[0].lat,
          longitude: data[0].lon
        });
      } else {
        alert("Could not automatically find coordinates for this address.");
      }
    } catch (err) {
      console.error(err);
      alert("Error resolving address.");
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleSaveSalon = async () => {
    if (!salonForm.name) return alert('Name is required');
    if (!salonForm.city) return alert('City is required');
    setIsSubmittingSalon(true);
    try {
      const url = editingSalonId 
        ? `${API_BASE_URL}/salons/${editingSalonId}`
        : `${API_BASE_URL}/salons`;
      const method = editingSalonId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salonForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowSalonModal(false);
        fetchSalons();
      } else {
        alert(data.message || 'Failed to save salon');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving salon');
    } finally {
      setIsSubmittingSalon(false);
    }
  };

  const openCreateAdmin = (salonId: string) => {
    setSelectedSalonId(salonId);
    setAdminForm({ email: '', password: '' });
    setShowAdminModal(true);
  };

  const handleCreateAdmin = async () => {
    if (!adminForm.email || !adminForm.password) return alert('Email and password required');
    setIsSubmittingAdmin(true);
    try {
      const res = await fetch(`${API_BASE_URL}/salons/admin/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: selectedSalonId,
          email: adminForm.email,
          password: adminForm.password
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAdminModal(false);
        alert('Admin account created/updated successfully');
      } else {
        alert(data.message || 'Failed to create admin');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating admin');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

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

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-1">Manage Salons</h1>
            <p className="text-stone-500">Add, edit, or configure administrators for your global network.</p>
          </div>
          <Button onClick={openAddSalon} className="gap-2 shrink-0 bg-indigo-600 hover:bg-indigo-700">
            <Plus size={18} />
            Add New Salon
          </Button>
        </motion.div>

        {/* Salons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-stone-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : salons.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-stone-200 shadow-sm">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 mb-4">
              <Store size={32} />
            </div>
            <h3 className="text-lg font-bold text-stone-800">No salons found</h3>
            <p className="text-stone-500 text-sm mt-1">Get started by adding your first salon location.</p>
            <Button onClick={openAddSalon} variant="outline" className="mt-6">Add Salon</Button>
          </div>
        ) : (
          <motion.div 
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {salons.map(s => (
              <motion.div key={s.id} variants={itemVars}>
                <Card className="h-full hover:border-indigo-200 transition-all duration-300 group hover:shadow-lg flex flex-col">
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Store size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-stone-900 group-hover:text-indigo-900 transition-colors line-clamp-1">{s.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                            <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">ID: {s.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8 flex-1">
                      <div className="flex items-start gap-3 text-sm text-stone-600">
                        <MapPin size={16} className="text-stone-400 mt-0.5 shrink-0" />
                        <span className="leading-snug line-clamp-2">{s.address || 'No address provided'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-stone-600">
                        <Phone size={16} className="text-stone-400 shrink-0" />
                        <span>{s.phone || 'No phone provided'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-stone-600">
                        <User size={16} className="text-stone-400 shrink-0" />
                        <span className={s.admin_email ? 'text-stone-800 font-medium' : 'text-stone-400 italic'}>
                          {s.admin_email || 'No admin email assigned'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-stone-100 mt-auto">
                      <Button variant="outline" size="sm" onClick={() => openEditSalon(s)} className="flex-1 gap-2 border-stone-200 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50">
                        <Edit2 size={14} /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openCreateAdmin(s.id)} className="flex-1 gap-2 border-stone-200 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50">
                        <Key size={14} /> Admin
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Add/Edit Salon Modal */}
      <AnimatePresence>
        {showSalonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
              onClick={() => setShowSalonModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-xl relative z-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 sticky top-0 z-20">
                <h2 className="text-lg font-bold text-stone-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Store size={16} />
                  </div>
                  {editingSalonId ? 'Edit Salon' : 'Add New Salon'}
                </h2>
                <button onClick={() => setShowSalonModal(false)} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-5 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Salon Name *</label>
                    <Input 
                      value={salonForm.name} 
                      onChange={e => setSalonForm({...salonForm, name: e.target.value})} 
                      placeholder="e.g. Glowup Downtown"
                      autoFocus
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">City *</label>
                    <Input 
                      value={salonForm.city} 
                      onChange={e => setSalonForm({...salonForm, city: e.target.value})} 
                      placeholder="e.g. New York"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Address</label>
                    <Input 
                      value={salonForm.address} 
                      onChange={e => setSalonForm({...salonForm, address: e.target.value})} 
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Phone</label>
                    <Input 
                      value={salonForm.phone} 
                      onChange={e => setSalonForm({...salonForm, phone: e.target.value})} 
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Admin Email</label>
                    <Input 
                      type="email"
                      value={salonForm.admin_email} 
                      onChange={e => setSalonForm({...salonForm, admin_email: e.target.value})} 
                      placeholder="admin@salon.com"
                    />
                  </div>

                  {/* Location Info */}
                  <div className="sm:col-span-2 pt-4 border-t border-stone-100">
                    <h3 className="text-sm font-bold text-stone-800 mb-3">Map & Location</h3>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Google Maps Link</label>
                    <Input 
                      value={salonForm.google_maps_link} 
                      onChange={e => setSalonForm({...salonForm, google_maps_link: e.target.value})} 
                      placeholder="https://maps.google.com/..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Latitude</label>
                    <Input 
                      value={salonForm.latitude} 
                      onChange={e => setSalonForm({...salonForm, latitude: e.target.value})} 
                      placeholder="e.g. 40.7128"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Longitude</label>
                    <Input 
                      value={salonForm.longitude} 
                      onChange={e => setSalonForm({...salonForm, longitude: e.target.value})} 
                      placeholder="e.g. -74.0060"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleResolveLocation}
                      disabled={isResolvingLocation}
                      className="text-xs"
                    >
                      {isResolvingLocation ? "Resolving..." : "Auto-fill Coordinates"}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 pt-5 border-t border-stone-100">
                  <Button variant="outline" className="flex-1" onClick={() => setShowSalonModal(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleSaveSalon} disabled={isSubmittingSalon}>
                    {isSubmittingSalon ? "Saving..." : "Save Salon"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Account Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
              onClick={() => setShowAdminModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-sm relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <h2 className="text-lg font-bold text-stone-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Key size={16} />
                  </div>
                  Set Admin Account
                </h2>
                <button onClick={() => setShowAdminModal(false)} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-5">
                <div className="bg-purple-50 text-purple-700 text-xs font-medium p-4 rounded-2xl border border-purple-100">
                  <strong className="block mb-1 text-sm">Action Required</strong>
                  This will override any existing admin credentials for this salon.
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Email Address *</label>
                  <Input 
                    type="email"
                    value={adminForm.email} 
                    onChange={e => setAdminForm({...adminForm, email: e.target.value})} 
                    placeholder="admin@example.com"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Password *</label>
                  <Input 
                    type="password"
                    value={adminForm.password} 
                    onChange={e => setAdminForm({...adminForm, password: e.target.value})} 
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex gap-3 mt-4 pt-5 border-t border-stone-100">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAdminModal(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleCreateAdmin} disabled={isSubmittingAdmin}>
                    {isSubmittingAdmin ? "Creating..." : "Set Account"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, LogOut, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem('superadmin_user');
    localStorage.removeItem('superadmin_token');
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
    { name: 'Manage Salons', to: '/salons', icon: Store, end: false },
  ];

  return (
    <aside className="w-64 bg-white/70 backdrop-blur-xl border-r border-stone-200/50 flex flex-col h-screen sticky top-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
          <Scissors size={20} className="drop-shadow-sm" />
        </div>
        <div>
          <h2 className="m-0 text-stone-900 font-bold text-xl tracking-tight">Admin</h2>
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">Global Admin</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-2 overflow-y-auto">
        <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-3 px-3">Overview</div>
        <ul className="list-none p-0 m-0 flex flex-col gap-1">
          {navItems.map((item, i) => (
            <motion.li 
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.1 }}
            >
              <NavLink 
                to={item.to} 
                end={item.end}
                className={({ isActive }) => 
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm relative ${
                    isActive 
                      ? 'text-indigo-700 bg-indigo-50' 
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="active-sidebar-pill"
                        className="absolute inset-0 rounded-xl bg-indigo-50/80 border border-indigo-100/50 -z-10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon size={18} className={isActive ? "text-indigo-600" : "text-stone-400 group-hover:text-stone-600 transition-colors"} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 mt-auto">
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-stone-200/80 rounded-xl cursor-pointer text-stone-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors font-medium text-sm shadow-sm group"
        >
          <LogOut size={16} className="text-stone-400 group-hover:text-red-500 transition-colors" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
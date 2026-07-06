import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-stone-200/50 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-end px-6 gap-4">
      
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer transition-colors text-lg relative overflow-hidden"
        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      >
        <motion.div
          initial={false}
          animate={{ rotate: theme === 'light' ? 0 : 360 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </motion.div>
      </button>

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800 p-1.5 pr-3 rounded-full border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            SA
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-tight">Super Admin</p>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">admin@example.com</p>
          </div>
        </button>
      </div>

    </header>
  );
}

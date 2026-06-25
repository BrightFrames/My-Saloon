export default function Navbar() {
  return (
    <header className="h-16 border-b border-stone-200/50 bg-white/70 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-end px-6">
      
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-3 hover:bg-stone-50 p-1.5 pr-3 rounded-full border border-transparent hover:border-stone-200 transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            SA
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-stone-800 leading-tight">Super Admin</p>
            <p className="text-[10px] text-stone-500 font-medium">superadmin@glowup</p>
          </div>
        </button>
      </div>

    </header>
  );
}

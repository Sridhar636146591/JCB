import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Fuel, 
  FileText, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Calculator,
  Truck
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });



  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };



  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Drivers', path: '/drivers', icon: Users },
    { name: 'Customers & Jobs', path: '/customers', icon: UserCheck },
    { name: 'Fuel Management', path: '/fuel', icon: Fuel },
    { name: 'Reports & Analytics', path: '/reports', icon: FileText },
    { name: 'Calculator', path: '/calculator', icon: Calculator },
    { name: 'Job Calculator', path: '/job-calculator', icon: Truck },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-slate-950 shrink-0 border border-slate-200/60 dark:border-slate-700/60">
            <img src="/jcb.png" alt="Logo" className="w-8 h-8 object-contain rounded-md" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[11px] font-black leading-tight text-slate-900 dark:text-white truncate" title="Sri Lakshmi Narayana Swamy Earth Movers">Sri Lakshmi Narayana Swamy Earth Movers</h2>
            <span className="text-[9px] text-amber-500 dark:text-amber-400 font-black uppercase tracking-wider block mt-0.5">JCB & Tractor Rental</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  Active 
                    ? 'bg-amber-500 text-slate-950 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={18} className={Active ? 'stroke-[2.5]' : ''} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Theme Mode</span>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-slate-950 shrink-0 border border-slate-200/60 dark:border-slate-700/60">
              <img src="/jcb.png" alt="Logo" className="w-7 h-7 object-contain rounded-md" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[11px] font-black leading-none text-slate-900 dark:text-white truncate" title="Sri Lakshmi Narayana Swamy Earth Movers">Sri Lakshmi Narayana Swamy Earth Movers</h1>
              <span className="text-[9px] text-amber-500 font-black uppercase tracking-wider block mt-0.5">JCB & Tractor Rental</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* MOBILE DRAWER BACKDROP */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-slate-950/60 z-30 transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* MOBILE DRAWER */}
        <aside className={`md:hidden fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-slate-950 shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                <img src="/jcb.png" alt="Logo" className="w-7 h-7 object-contain rounded-md" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-black leading-none text-slate-900 dark:text-white block truncate" title="Sri Lakshmi Narayana Swamy Earth Movers">Sri Lakshmi Narayana Swamy Earth Movers</span>
                <span className="text-[9px] text-amber-500 font-black uppercase tracking-wider block mt-0.5">JCB & Tractor Rental</span>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const Active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                    Active 
                      ? 'bg-amber-500 text-slate-950' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center px-4">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Portal Access Active</span>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-auto p-4 md:p-8 relative">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

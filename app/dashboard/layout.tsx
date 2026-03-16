"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Cloud, AlertTriangle, Settings, LogOut } from 'lucide-react';
import { auth } from '@/lib/firebaseClient';
import { signOut } from 'firebase/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AWS Connections', href: '/dashboard/connections', icon: Cloud },
    { name: 'Anomaly Reports', href: '/dashboard/anomalies', icon: AlertTriangle },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col justify-between transition-colors duration-200">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">NimbusGuard</h2>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-gray-200' 
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" /> {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-slate-800">
          <button 
            onClick={handleSignOut}
            className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
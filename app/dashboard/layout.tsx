import Link from 'next/link';
import { LayoutDashboard, Cloud, AlertTriangle, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-blue-600 tracking-tight">NimbusGuard</h2>
          </div>
          <nav className="p-4 space-y-1">
            <Link href="/dashboard" className="flex items-center px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg">
              <LayoutDashboard className="w-5 h-5 mr-3" /> Overview
            </Link>
            <Link href="/dashboard/connections" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
              <Cloud className="w-5 h-5 mr-3" /> AWS Connections
            </Link>
            <Link href="/dashboard/anomalies" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
              <AlertTriangle className="w-5 h-5 mr-3" /> Anomaly Reports
            </Link>
            <Link href="/dashboard/settings" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
              <Settings className="w-5 h-5 mr-3" /> Settings
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">
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
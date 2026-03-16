"use client";

import { Moon, Sun, Monitor, Type, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContexts';
import { useState } from 'react';

export default function SettingsPage() {
  const { theme, setTheme, fontSize, setFontSize } = useSettings();
  const [showToast, setShowToast] = useState(false);

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    triggerToast();
  };

  const handleFontChange = (newSize: 'sm' | 'base' | 'lg') => {
    setFontSize(newSize);
    triggerToast();
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 relative">
      
      {/* Toast Notification */}
      <div className={`fixed bottom-8 right-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-lg shadow-xl flex items-center transition-all duration-300 z-50 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <CheckCircle2 className="w-5 h-5 mr-2 text-green-400 dark:text-green-600" />
        <span className="font-medium text-sm">Preferences updated</span>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center transition-colors">
          <SettingsIcon className="w-8 h-8 mr-3 text-blue-500" />
          Preferences
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 transition-colors">
          Customize your workspace experience. Changes are saved and applied automatically.
        </p>
      </header>

      <div className="space-y-8">
        {/* THEME SECTION */}
        <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm transition-colors">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select your preferred color theme for the dashboard.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'dark', icon: Moon, label: 'Dark' },
              { id: 'system', icon: Monitor, label: 'System' }
            ].map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleThemeChange(option.id as any)}
                  className={`relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${
                    isActive 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={`font-medium ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {option.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* FONT SIZE SECTION */}
        <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm transition-colors">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Type className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
              Density & Typography
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Adjust the interface scale for better readability or to fit more data on screen.</p>
          </div>

          <div className="flex flex-col sm:flex-row bg-gray-100 dark:bg-slate-950 p-1.5 rounded-xl w-full max-w-lg transition-colors">
            {[
              { id: 'sm', label: 'Compact' },
              { id: 'base', label: 'Standard' },
              { id: 'lg', label: 'Large' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => handleFontChange(option.id as any)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  fontSize === option.id 
                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-slate-700' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
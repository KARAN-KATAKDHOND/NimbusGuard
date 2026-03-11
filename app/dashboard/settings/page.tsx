"use client";

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Type, Settings as SettingsIcon, Save } from 'lucide-react';

export default function SettingsPage() {
  // Local state for the UI toggles
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isSaving, setIsSaving] = useState(false);

  // Simulate saving preferences to a database or localStorage
  const handleSavePreferences = () => {
    setIsSaving(true);
    setTimeout(() => {
      // Here you would typically save to Firestore or localStorage
      // localStorage.setItem('app-theme', theme);
      // localStorage.setItem('app-font', fontSize);
      setIsSaving(false);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-blue-500" />
          Preferences
        </h1>
        <p className="text-gray-500 mt-2">
          Customize your dashboard experience, including theme and typography.
        </p>
      </header>

      <div className="space-y-6">
        {/* THEME SECTION */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
            <p className="text-sm text-gray-500">Select your preferred color theme for the dashboard.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Sun className={`w-8 h-8 mb-2 ${theme === 'light' ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`font-medium ${theme === 'light' ? 'text-blue-700' : 'text-gray-700'}`}>Light</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Moon className={`w-8 h-8 mb-2 ${theme === 'dark' ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`font-medium ${theme === 'dark' ? 'text-blue-700' : 'text-gray-700'}`}>Dark</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                theme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Monitor className={`w-8 h-8 mb-2 ${theme === 'system' ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`font-medium ${theme === 'system' ? 'text-blue-700' : 'text-gray-700'}`}>System</span>
            </button>
          </div>
        </section>

        {/* FONT SIZE SECTION */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Type className="w-5 h-5 mr-2 text-gray-500" />
              Typography
            </h2>
            <p className="text-sm text-gray-500">Adjust the interface text size for better readability.</p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg w-full max-w-md">
            <button
              onClick={() => setFontSize('sm')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                fontSize === 'sm' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Small
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`flex-1 py-2 text-base font-medium rounded-md transition-colors ${
                fontSize === 'base' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`flex-1 py-2 text-lg font-medium rounded-md transition-colors ${
                fontSize === 'lg' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Large
            </button>
          </div>
        </section>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="flex items-center px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-70"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
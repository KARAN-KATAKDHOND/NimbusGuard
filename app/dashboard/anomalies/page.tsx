"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ShieldCheck, AlertOctagon, TrendingUp, Activity, Loader2, ArrowRight } from 'lucide-react';

// You can move this to your @/types file later!
export interface AnomalyReport {
  id: string;
  user_id: string;
  connection_id: string;
  detected_on: string;
  actual_cost: number;
  expected_cost: number;
  implicated_service: string;
  severity: string;
  status: string;
}

export default function AnomaliesPage() {
  const { user } = useAuth();
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // --- REAL-TIME DATA FETCHING ---
  useEffect(() => {
    if (!user) return;

    // Note: In your injection function, you used 'user_id' for anomalies, not 'user_uid'
    const q = query(
      collection(db, "anomaly_reports"),
      where("user_id", "==", user.uid),
      orderBy("detected_on", "desc")
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const fetchedData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AnomalyReport[];
        
        setAnomalies(fetchedData);
        setIsLoading(false);
        setFetchError(null);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setFetchError(error.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
          <Activity className="w-8 h-8 mr-3 text-red-500" />
          Anomaly Detection
        </h1>
        <p className="text-gray-500 mt-2">
          Review unexpected cost spikes and irregular billing behaviors detected in your AWS environment.
        </p>
      </header>

      {/* ERROR HANDLING */}
      {fetchError && (
        <div className="mb-8 bg-red-50 border border-red-200 p-4 rounded-lg text-red-800 text-sm">
          <span className="font-semibold">Error loading anomalies: </span> 
          {fetchError}
          {fetchError.includes("index") && (
            <p className="mt-2 font-medium">Check your browser console (F12) for the Firebase Index creation link!</p>
          )}
        </div>
      )}

      {/* UI STATES */}
      {isLoading ? (
        // SKELETON LOADER
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 w-full bg-gray-50 animate-pulse rounded-xl border border-gray-100"></div>
          ))}
        </div>
      ) : anomalies.length === 0 ? (
        // EMPTY STATE (NO ANOMALIES)
        <div className="bg-green-50 border border-green-100 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-green-100 p-4 rounded-full mb-4">
            <ShieldCheck className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-green-900 mb-2">Your Cloud is Secure</h2>
          <p className="text-green-700 max-w-md">
            We haven't detected any unusual cost spikes or anomalous behavior in your recent AWS billing data.
          </p>
        </div>
      ) : (
        // ANOMALY LIST
        <div className="space-y-4">
          {anomalies.map((anomaly) => {
            const spikeMultiplier = (anomaly.actual_cost / anomaly.expected_cost).toFixed(1);
            
            return (
              <div key={anomaly.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                {/* Left side accent line based on severity */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${anomaly.severity.toLowerCase() === 'critical' ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* Left Column: Core Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityStyles(anomaly.severity)}`}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{formatDate(anomaly.detected_on)}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-red-500" />
                      Cost Spike in {anomaly.implicated_service.replace(/_/g, ' ')}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      Detected a <span className="font-bold text-red-600">{spikeMultiplier}x</span> increase over your normal baseline.
                    </p>
                  </div>

                  {/* Middle Column: Cost Comparison */}
                  <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Expected</p>
                      <p className="text-lg font-medium text-gray-700">{formatCurrency(anomaly.expected_cost)}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-red-500 uppercase tracking-wider font-semibold mb-1">Actual</p>
                      <p className="text-xl font-bold text-red-600 flex items-center">
                        {formatCurrency(anomaly.actual_cost)}
                        <TrendingUp className="w-4 h-4 ml-1" />
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Action/Status */}
                  <div className="flex flex-col items-end gap-3 min-w-[140px]">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                      Status: {anomaly.status}
                    </span>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                      View Details
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
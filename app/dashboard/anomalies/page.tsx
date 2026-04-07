"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link'; 
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ShieldCheck, AlertOctagon, TrendingUp, Activity, Loader2, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

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

  useEffect(() => {
    if (!user) return;

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

  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-500/30';
      case 'high': return 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-500/30';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30';
      default: return 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center transition-colors">
          <Activity className="w-8 h-8 mr-3 text-red-500" />
          Anomaly Detection
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 transition-colors">
          Review unexpected cost spikes and irregular billing behaviors detected in your AWS environment.
        </p>
      </header>

      {fetchError && (
        <div className="mb-8 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-lg text-red-800 dark:text-red-400 text-sm transition-colors">
          <span className="font-semibold">Error loading anomalies: </span> 
          {fetchError}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 w-full bg-gray-50 dark:bg-slate-800/50 animate-pulse rounded-xl border border-gray-100 dark:border-slate-800 transition-colors"></div>
          ))}
        </div>
      ) : anomalies.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors">
          <div className="bg-green-100 dark:bg-green-800/30 p-4 rounded-full mb-4 transition-colors">
            <ShieldCheck className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-green-900 dark:text-green-300 mb-2 transition-colors">Your Cloud is Secure</h2>
          <p className="text-green-700 dark:text-green-500/80 max-w-md transition-colors">
            We haven't detected any unusual cost spikes or anomalous behavior in your recent AWS billing data.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {anomalies.map((anomaly) => {
            const spikeMultiplier = (anomaly.actual_cost / anomaly.expected_cost).toFixed(1);
            
            return (
              <div key={anomaly.id} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${anomaly.severity.toLowerCase() === 'critical' ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-6">
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors ${getSeverityStyles(anomaly.severity)}`}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{formatDate(anomaly.detected_on)}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
                      <AlertOctagon className="w-5 h-5 text-red-500" />
                      Cost Spike in {anomaly.implicated_service.replace(/_/g, ' ')}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 transition-colors">
                      Detected a <span className="font-bold text-red-600 dark:text-red-400">{spikeMultiplier}x</span> increase over your normal baseline.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors dark:border-slate-700 dark:bg-slate-800/50">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1 transition-colors">Expected</p>
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-200 transition-colors">{formatCurrency(anomaly.expected_cost)}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors" />
                    <div>
                      <p className="text-xs text-red-500 dark:text-red-400 uppercase tracking-wider font-semibold mb-1 transition-colors">Actual</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center transition-colors">
                        {formatCurrency(anomaly.actual_cost)}
                        <TrendingUp className="w-4 h-4 ml-1" />
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col items-start gap-3 md:items-end md:min-w-[140px]">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium transition-colors ${
                      anomaly.status === 'Acknowledged' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                      anomaly.status === 'False Positive' ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400' :
                      'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>
                      {anomaly.status}
                    </span>
                    <Link 
                      href={`/dashboard/anomalies/${anomaly.id}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                    >
                      View Details
                    </Link>
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
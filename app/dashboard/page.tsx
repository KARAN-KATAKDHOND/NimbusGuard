"use client";

import { useState, useEffect } from 'react';
import CostChart from '@/components/features/dashboard/CostChart';
import AnomalyAlert from '@/components/features/anomalies/AnomalyAlert';
import { Server, Activity, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, orderBy, limit, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { DailyCostMetric } from '@/types'; 

export default function DashboardOverview() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DailyCostMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Grab the latest metric so we can add to it continuously
  const latestMetric = metrics[metrics.length - 1];

  // --- TEMPORARY DEMO FUNCTION ---
  const injectWorstCaseAnomaly = async () => {
    if (!user) return;
    
    const exactTimestamp = new Date().toISOString();
    const fakeId = `demo_nuke_latest`;

    // 1. Get the current costs (or default baselines if it's the very first click)
    const currentEc2 = latestMetric?.service_breakdown?.Amazon_EC2 || 1200;
    const currentLambda = latestMetric?.service_breakdown?.AWS_Lambda || 400;
    const currentS3 = latestMetric?.service_breakdown?.Amazon_S3 || 150;
    const currentRds = latestMetric?.service_breakdown?.Amazon_RDS || 250;

    // 2. Add a random compounding "spike" to the existing values
    const ec2Cost = currentEc2 + 2000 + Math.floor(Math.random() * 3000); 
    const lambdaCost = currentLambda + 500 + Math.floor(Math.random() * 1000);
    const s3Cost = currentS3 + 100 + Math.floor(Math.random() * 400);
    const rdsCost = currentRds + 300 + Math.floor(Math.random() * 500);
    
    const totalCost = ec2Cost + lambdaCost + s3Cost + rdsCost;

    // 3. Make the severity dynamic based on how high the accumulated cost gets
    const severityLevel = totalCost > 15000 ? "Critical" : "High";

    try {
      await setDoc(doc(db, "daily_cost_metrics", fakeId), {
        user_uid: user.uid,
        connection_id: "demo_connection",
        date: exactTimestamp, 
        currency: "USD",
        total_cost: totalCost, 
        service_breakdown: {
          "Amazon_EC2": ec2Cost, 
          "AWS_Lambda": lambdaCost,
          "Amazon_S3": s3Cost,
          "Amazon_RDS": rdsCost
        },
        is_anomaly: true,
        updated_at: exactTimestamp
      });

      await setDoc(doc(db, "anomaly_reports", fakeId), {
        user_id: user.uid,
        connection_id: "demo_connection",
        detected_on: exactTimestamp,
        actual_cost: totalCost,
        expected_cost: 2000, // Baseline for comparison
        implicated_service: "Amazon_EC2", 
        severity: severityLevel,
        status: "Investigating"
      });

    } catch (error) {
      console.error("Failed to inject demo data:", error);
    }
  };

  // --- REAL-TIME DATA FETCHING ---
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "daily_cost_metrics"),
      where("user_uid", "==", user.uid),
      orderBy("date", "desc"), 
      limit(7)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const fetchedData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DailyCostMetric[];
        
        setMetrics(fetchedData.reverse());
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

  // --- MANUAL AWS SYNC ---
  const handleSyncData = async () => {
    if (!user) return;
    setIsSyncing(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/analyze-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      
    } catch (error: any) {
      console.error("Failed to sync:", error);
      setFetchError(error.message || "Failed to sync data with AWS.");
    } finally {
      setIsSyncing(false);
    }
  };

  // --- UI DATA PREPARATION ---
  const isAnomaly = latestMetric?.is_anomaly || false;
  const latestCost = latestMetric?.total_cost || 0;
  
  const chartData = metrics.map(m => ({
    date: typeof m.date === 'string' ? m.date.split('T')[0] : new Date(m.date as any).toLocaleDateString(),
    cost: m.total_cost
  }));

  const serviceBreakdown = latestMetric?.service_breakdown 
    ? Object.entries(latestMetric.service_breakdown).sort((a, b) => b[1] - a[1])
    : [];

  // --- MAIN COMPONENT UI ---
  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between" suppressHydrationWarning>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 transition-colors dark:text-white">Workspace Overview</h1>
          <p className="mt-1 text-gray-500 transition-colors dark:text-gray-400">Live Cloud Cost Analysis</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
          <button 
            onClick={injectWorstCaseAnomaly}
            className="flex w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 shadow-sm transition-colors duration-150 hover:bg-red-100 active:scale-95 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 sm:w-auto"
            title="Inject Fake Anomaly (Click to accumulate costs!)"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Demo Anomaly
          </button>

          <button 
            onClick={handleSyncData}
            disabled={isSyncing || isLoading}
            className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync AWS Data'}
          </button>
        </div>
      </header>

      {fetchError && (
        <div className="mb-8 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-lg flex items-start text-red-800 dark:text-red-400 text-sm transition-colors">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 text-red-500" />
          <div className="break-all">
            <span className="font-semibold">Data Fetch Error: </span> 
            {fetchError} 
            {fetchError.includes("index") && (
              <p className="mt-2 font-medium">Open your browser console (F12) to click the Firebase Index creation link!</p>
            )}
          </div>
        </div>
      )}

      {isAnomaly && latestMetric && !isLoading && (
        <AnomalyAlert cost={latestCost} serviceName={serviceBreakdown[0]?.[0] || "Multiple Services"} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
           {isLoading ? (
             <div className="flex min-h-[18rem] w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 transition-colors dark:border-slate-700 dark:bg-slate-800 md:h-96">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
             </div>
           ) : metrics.length > 0 ? (
             <CostChart data={chartData} />
           ) : (
             <div className="flex min-h-[18rem] w-full flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-6 text-center text-gray-500 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400 md:h-96">
               <Activity className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
               <p>No cost data available.</p>
               <p className="text-sm">Click "Sync AWS Data" to pull your billing history.</p>
             </div>
           )}
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800 dark:text-white">
            <Server className="mr-2 h-5 w-5 text-blue-500" />
            Service Breakdown
          </h3>
          
          <div className="max-h-72 flex-1 space-y-3 overflow-y-auto pr-1 sm:max-h-80">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800"></div>
              ))
            ) : serviceBreakdown.length > 0 ? (
              serviceBreakdown.map(([serviceName, cost], index) => (
                <div key={serviceName} className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${index === 0 && isAnomaly ? 'border-red-100 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10' : 'border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50'}`}>
                  <span className={`font-medium break-words ${index === 0 && isAnomaly ? 'text-red-900 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {serviceName.replace(/_/g, ' ')}
                  </span>
                  <span className={`font-bold ${index === 0 && isAnomaly ? 'text-red-700 dark:text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                    ${Number(cost).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">No service data to display.</p>
            )}
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6 transition-colors dark:border-slate-800">
            <h3 className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <Activity className="mr-2 h-4 w-4" />
              System Status
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Firestore DB</span>
                <span className={`font-medium ${fetchError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {fetchError ? 'Error' : 'Connected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Live Sync</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import { useState, useEffect } from 'react';
import CostChart from '@/components/features/dashboard/CostChart';
import AnomalyAlert from '@/components/features/anomalies/AnomalyAlert';
import { Server, Activity, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebaseClient';
// All required Firebase imports are included
import { collection, query, where, orderBy, limit, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { DailyCostMetric } from '@/types'; 

export default function DashboardOverview() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DailyCostMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // --- TEMPORARY DEMO FUNCTION ---
  // Properly scoped inside the component to access 'user'
  const injectWorstCaseAnomaly = async () => {
    if (!user) return;
    
    const fakeDate = new Date().toISOString().split('T')[0]; 
    const fakeId = `demo_nuke_${Date.now()}`;

    try {
      await setDoc(doc(db, "daily_cost_metrics", fakeId), {
        user_uid: user.uid,
        connection_id: "demo_connection",
        date: fakeDate,
        currency: "USD",
        total_cost: 15420.50, 
        service_breakdown: {
          "Amazon_EC2": 14000.00, 
          "AWS_Lambda": 1000.00,
          "Amazon_S3": 420.50
        },
        is_anomaly: true,
        updated_at: new Date().toISOString()
      });

      await setDoc(doc(db, "anomaly_reports", fakeId), {
        user_id: user.uid,
        connection_id: "demo_connection",
        detected_on: new Date().toISOString(),
        actual_cost: 15420.50,
        expected_cost: 45.50, 
        implicated_service: "Amazon_EC2",
        severity: "Critical",
        status: "Investigating"
      });

      alert("🔥 Worst-case anomaly injected! Look at the charts.");
    } catch (error) {
      console.error("Failed to inject demo data:", error);
    }
  };

  // --- REAL-TIME DATA FETCHING ---
  // Strictly handles side-effects, correctly returning a cleanup function
  useEffect(() => {
    if (!user) return;

    // Ordered by 'desc' to ensure the newly injected anomaly is fetched
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
        
        // Reverse data so the chart renders chronologically (left to right)
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
  const latestMetric = metrics[metrics.length - 1];
  const isAnomaly = latestMetric?.is_anomaly || false;
  const latestCost = latestMetric?.total_cost || 0;
  
  const chartData = metrics.map(m => ({
    date: typeof m.date === 'string' ? m.date : new Date(m.date as any).toLocaleDateString(),
    cost: m.total_cost
  }));

  const serviceBreakdown = latestMetric?.service_breakdown 
    ? Object.entries(latestMetric.service_breakdown).sort((a, b) => b[1] - a[1])
    : [];

  // --- MAIN COMPONENT UI ---
  return (
    <>
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Workspace Overview</h1>
          <p className="text-gray-500 mt-1">Live Cloud Cost Analysis</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={injectWorstCaseAnomaly}
            className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors border border-red-100"
            title="Inject Fake Anomaly"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>

          <button 
            onClick={handleSyncData}
            disabled={isSyncing || isLoading}
            className="flex items-center bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 text-gray-500 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync AWS Data'}
          </button>
        </div>
      </header>

      {fetchError && (
        <div className="mb-8 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start text-red-800 text-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           {isLoading ? (
             <div className="h-96 w-full bg-gray-100 animate-pulse rounded-xl border border-gray-200 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
             </div>
           ) : metrics.length > 0 ? (
             <CostChart data={chartData} />
           ) : (
             <div className="h-96 w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-500">
               <Activity className="w-12 h-12 text-gray-300 mb-4" />
               <p>No cost data available.</p>
               <p className="text-sm">Click "Sync AWS Data" to pull your billing history.</p>
             </div>
           )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
            <Server className="w-5 h-5 mr-2 text-blue-500" />
            Service Breakdown
          </h3>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-2">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg w-full"></div>
              ))
            ) : serviceBreakdown.length > 0 ? (
              serviceBreakdown.map(([serviceName, cost], index) => (
                <div key={serviceName} className={`flex justify-between items-center p-3 rounded-lg border ${index === 0 && isAnomaly ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                  <span className={`font-medium ${index === 0 && isAnomaly ? 'text-red-900' : 'text-gray-700'}`}>
                    {serviceName.replace(/_/g, ' ')}
                  </span>
                  <span className={`font-bold ${index === 0 && isAnomaly ? 'text-red-700' : 'text-gray-600'}`}>
                    ${Number(cost).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center mt-4">No service data to display.</p>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              System Status
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Firestore DB</span>
                <span className={`font-medium ${fetchError ? 'text-red-600' : 'text-green-600'}`}>
                  {fetchError ? 'Error' : 'Connected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Live Sync</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
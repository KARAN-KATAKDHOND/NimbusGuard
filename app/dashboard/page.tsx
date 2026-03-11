"use client";

import { useState, useEffect } from 'react';
import CostChart from '@/components/CostChart';
import AnomalyAlert from '@/components/AnomalyAlert';
import { Server, Activity, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { DailyCostMetric } from '@/types'; // Assuming you created the types file!

export default function DashboardOverview() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DailyCostMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch data in real-time from Firestore
  useEffect(() => {
    if (!user) return;

    // Get the last 7 days of costs for this user
    const q = query(
      collection(db, "daily_cost_metrics"),
      where("user_uid", "==", user.uid),
      orderBy("date", "asc"),
      limit(7)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyCostMetric[];
      
      setMetrics(fetchedData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSyncData = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      // Trigger our backend to pull fresh data from AWS
      const res = await fetch('/api/analyze-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      
      if (!res.ok) throw new Error("Sync failed");
      
      // We don't need to manually update state here because our onSnapshot 
      // listener above will automatically detect the new Firestore documents!
    } catch (error) {
      console.error("Failed to sync:", error);
      alert("Failed to sync data with AWS.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Calculate stats based on the fetched data
  const latestMetric = metrics[metrics.length - 1];
  const isAnomaly = latestMetric?.is_anomaly || false;
  const latestCost = latestMetric?.total_cost || 0;
  
  // Format data for the Recharts component
  const chartData = metrics.map(m => ({
    date: typeof m.date === 'string' ? m.date : new Date(m.date as any).toLocaleDateString(),
    cost: m.total_cost
  }));

  // Sort services by cost (highest first)
  const serviceBreakdown = latestMetric?.service_breakdown 
    ? Object.entries(latestMetric.service_breakdown).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <>
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Workspace Overview</h1>
          <p className="text-gray-500 mt-1">Production AWS Account</p>
        </div>
        <button 
          onClick={handleSyncData}
          disabled={isSyncing}
          className="flex items-center bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 text-gray-500 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync AWS Data'}
        </button>
      </header>

      {isAnomaly && latestMetric && (
        <AnomalyAlert cost={latestCost} serviceName={serviceBreakdown[0]?.[0] || "Multiple Services"} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           {metrics.length > 0 ? (
             <CostChart data={chartData} />
           ) : (
             <div className="h-96 w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-500">
               No cost data available. Click "Sync AWS Data" to pull from your AWS account.
             </div>
           )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
            <Server className="w-5 h-5 mr-2 text-blue-500" />
            Service Breakdown
          </h3>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-2">
            {serviceBreakdown.length > 0 ? (
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
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">AWS Cost API</span>
                <span className="text-green-600 font-medium">Live Connection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
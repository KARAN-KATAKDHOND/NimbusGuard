"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, AlertOctagon, Globe, Server, Clock, ShieldAlert, Loader2, CheckCircle, Cpu, GitPullRequest } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { AnomalyReport } from '../page'; 

// Enhanced Mock Data Generator: Simulates granular resource changes
const generateDetailedBreakdown = (totalCost: number, serviceName: string) => {
  const shortService = serviceName.replace('Amazon_', '').replace('AWS_', '');
  return [
    { 
      region: 'us-east-1 (N. Virginia)', 
      percentage: 0.65, 
      cost: totalCost * 0.65,
      activeResources: `12x ${shortService} (t3.2xlarge / equivalent)`,
      recentChange: `Auto-scaling group expanded by +8 units following sustained CPU spike at 02:15 UTC.`
    },
    { 
      region: 'ap-south-1 (Mumbai)', 
      percentage: 0.25, 
      cost: totalCost * 0.25,
      activeResources: `4x ${shortService} (m5.large / equivalent)`,
      recentChange: `New deployment initiated without cost-allocation tags. High IOPS provisioned.`
    },
    { 
      region: 'eu-west-1 (Ireland)', 
      percentage: 0.10, 
      cost: totalCost * 0.10,
      activeResources: `Legacy ${shortService} infrastructure`,
      recentChange: `Baseline usage. No recent structural changes detected.`
    },
  ];
};

export default function AnomalyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [anomaly, setAnomaly] = useState<AnomalyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnomaly = async () => {
      if (!user || !params.id) return;
      
      try {
        const docRef = doc(db, "anomaly_reports", params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().user_id === user.uid) {
          setAnomaly({ id: docSnap.id, ...docSnap.data() } as AnomalyReport);
        } else {
          setError("Anomaly not found or access denied.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnomaly();
  }, [user, params.id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!anomaly || !params.id) return;
    
    setUpdatingAction(newStatus);
    
    try {
      const docRef = doc(db, "anomaly_reports", params.id as string);
      await updateDoc(docRef, { status: newStatus });
      setAnomaly({ ...anomaly, status: newStatus });
    } catch (err: any) {
      console.error("Error updating anomaly status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !anomaly) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error Loading Anomaly</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{error || "Could not find this report."}</p>
        <button onClick={() => router.push('/dashboard/anomalies')} className="mt-6 text-blue-500 hover:underline">
          Return to Anomalies
        </button>
      </div>
    );
  }

  const isCritical = anomaly.severity.toLowerCase() === 'critical';
  const detailedData = generateDetailedBreakdown(anomaly.actual_cost, anomaly.implicated_service);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <button 
        onClick={() => router.push('/dashboard/anomalies')}
        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Anomalies
      </button>

      {/* HEADER CARD */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl p-8 border-t-4 shadow-sm transition-colors mb-8 ${isCritical ? 'border-red-500' : 'border-orange-400'}`}>
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isCritical ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400'}`}>
                {anomaly.severity} Priority
              </span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Clock className="w-4 h-4 mr-1.5" />
                {formatDate(anomaly.detected_on)}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                anomaly.status === 'Acknowledged' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' :
                anomaly.status === 'False Positive' ? 'bg-gray-100 border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400' :
                'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
              }`}>
                {anomaly.status}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <AlertOctagon className={`w-8 h-8 mr-3 ${isCritical ? 'text-red-500' : 'text-orange-500'}`} />
              Cost Spike: {anomaly.implicated_service.replace(/_/g, ' ')}
            </h1>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 min-w-[240px] border border-gray-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Financial Impact</p>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">{formatCurrency(anomaly.actual_cost)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
              Expected: <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(anomaly.expected_cost)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* DETAILED REGIONAL BREAKDOWN (2 Columns wide) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
            <Globe className="w-5 h-5 mr-2 text-blue-500" />
            Detailed Regional Analysis
          </h2>
          
          <div className="space-y-6">
            {detailedData.map((region, idx) => (
              <div key={idx} className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 transition-colors">
                {/* Region Header */}
                <div className="flex justify-between items-end mb-3">
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{region.region}</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(region.cost)}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mb-4">
                  <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${region.percentage * 100}%` }}></div>
                </div>

                {/* Granular Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                  <div>
                    <p className="flex items-center text-gray-500 dark:text-gray-400 font-semibold mb-1">
                      <Cpu className="w-4 h-4 mr-1.5" /> Active Resources
                    </p>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">{region.activeResources}</p>
                  </div>
                  <div>
                    <p className="flex items-center text-gray-500 dark:text-gray-400 font-semibold mb-1">
                      <GitPullRequest className="w-4 h-4 mr-1.5" /> Detected Changes
                    </p>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{region.recentChange}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTION / NEXT STEPS CARD (1 Column wide) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
              <ShieldAlert className="w-5 h-5 mr-2 text-red-500" />
              Response Center
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Please investigate the active resources listed in the N. Virginia region via your AWS Console to verify if these deployments were authorized.
            </p>

            <div className="space-y-4">
               <button 
                 onClick={() => handleUpdateStatus('Acknowledged')}
                 disabled={updatingAction !== null || anomaly.status === 'Acknowledged'}
                 className={`w-full flex items-center justify-center py-3 rounded-lg font-medium transition-colors ${
                   anomaly.status === 'Acknowledged' 
                     ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-500 cursor-not-allowed'
                     : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50'
                 }`}
               >
                 {updatingAction === 'Acknowledged' ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                 ) : anomaly.status === 'Acknowledged' ? (
                   <><CheckCircle className="w-5 h-5 mr-2" /> Acknowledged</>
                 ) : (
                   'Acknowledge Alert'
                 )}
               </button>
               
               <button 
                 onClick={() => handleUpdateStatus('False Positive')}
                 disabled={updatingAction !== null || anomaly.status === 'False Positive'}
                 className={`w-full flex items-center justify-center py-3 rounded-lg font-medium transition-colors border ${
                   anomaly.status === 'False Positive'
                     ? 'bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-gray-500 border-gray-200 dark:border-slate-700 cursor-not-allowed'
                     : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border-red-100 dark:border-red-500/20 disabled:opacity-50'
                 }`}
               >
                 {updatingAction === 'False Positive' ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                 ) : anomaly.status === 'False Positive' ? (
                   'Marked False Positive'
                 ) : (
                   'Mark as False Positive'
                 )}
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
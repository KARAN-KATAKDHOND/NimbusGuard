"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, CheckCircle, Loader2 } from "lucide-react";
import { db } from "@/lib/firebaseClient";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { AnomalyReport } from "@/types";

export default function AnomaliesPage() {
  const { user } = useAuth();
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnomalies = async () => {
      if (!user) return;
      try {
        // Query the anomaly_reports collection for this user's alerts
        const q = query(
          collection(db, "anomaly_reports"),
          where("user_id", "==", user.uid),
          orderBy("detected_on", "desc")
        );
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AnomalyReport[];
        
        setAnomalies(data);
      } catch (error) {
        console.error("Failed to fetch anomalies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnomalies();
  }, [user]);

  const getSeverityBadge = (severity: string) => {
    if (severity === 'Critical') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Critical</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">High</span>;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Resolved') return <CheckCircle className="w-4 h-4 text-green-500 mr-1.5" />;
    return <Clock className="w-4 h-4 text-yellow-500 mr-1.5" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Anomaly Reports</h1>
        <p className="text-gray-500 mt-1">Audit trail of all detected cloud cost spikes.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Date Detected</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Expected Cost</th>
                <th className="px-6 py-4">Actual Cost</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : anomalies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <AlertTriangle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                    No anomalies detected yet. Your costs are perfectly optimized!
                  </td>
                </tr>
              ) : (
                anomalies.map((anomaly) => (
                  <tr key={anomaly.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {new Date(anomaly.detected_on).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{anomaly.implicated_service.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 text-gray-500">${anomaly.expected_cost.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-red-600">${anomaly.actual_cost.toFixed(2)}</td>
                    <td className="px-6 py-4">{getSeverityBadge(anomaly.severity)}</td>
                    <td className="px-6 py-4 flex items-center text-gray-600">
                      {getStatusIcon(anomaly.status)}
                      {anomaly.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
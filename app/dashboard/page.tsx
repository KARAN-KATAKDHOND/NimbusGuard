import CostChart from '../../components/CostChart';
import AnomalyAlert from '@/components/AnomalyAlert';
import mockData from '../../data/mockBilling.json';
import { Server, Activity } from 'lucide-react';

export default function Dashboard() {
  const latestCost = mockData[mockData.length - 1].cost;
  const isAnomaly = latestCost > 50; 

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
      <main className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-dark">NimbusGuard <br/>Anomaly Detector</h1>
            <p className="text-gray-500 mt-1">Karan's Workspace • Production AWS Account</p>
          </div>
          <button className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Sync AWS Data
          </button>
        </header>

        {/* Using your new, clean component here! */}
        {isAnomaly && (
          <AnomalyAlert cost={latestCost} serviceName="Amazon EC2" />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
             <CostChart data={mockData} />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
              <Server className="w-5 h-5 mr-2 text-gray-400" />
              Service Breakdown
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="font-medium text-red-900">Amazon EC2</span>
                <span className="font-bold text-red-700">$135.00</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="font-medium text-gray-700">Amazon RDS</span>
                <span className="font-bold text-gray-600">$10.50</span>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                System Status
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Firebase DB: <span className="text-green-500 font-medium">Connected</span></p>
                <p>AWS Cost Explorer: <span className="text-yellow-500 font-medium">Mock Mode</span></p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
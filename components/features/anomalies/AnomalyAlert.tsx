import { AlertCircle } from 'lucide-react';

interface AnomalyAlertProps {
  cost: number;
  serviceName: string;
}

export default function AnomalyAlert({ cost, serviceName }: AnomalyAlertProps) {
  return (
    <div className="mb-8 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start shadow-sm transition-colors">
      <AlertCircle className="w-6 h-6 text-red-500 mr-3 mt-0.5" />
      <div>
        <h3 className="text-red-800 dark:text-red-400 font-bold">Critical Cost Anomaly Detected</h3>
        <p className="text-red-600 dark:text-red-300 mt-1 text-sm">
          A spike of <span className="font-bold">${cost.toFixed(2)}</span> was detected on {serviceName}. This exceeds your 7-day moving average by over 800%. 
        </p>
      </div>
    </div>
  );
}
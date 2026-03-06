import Link from "next/link";
import { CloudLightning } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4" suppressHydrationWarning>
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/30">
            <CloudLightning className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">NimbusGuard <br/>Anomaly Detector</h1>
          <p className="text-slate-400 text-lg">
            Stop paying for zombie AWS resources. Detect cost spikes instantly with serverless FinOps.
          </p>
        </div>

        <div className="pt-8 space-y-4">
          <Link 
            href="/login"
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Log in to Dashboard
          </Link>
          <p className="text-slate-500 text-sm">
            Demo Project for Cloud Computing
          </p>
        </div>
      </div>
    </div>
  );
}
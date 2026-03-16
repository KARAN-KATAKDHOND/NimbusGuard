"use client";

import { useState, useEffect } from "react";
import { Cloud, Plus, Server, AlertCircle, Copy, Check, Info, Loader2 } from "lucide-react";
import { db } from "@/lib/firebaseClient";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth"; 

interface CloudConnection {
  id: string;
  account_alias: string;
  aws_account_id: string;
  provider: string;
  sync_status: 'active' | 'pending' | 'failed';
}

export default function ConnectionsPage() {
  const { user } = useAuth(); 
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" });
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  const [formData, setFormData] = useState({
    account_alias: "",
    aws_account_id: "",
    aws_role_arn: "",
  });

  const NIMBUS_APP_ACCOUNT_ID = "123456789012";

  const trustPolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${NIMBUS_APP_ACCOUNT_ID}:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}`;

  const permissionPolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "NimbusGuardCostExplorerAccess",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetDimensionValues",
        "ce:GetTags"
      ],
      "Resource": "*"
    }
  ]
}`;

  useEffect(() => {
    if (!user) {
      setConnections([]);
      setIsLoadingConnections(false);
      return;
    }

    const q = query(collection(db, "cloud_connections"), where("user_uid", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedConnections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CloudConnection[];
      
      setConnections(fetchedConnections);
      setIsLoadingConnections(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setStatus({ type: 'error', message: "You must be logged in to add a connection." });
      return;
    }
    setIsSubmitting(true);
    setStatus({ type: null, message: "" });

    try {
      const docRef = await addDoc(collection(db, "cloud_connections"), {
        provider: "AWS",
        account_alias: formData.account_alias,
        aws_account_id: formData.aws_account_id,
        aws_role_arn: formData.aws_role_arn,
        sync_status: "pending", 
        last_synced_at: serverTimestamp(),
        user_uid: user.uid, 
      });

      setStatus({ type: 'success', message: "Saved! Verifying with AWS..." });

      const verifyRes = await fetch('/api/aws/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: docRef.id })
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.details || verifyData.error || "AWS Verification failed.");
      }

      setStatus({ type: 'success', message: verifyData.message });
      setFormData({ account_alias: "", aws_account_id: "", aws_role_arn: "" });
    } catch (error: any) {
      console.error("Error adding connection: ", error);
      setStatus({ type: 'error', message: error.message || "Failed to save connection." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 transition-colors">Active</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 transition-colors">Verifying...</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 transition-colors">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300 transition-colors">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors">Cloud Connections</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">Connect your AWS environments to start monitoring costs.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* LEFT COLUMN: The Form & Connections */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center transition-colors">
              <Plus className="w-5 h-5 mr-2 text-blue-500" />
              Add Connection
            </h2>
            
            <form onSubmit={handleConnect} className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Account Alias</label>
                <input 
                  type="text" required placeholder="e.g., Production Core"
                  value={formData.account_alias}
                  onChange={(e) => setFormData({...formData, account_alias: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">AWS Account ID</label>
                <input 
                  type="text" 
                  required 
                  placeholder="12-digit number" 
                  pattern="\d{12}"
                  title="Must be a 12-digit AWS Account ID"
                  value={formData.aws_account_id}
                  onChange={(e) => {
                    const cleanId = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, aws_account_id: cleanId});
                  }}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">IAM Role ARN</label>
                <input 
                  type="text" required placeholder="arn:aws:iam::123456789012:role/NimbusGuard"
                  value={formData.aws_role_arn}
                  onChange={(e) => setFormData({...formData, aws_role_arn: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
              </div>

              {status.type && (
                <div className={`p-3 rounded-lg text-sm flex items-start transition-colors ${status.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'}`}>
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5" />
                  {status.message}
                </div>
              )}

              <button 
                type="submit" disabled={isSubmitting}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Connecting..." : "Connect AWS Account"}
              </button>
            </form>
          </div>

          {/* DYNAMIC ACTIVE CONNECTIONS LIST */}
          <div className="bg-white dark:bg-slate-900 p-0 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 transition-colors">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center transition-colors">
                <Cloud className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Your Connections
              </h2>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
              {isLoadingConnections ? (
                <div className="p-6 flex justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : connections.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 transition-colors">
                  No AWS accounts connected yet.
                </div>
              ) : (
                connections.map((conn) => (
                  <div key={conn.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center">
                      <div className="bg-orange-100 dark:bg-orange-500/20 p-3 rounded-lg mr-4 transition-colors">
                        <Server className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white transition-colors">{conn.account_alias}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-0.5 transition-colors">ID: {conn.aws_account_id}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(conn.sync_status)}
                      <button className="text-xs font-medium text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Instructions Panel */}
        <div className="lg:col-span-3">
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 h-full transition-colors">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 flex items-center mb-4 transition-colors">
              <Info className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-500" />
              How to create your IAM Role
            </h3>
            
            <ol className="space-y-6 text-sm text-gray-700 dark:text-gray-300 transition-colors">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold transition-colors">1</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1 transition-colors">Create a Custom Trust Policy</p>
                  <p className="mb-2">Go to AWS IAM {'>'} Roles {'>'} Create Role. Select "Custom trust policy" and paste this JSON:</p>
                  <div className="relative group">
                    <pre className="bg-gray-900 dark:bg-black/40 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-transparent dark:border-slate-800 transition-colors">
                      {trustPolicy}
                    </pre>
                    <button 
                      onClick={() => handleCopy(trustPolicy, 'trust')}
                      className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedSection === 'trust' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold transition-colors">2</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1 transition-colors">Add Cost Explorer Permissions</p>
                  <p className="mb-2">Click Next. Click "Create policy" (opens in new tab). Select JSON and paste this:</p>
                  <div className="relative group">
                    <pre className="bg-gray-900 dark:bg-black/40 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-transparent dark:border-slate-800 transition-colors">
                      {permissionPolicy}
                    </pre>
                    <button 
                      onClick={() => handleCopy(permissionPolicy, 'permission')}
                      className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedSection === 'permission' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold transition-colors">3</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1 transition-colors">Name the Role & Copy ARN</p>
                  <p>Name the policy "NimbusGuardPolicy", go back to your role, attach it, and name the role "NimbusGuardRole". Once created, copy the Role ARN and paste it in the form on the left.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
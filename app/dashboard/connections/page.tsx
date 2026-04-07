"use client";

import { useState, useEffect } from "react";
import { Cloud, Plus, Server, AlertCircle, Copy, Check, Info, Loader2 } from "lucide-react";
import { db } from "@/lib/firebaseClient";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
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
  const [removingConnectionId, setRemovingConnectionId] = useState<string | null>(null);
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

  const handleRemoveConnection = async (connectionId: string) => {
    if (!window.confirm("Remove this connection from your workspace?")) {
      return;
    }

    setRemovingConnectionId(connectionId);

    try {
      await deleteDoc(doc(db, "cloud_connections", connectionId));
      setStatus({ type: 'success', message: "Connection removed." });
    } catch (error: any) {
      console.error("Error removing connection:", error);
      setStatus({ type: 'error', message: error.message || "Failed to remove connection." });
    } finally {
      setRemovingConnectionId(null);
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
    <div className="max-w-6xl mx-auto space-y-8 pb-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors">Cloud Connections</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">Connect your AWS environments to start monitoring costs.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
        
        {/* LEFT COLUMN: The Form & Connections */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-800 transition-colors dark:text-white">
              <Plus className="mr-2 h-5 w-5 text-blue-500" />
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
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  {status.message}
                </div>
              )}

              <button 
                type="submit" disabled={isSubmitting}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Connecting..." : "Connect AWS Account"}
              </button>
            </form>
          </div>

          {/* DYNAMIC ACTIVE CONNECTIONS LIST */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-100 p-5 transition-colors dark:border-slate-800 sm:p-6">
              <h2 className="flex items-center text-lg font-semibold text-gray-800 transition-colors dark:text-white">
                <Cloud className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                Your Connections
              </h2>
            </div>
            
            <div className="divide-y divide-gray-100 transition-colors dark:divide-slate-800">
              {isLoadingConnections ? (
                <div className="flex justify-center p-6 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : connections.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500 transition-colors dark:text-gray-400">
                  No AWS accounts connected yet.
                </div>
              ) : (
                connections.map((conn) => (
                  <div key={conn.id} className="flex flex-col gap-4 p-5 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex min-w-0 items-center">
                      <div className="mr-4 rounded-xl bg-orange-100 p-3 transition-colors dark:bg-orange-500/20">
                        <Server className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900 transition-colors dark:text-white">{conn.account_alias}</h3>
                        <p className="mt-0.5 font-mono text-sm text-gray-500 transition-colors dark:text-gray-400 break-all sm:break-normal">ID: {conn.aws_account_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                      {getStatusBadge(conn.sync_status)}
                      <button
                        onClick={() => handleRemoveConnection(conn.id)}
                        disabled={removingConnectionId === conn.id}
                        className="inline-flex items-center text-xs font-medium text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
                      >
                        {removingConnectionId === conn.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
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
          <div className="h-full rounded-2xl border border-blue-100 bg-blue-50/50 p-5 transition-colors dark:border-blue-900/30 dark:bg-blue-900/10 sm:p-6">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-blue-900 transition-colors dark:text-blue-400">
              <Info className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-500" />
              How to create your IAM Role
            </h3>
            
            <ol className="space-y-6 text-sm text-gray-700 dark:text-gray-300 transition-colors">
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 transition-colors dark:bg-blue-900/40 dark:text-blue-400">1</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1 transition-colors">Create a Custom Trust Policy</p>
                  <p className="mb-2">Go to AWS IAM {'>'} Roles {'>'} Create Role. Select "Custom trust policy" and paste this JSON:</p>
                  <div className="relative group">
                    <pre className="overflow-x-auto rounded-xl border border-transparent bg-gray-900 p-3 text-xs font-mono text-gray-100 transition-colors dark:border-slate-800 dark:bg-black/40">
                      {trustPolicy}
                    </pre>
                    <button 
                      onClick={() => handleCopy(trustPolicy, 'trust')}
                      className="absolute right-2 top-2 rounded bg-gray-800 p-1.5 text-white opacity-0 transition-opacity hover:bg-gray-700 group-hover:opacity-100"
                    >
                      {copiedSection === 'trust' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 transition-colors dark:bg-blue-900/40 dark:text-blue-400">2</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1 transition-colors">Add Cost Explorer Permissions</p>
                  <p className="mb-2">Click Next. Click "Create policy" (opens in new tab). Select JSON and paste this:</p>
                  <div className="relative group">
                    <pre className="overflow-x-auto rounded-xl border border-transparent bg-gray-900 p-3 text-xs font-mono text-gray-100 transition-colors dark:border-slate-800 dark:bg-black/40">
                      {permissionPolicy}
                    </pre>
                    <button 
                      onClick={() => handleCopy(permissionPolicy, 'permission')}
                      className="absolute right-2 top-2 rounded bg-gray-800 p-1.5 text-white opacity-0 transition-opacity hover:bg-gray-700 group-hover:opacity-100"
                    >
                      {copiedSection === 'permission' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 transition-colors dark:bg-blue-900/40 dark:text-blue-400">3</span>
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
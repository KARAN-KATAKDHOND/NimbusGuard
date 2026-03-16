"use client";

import { useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { CloudLightning, Mail, Lock, Cloud, Server, Activity } from "lucide-react"; // <-- Added icons
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      const cleanError = err.message.replace("Firebase: ", "").replace(/\(auth.*\)\./, "");
      setError(cleanError || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in with Google");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
      
      {/* --- MINOR THEMATIC BACKGROUND ANIMATIONS --- */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center overflow-hidden z-0">
        <Cloud className="absolute text-blue-500/5 w-64 h-64 top-10 -left-10 animate-pulse" style={{ animationDuration: '4s' }} />
        <Server className="absolute text-blue-500/5 w-48 h-48 bottom-10 right-10 animate-pulse" style={{ animationDuration: '5s' }} />
        <CloudLightning className="absolute text-blue-500/5 w-96 h-96 top-1/4 -right-20 animate-pulse" style={{ animationDuration: '6s' }} />
        <Activity className="absolute text-blue-500/5 w-32 h-32 bottom-1/4 left-1/4 animate-pulse" style={{ animationDuration: '7s' }} />
      </div>

      {/* Z-10 ensures the form stays on top */}
      <div className="relative z-10 max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-500/30">
            <CloudLightning className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to manage your FinOps workspace</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">Or continue with</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Google
        </button>

        <div className="text-center mt-4 text-sm text-slate-400">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
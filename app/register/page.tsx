"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { CloudLightning, Mail, Lock, User } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper function to create User Document in Firestore
  const createUserDocument = async (userId: string, userEmail: string | null, userName: string) => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    // Only create if it doesn't already exist
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: userId,
        email: userEmail,
        name: userName,
        created_at: new Date().toISOString(),
        alert_preferences: {
          email_alerts: true,
          slack_webhook_url: "" // Ready for them to add later in settings
        },
        subscription_tier: "free"
      });
    }
  };

  // Handle Email & Password Registration
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Save user to Firestore
      await createUserDocument(userCredential.user.uid, email, name);
      
      router.push("/dashboard");
    } catch (err: any) {
      const cleanError = err.message.replace("Firebase: ", "").replace(/\(auth.*\)\./, "");
      setError(cleanError || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Registration
  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      // Save user to Firestore (Google provides the display name)
      await createUserDocument(
        result.user.uid, 
        result.user.email, 
        result.user.displayName || "Google User"
      );
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-500/30">
            <CloudLightning className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Create an Account</h2>
            <p className="text-slate-400 text-sm mt-1">Start optimizing your cloud costs today</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
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
                placeholder="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">Or sign up with</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Google
        </button>

        <div className="text-center mt-4 text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
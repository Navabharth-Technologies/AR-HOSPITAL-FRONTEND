"use client";

import { motion } from "framer-motion";
import { UserCircle, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReceptionistLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: "RECEPTIONIST" })
      });
      const data = await res.json();
      
      if (data.success && data.user.role === "RECEPTIONIST") {
        router.push("/receptionist/dashboard");
      } else {
        setError(data.message || "Invalid credentials or unauthorized role");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center relative overflow-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] animate-blob" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{ y: -5 }}
        className="bg-white border border-slate-200 p-10 rounded-2xl w-full max-w-md z-10 flex flex-col space-y-8 shadow-xl hover:shadow-2xl hover:border-teal-300 transition-all duration-300 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-teal-50/50 opacity-70 z-0"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-100 rounded-full blur-3xl opacity-60 animate-pulse-slow z-0"></div>

        <div className="flex flex-col items-center space-y-4 relative z-10">
          <div className="p-2 bg-white rounded-full">
            <Image src="/ar-logo-new.png" width={80} height={80} alt="AR Hospital Logo" className="object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-wide">Receptionist Access</h2>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-sm text-gray-700 font-medium">Username</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-medical-maroon focus:ring-1 focus:ring-medical-maroon transition-all"
              placeholder="Enter your username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-700 font-medium">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-12 text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden bg-teal-600 text-white rounded-xl py-4 flex items-center justify-center space-x-2 transition-all hover:bg-teal-700 shadow-lg shadow-teal-600/20 font-bold tracking-widest uppercase"
          >
            {loading ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <span className="font-semibold tracking-wider z-10 relative">LOGIN TO RECEPTIONIST</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform z-10 relative" />
              </>
            )}
          </motion.button>
        </form>

        <div className="flex justify-center items-center space-x-2 text-gray-500 text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Authorized Personnel Only</span>
        </div>
      </motion.div>
    </main>
  );
}

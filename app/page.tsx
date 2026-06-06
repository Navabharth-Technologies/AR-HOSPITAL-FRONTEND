"use client";

import { motion } from "framer-motion";
import { Tv, HeartPulse, UserCircle, ActivitySquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTVMode = async () => {
    try {
      const res = await fetch('https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/start-ar-display', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error starting TV Mode:', error);
      // Fallback to the placeholder routing if API is down
      window.location.href = '/AR DISPLAY';
    }
  };

  if (showIntro) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black z-[100] flex items-center justify-center overflow-hidden">
        <video 
          src="/intro.mp4" 
          autoPlay 
          muted 
          playsInline
          onEnded={() => setShowIntro(false)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Animated Particles/Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-slate-50">
        {mounted && [...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-teal-500/10 blur-3xl"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
            style={{
              width: Math.random() * 300 + 50,
              height: Math.random() * 300 + 50,
            }}
          />
        ))}
      </div>

      <div className="z-10 flex flex-col items-center text-center space-y-12 w-full max-w-5xl px-6">
        {/* Logo and Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center p-4 mb-4 overflow-hidden shadow-xl border-4 border-slate-100">
             <Image src="/ar-logo-new.png" alt="AR Hospital Logo" fill className="object-contain p-2" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-800">
            AR HOSPITAL
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 font-medium tracking-wide">
            Smart OPD & Queue Management System
          </p>
        </motion.div>

        {/* Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mt-12">
          <Link href="/receptionist/login" className="w-full">
            <motion.div
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 cursor-pointer group shadow-lg hover:shadow-2xl hover:border-teal-300 transition-all duration-300"
            >
              <UserCircle className="w-16 h-16 text-slate-400 group-hover:text-teal-600 group-hover:scale-110 transition-all duration-300" />
              <h2 className="text-2xl font-bold text-slate-800 tracking-wider">Receptionist</h2>
              <p className="text-sm text-slate-500 group-hover:text-slate-700 font-medium">Login to manage patient registration</p>
            </motion.div>
          </Link>

          <Link href="/opd/login" className="w-full">
            <motion.div
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 cursor-pointer group shadow-lg hover:shadow-2xl hover:border-indigo-300 transition-all duration-300"
            >
              <ActivitySquare className="w-16 h-16 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all duration-300" />
              <h2 className="text-2xl font-bold text-slate-800 tracking-wider">OPD Handler</h2>
              <p className="text-sm text-slate-500 group-hover:text-slate-700 font-medium">Login to manage live patient queue</p>
            </motion.div>
          </Link>
        </div>
      </div>

      <div onClick={handleTVMode}>
        <motion.div
          className="fixed bottom-8 right-8 bg-white border border-slate-200 p-4 rounded-full flex items-center justify-center cursor-pointer group z-50 shadow-lg hover:shadow-2xl hover:border-red-400 transition-all duration-300"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.2, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
        >
          <Tv className="w-8 h-8 text-slate-400 group-hover:text-red-500 transition-colors duration-300" />
        </motion.div>
      </div>
    </main>
  );
}

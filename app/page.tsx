"use client";

import { motion } from "framer-motion";
import { Tv, HeartPulse, UserCircle, ActivitySquare, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [adminClicks, setAdminClicks] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  const handleAdminClick = () => {
    const newCount = adminClicks + 1;
    setAdminClicks(newCount);
    
    if (newCount >= 4) {
      router.push("/admin/login");
      setAdminClicks(0);
    }

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    // Reset if they don't click again within 500ms (prevents gaps)
    clickTimeoutRef.current = setTimeout(() => setAdminClicks(0), 500);
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
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden p-4 sm:p-6 w-full">
      {/* Settings / Signage Admin Button (Hidden 4-click trigger) */}
      <motion.div
        onClick={handleAdminClick}
        className="fixed top-6 right-6 sm:top-8 sm:right-8 bg-white border border-slate-200 p-3 sm:p-4 rounded-full flex items-center justify-center cursor-pointer group z-50 shadow-lg hover:shadow-2xl hover:border-pink-400 transition-all duration-300"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        title="Admin settings"
      >
        <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-pink-500 transition-colors duration-300" />
      </motion.div>
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

      <div className="z-10 flex flex-col items-center text-center space-y-8 sm:space-y-12 w-full max-w-5xl px-4 sm:px-6">
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
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-slate-800">
            AR HOSPITAL
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-500 font-medium tracking-wide px-2">
            Smart OPD & Queue Management System
          </p>
        </motion.div>

        {/* Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-3xl mt-8 sm:mt-12">
          <Link href="/receptionist/login" className="w-full">
            <motion.div
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 cursor-pointer group shadow-lg hover:shadow-2xl hover:border-teal-300 transition-all duration-300"
            >
              <UserCircle className="w-16 h-16 text-slate-400 group-hover:text-teal-600 group-hover:scale-110 transition-all duration-300" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-wider">Receptionist</h2>
              <p className="text-xs sm:text-sm text-slate-500 group-hover:text-slate-700 font-medium">Login to manage patient registration</p>
            </motion.div>
          </Link>

          <Link href="/opd/login" className="w-full">
            <motion.div
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 cursor-pointer group shadow-lg hover:shadow-2xl hover:border-indigo-300 transition-all duration-300"
            >
              <ActivitySquare className="w-16 h-16 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all duration-300" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-wider">OPD Handler</h2>
              <p className="text-xs sm:text-sm text-slate-500 group-hover:text-slate-700 font-medium">Login to manage live patient queue</p>
            </motion.div>
          </Link>
        </div>
      </div>

      <Link href="/ar-display">
        <motion.div
          className="fixed bottom-8 right-8 bg-white border border-slate-200 p-4 rounded-full flex items-center justify-center cursor-pointer group z-50 shadow-lg hover:shadow-2xl hover:border-red-400 transition-all duration-300"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.2, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
        >
          <Tv className="w-8 h-8 text-slate-400 group-hover:text-red-500 transition-colors duration-300" />
        </motion.div>
      </Link>
    </main>
  );
}

"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ActivitySquare, LogOut, CheckCircle, PauseCircle, PlayCircle, XCircle, Activity, Stethoscope, AlertCircle, Radio, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import io from "socket.io-client";

interface Patient {
  PatientID: number;
  PatientName: string;
  Gender: string;
  Age: number;
  MobileNumber: string;
  ConsultingDoctor: string;
  OPDNumber: string;
  QueueStatus: string;
  IsActive: boolean;
  IsEmergency: boolean;
  OpdTokenNumber: number;
  EmergencyTokenNumber: number;
}

export default function OPDDashboard() {
  const [opdNumber, setOpdNumber] = useState("OPD 1");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctorStatus, setDoctorStatus] = useState<"AVAILABLE" | "OT" | "AWAY" | "HOLIDAY">("AVAILABLE");
  const [socket, setSocket] = useState<any>(null);

  // OT Menu state
  const [showOTMenu, setShowOTMenu] = useState(false);
  const [otDuration, setOtDuration] = useState(30);
  const [otOpd, setOtOpd] = useState("OPD 1");

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, statusToClear: string | null, message: string, type: "confirm" | "info" }>({
    isOpen: false,
    statusToClear: null,
    message: "",
    type: "confirm"
  });

  useEffect(() => {
    setOtOpd(opdNumber);
  }, [opdNumber]);

  useEffect(() => {
    const newSocket = io("https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit("join_opd", opdNumber);

      const handleQueueUpdate = () => {
        fetchPatients();
      };

      socket.on("queue_updated", handleQueueUpdate);

      const handleStatusUpdate = (data: any) => {
        if (data.opdId === opdNumber) {
          if (data.pendingStatus) {
            setDoctorStatus(data.pendingStatus);
          } else {
            setDoctorStatus(data.status);
          }
        }
      };

      socket.on("doctor_status_changed", handleStatusUpdate);

      const handleTimerEnded = (data: any) => {
        if (data.opdId === opdNumber) {
          setDoctorStatus("AVAILABLE");
        }
      };

      socket.on("ot_timer_ended", handleTimerEnded);

      return () => {
        socket.off("queue_updated", handleQueueUpdate);
        socket.off("doctor_status_changed", handleStatusUpdate);
        socket.off("ot_timer_ended", handleTimerEnded);
        socket.emit("leave_opd", opdNumber);
      };
    }
  }, [socket, opdNumber]);

  const fetchPatients = async () => {
    try {
      const res = await fetch(`https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/patients/opd/${opdNumber}`);
      const data = await res.json();
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error("Failed to fetch patients", error);
    }
  };

  useEffect(() => {
    fetchPatients();
    setOtOpd(opdNumber);

    const checkStatus = async () => {
      try {
        const res = await fetch(`https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/opd/${opdNumber}/status`);
        const data = await res.json();
        if (data.success) {
          if (data.pendingStatus) {
            setDoctorStatus(data.pendingStatus);
          } else {
            setDoctorStatus(data.status);
          }
        } else {
          setDoctorStatus("AVAILABLE");
        }
      } catch (err) {
        console.error("Failed to check status", err);
      }
    };
    checkStatus();
  }, [opdNumber]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/patients/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleConfirmResume = async (status: string | null) => {
    if (!status) return;
    setConfirmModal({ isOpen: false, statusToClear: null, message: "", type: "confirm" });
    setDoctorStatus("AVAILABLE");
    setShowOTMenu(false);

    if (status === "OT") {
      fetch(`https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/opd/${opdNumber}/cancel-ot-timer`, { method: "POST" });
    }

    try {
      await fetch(`https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/opd/${opdNumber}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "AVAILABLE" })
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleCallNext = async () => {
    try {
      await fetch(`https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/opd/${opdNumber}/call-next`, {
        method: "POST"
      });
    } catch (error) {
      console.error("Failed to call next patient", error);
    }
  };

  const handleDoctorStatus = async (clickedStatus: "AVAILABLE" | "OT" | "AWAY" | "HOLIDAY") => {
    if (clickedStatus === "OT") {
      if (doctorStatus === "OT") {
        setConfirmModal({
          isOpen: true,
          statusToClear: "OT",
          message: "Are you sure you want to remove the OT status and resume the queue automatically?",
          type: "confirm"
        });
        return;
      }
      setShowOTMenu(!showOTMenu);
      return;
    }

    let targetStatus = clickedStatus;

    if (doctorStatus === clickedStatus && (clickedStatus === "AWAY" || clickedStatus === "HOLIDAY")) {
      setConfirmModal({
        isOpen: true,
        statusToClear: clickedStatus,
        message: `Are you sure you want to remove the ${clickedStatus === "AWAY" ? "Away" : "Holiday"} status and resume the queue automatically?`,
        type: "confirm"
      });
      return;
    }
    else if (doctorStatus === "AWAY" || doctorStatus === "HOLIDAY") {
      if (clickedStatus === "AVAILABLE") return;
    }

    if (targetStatus === doctorStatus) {
      setShowOTMenu(false);
      return;
    }

    setDoctorStatus(targetStatus);
    setShowOTMenu(false);

    if (targetStatus === "AVAILABLE" && doctorStatus === "OT") {
      fetch(`https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/opd/${opdNumber}/cancel-ot-timer`, { method: "POST" });
    }

    try {
      const res = await fetch(`https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/opd/${opdNumber}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus })
      });
      const data = await res.json();
      if (data.pendingStatus) {
        setConfirmModal({
          isOpen: true,
          statusToClear: null,
          message: `${targetStatus === "AWAY" ? "Away" : "Holiday"} Status Pending. Will trigger after current patient.`,
          type: "info"
        });
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const submitOTTimer = async () => {
    try {
      const res = await fetch(`https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/opd/${otOpd}/ot-timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: otDuration })
      });
      const data = await res.json();
      if (data.success) {
        setShowOTMenu(false);
        if (otOpd === opdNumber) {
          setDoctorStatus("OT");
        }
        if (socket) {
          socket.emit("doctor_status_changed", { opdId: otOpd, status: "OT" });
        }
        setConfirmModal({
          isOpen: true,
          statusToClear: null,
          message: "OT Timer Pending. Will trigger after current patient.",
          type: "info"
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500/30">

      {/* Abstract Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[30%] h-[30%] bg-teal-200/50 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-200/50 rounded-full blur-[120px] mix-blend-multiply" />
      </div>

      {/* Top Navbar - Airport Control System Vibe */}
      <nav className="glass-panel-light border-b border-slate-200 px-4 md:px-8 py-4 flex flex-col xl:flex-row gap-4 xl:gap-0 justify-between items-center z-[100] relative sticky top-0 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Image src="/ar-logo-new.png" width={44} height={44} alt="AR Hospital Logo" className="object-contain" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.6)] border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-slate-900 flex items-center space-x-2">
              <span>OPD_HANDLER</span>
            </h1>
          </div>
        </div>

        {/* Global Status Toggle & OPD Selector */}
        <div className="flex flex-wrap justify-center items-center gap-4 xl:gap-0 xl:space-x-6 mt-2 xl:mt-0">
          <div className="relative group">
            <select
              value={opdNumber}
              onChange={(e) => setOpdNumber(e.target.value)}
              className="bg-white text-teal-700 text-sm font-bold px-6 py-3 rounded-xl border border-teal-200 outline-none appearance-none cursor-pointer focus:border-teal-500 transition-all shadow-sm"
            >
              <option value="OPD 1" className="bg-white">OPD 1</option>
              <option value="OPD 2" className="bg-white">OPD 2</option>
              <option value="OPD 3" className="bg-white">OPD 3</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-teal-600">
              ▼
            </div>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => handleDoctorStatus("AVAILABLE")}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold tracking-wider transition-all flex items-center space-x-2 ${doctorStatus === "AVAILABLE" ? "bg-teal-50 text-teal-700 border border-teal-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              <Activity className="w-4 h-4" /> <span>Active</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => handleDoctorStatus("AWAY")}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold tracking-wider transition-all flex items-center space-x-2 ${doctorStatus === "AWAY" ? "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              <PauseCircle className="w-4 h-4" /> <span>Away</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => handleDoctorStatus("HOLIDAY")}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold tracking-wider transition-all flex items-center space-x-2 ${doctorStatus === "HOLIDAY" ? "bg-purple-50 text-purple-700 border border-purple-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              <XCircle className="w-4 h-4" /> <span>Off-Duty</span>
            </motion.button>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => handleDoctorStatus("OT")}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold tracking-wider transition-all flex items-center space-x-2 ${doctorStatus === "OT" ? "bg-red-50 text-red-700 border border-red-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
              >
                <Stethoscope className="w-4 h-4" /> <span>In Surgery</span>
              </motion.button>

              {/* OT Dropdown Menu */}
              <AnimatePresence>
                {showOTMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl p-6 w-72 shadow-xl z-[999] flex flex-col space-y-5"
                  >
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold tracking-widest mb-1.5 block">SELECT TARGET OPD</label>
                      <select
                        value={otOpd} onChange={(e) => setOtOpd(e.target.value)}
                        className="w-full bg-slate-50 text-slate-900 text-sm px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-red-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="OPD 1">OPD 1</option>
                        <option value="OPD 2">OPD 2</option>
                        <option value="OPD 3">OPD 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold tracking-widest mb-1.5 block">ESTIMATED DURATION</label>
                      <select
                        value={otDuration} onChange={(e) => setOtDuration(Number(e.target.value))}
                        className="w-full bg-slate-50 text-slate-900 text-sm px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-red-500 transition-all appearance-none cursor-pointer"
                      >
                        {[0, 5, 10, 15, 20, 25, 30, 45, 60, 90, 120].map((min) => (
                          <option key={min} value={min}>{min} Minutes</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={submitOTTimer}
                      className="w-full mt-2 bg-red-600 border border-red-600 text-white rounded-xl py-3 font-bold tracking-widest hover:bg-red-700 transition-all shadow-md shadow-red-600/20"
                    >
                      INITIALIZE SURGERY BLOCK
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden xl:block h-8 w-px bg-slate-200"></div>

          <Link href="/">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-200">
              <LogOut className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full relative z-10">

        {/* Status Banners */}
        {doctorStatus === "OT" && (
          <div className="mb-8 w-full bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-center space-x-3 text-red-600 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="font-semibold tracking-widest text-sm">PHYSICIAN IN SURGERY — QUEUE SUSPENDED</span>
          </div>
        )}
        {doctorStatus === "AWAY" && (
          <div className="mb-8 w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-center space-x-3 text-amber-600 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="font-semibold tracking-widest text-sm">PHYSICIAN AWAY — QUEUE PAUSED</span>
          </div>
        )}
        {doctorStatus === "HOLIDAY" && (
          <div className="mb-8 w-full bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-center space-x-3 text-purple-600 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-semibold tracking-widest text-sm">PHYSICIAN OFF-DUTY — NO INTAKE</span>
          </div>
        )}

        <div className="relative">
          {/* Vertical Timeline Line */}
          {patients.length > 1 && (
            <div className="hidden md:block absolute left-8 top-24 bottom-24 w-0.5 bg-slate-200 z-0"></div>
          )}

          <div className="grid grid-cols-1 gap-6 relative z-10">
            <AnimatePresence>
              {patients.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-slate-500">
                  <ActivitySquare className="w-16 h-16 mb-4 opacity-30 text-slate-400" />
                  <p className="text-xl tracking-widest font-mono text-slate-600">QUEUE EMPTY</p>
                  <p className="text-sm mt-2">Awaiting patient routing from reception.</p>
                </motion.div>
              ) : (
                patients.map((patient, index) => (
                  <motion.div
                    layout
                    key={patient.PatientID}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`
                      relative p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between transition-all shadow-sm
                      ${patient.IsActive && patient.QueueStatus !== 'HOLD' ? 'bg-white border-2 border-teal-500 shadow-[0_4px_20px_rgba(20,184,166,0.15)] living-card-active scale-[1.02] z-20 mb-4' : 'bg-white border border-slate-200 hover:border-slate-300 z-10'}
                      ${patient.QueueStatus === 'HOLD' ? 'border border-amber-300 bg-slate-50' : ''}
                      ${(doctorStatus !== "AVAILABLE" && !patient.IsActive) ? "opacity-50 grayscale" : ""}
                    `}
                  >
                    {/* Timeline Node */}
                    {index > 0 && !patient.IsActive && (
                      <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-300 z-10 hidden md:block"></div>
                    )}

                    <div className="flex-1 w-full md:w-auto">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className={`
                          px-3 py-1 rounded font-mono font-bold border text-xs flex items-center tracking-wider
                          ${patient.IsEmergency ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'}
                        `}>
                          {patient.IsEmergency && <span className="mr-2 animate-pulse text-red-500">🚨</span>}
                          TOKEN: {patient.IsEmergency && patient.EmergencyTokenNumber ? `EMR${patient.EmergencyTokenNumber.toString().padStart(3, '0')}` : (patient.OpdTokenNumber ? patient.OpdTokenNumber.toString() : patient.PatientID.toString().padStart(4, '0'))}
                        </div>

                        {patient.QueueStatus === 'HOLD' && (
                          <div className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded text-[10px] font-bold tracking-widest flex items-center uppercase">
                            <PauseCircle className="w-3 h-3 mr-1.5" /> PRIORITY HOLD
                          </div>
                        )}
                        {patient.IsActive && patient.QueueStatus !== 'HOLD' && (
                          <div className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded text-[10px] font-bold tracking-widest flex items-center uppercase">
                            <Activity className="w-3 h-3 mr-1.5 animate-pulse" /> CURRENT ACTIVE
                          </div>
                        )}
                      </div>

                      <h3 className={`text-xl sm:text-2xl font-bold tracking-wide mb-1 ${patient.IsEmergency ? 'text-red-600' : 'text-slate-900'}`}>
                        {patient.PatientName}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm font-medium">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1 text-slate-400" /> {patient.Age}y</span>
                        <span className="text-slate-300">•</span>
                        <span>{patient.Gender}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-xs">{patient.MobileNumber}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-xs">{patient.ConsultingDoctor}</span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 mt-6 md:mt-0 w-full md:w-auto justify-end">
                      {patient.QueueStatus === 'HOLD' ? (
                        <motion.button
                          whileHover={{ scale: (doctorStatus !== "AVAILABLE" && !patient.IsActive) ? 1 : 1.05 }} whileTap={{ scale: (doctorStatus !== "AVAILABLE" && !patient.IsActive) ? 1 : 0.95 }}
                          disabled={doctorStatus !== "AVAILABLE" && !patient.IsActive}
                          onClick={() => {
                            if (doctorStatus !== "AVAILABLE" && !patient.IsActive) return;
                            updateStatus(patient.PatientID, 'UNHOLD');
                          }}
                          className={`flex-1 sm:flex-none bg-white border px-4 sm:px-5 py-3 rounded-xl flex flex-col items-center space-y-1 sm:w-24 min-w-[80px] shadow-sm transition-all ${(doctorStatus !== "AVAILABLE" && !patient.IsActive) ? "opacity-50 cursor-not-allowed grayscale border-slate-200 text-slate-400" : "border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"}`}
                        >
                          <PlayCircle className="w-5 h-5" />
                          <span className="text-[9px] font-bold tracking-widest uppercase">RESUME</span>
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: (doctorStatus !== "AVAILABLE" && !patient.IsActive) ? 1 : 1.05 }} whileTap={{ scale: (doctorStatus !== "AVAILABLE" && !patient.IsActive) ? 1 : 0.95 }}
                          disabled={doctorStatus !== "AVAILABLE" && !patient.IsActive}
                          onClick={() => {
                            if (doctorStatus !== "AVAILABLE" && !patient.IsActive) return;
                            updateStatus(patient.PatientID, 'HOLD');
                          }}
                          className={`flex-1 sm:flex-none bg-white border px-4 sm:px-5 py-3 rounded-xl flex flex-col items-center space-y-1 sm:w-24 min-w-[80px] shadow-sm transition-all ${(doctorStatus !== "AVAILABLE" && !patient.IsActive) ? "opacity-50 cursor-not-allowed grayscale border-slate-200 text-slate-400" : "border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300"}`}
                        >
                          <PauseCircle className="w-5 h-5" />
                          <span className="text-[9px] font-bold tracking-widest uppercase">HOLD</span>
                        </motion.button>
                      )}

                      <motion.button
                        whileHover={{ scale: (doctorStatus !== "AVAILABLE" && !patient.IsActive) ? 1 : 1.05 }} whileTap={{ scale: (doctorStatus !== "AVAILABLE" && !patient.IsActive) ? 1 : 0.95 }}
                        disabled={doctorStatus !== "AVAILABLE" && !patient.IsActive}
                        onClick={() => {
                          if (doctorStatus !== "AVAILABLE" && !patient.IsActive) return;
                          updateStatus(patient.PatientID, 'CANCELLED');
                        }}
                        className={`flex-1 sm:flex-none bg-white border px-4 sm:px-5 py-3 rounded-xl flex flex-col items-center space-y-1 sm:w-24 min-w-[80px] shadow-sm transition-all ${(doctorStatus !== "AVAILABLE" && !patient.IsActive) ? "opacity-50 cursor-not-allowed grayscale border-slate-200 text-slate-400" : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"}`}
                      >
                        <XCircle className="w-5 h-5" />
                        <span className="text-[9px] font-bold tracking-widest uppercase">CANCEL</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: (doctorStatus !== "AVAILABLE" && !patient.IsActive) ? 1 : 1.05 }} whileTap={{ scale: (doctorStatus !== "AVAILABLE" && !patient.IsActive) ? 1 : 0.95 }}
                        disabled={doctorStatus !== "AVAILABLE" && !patient.IsActive}
                        onClick={() => {
                          if (doctorStatus !== "AVAILABLE" && !patient.IsActive) return;
                          updateStatus(patient.PatientID, 'COMPLETED');
                        }}
                        className={`flex-1 sm:flex-none border px-4 sm:px-5 py-3 rounded-xl flex flex-col items-center space-y-1 sm:w-24 min-w-[80px] transition-all ${(doctorStatus !== "AVAILABLE" && !patient.IsActive) ? "opacity-50 cursor-not-allowed grayscale bg-slate-300 border-slate-400 text-slate-500" : "bg-teal-600 border-teal-700 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20"}`}
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-[9px] font-bold tracking-widest uppercase">COMPLETE</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Custom Confirm Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500"></div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <AlertCircle className="text-teal-600 w-6 h-6" />
                SYSTEM OVERRIDE
              </h2>
              <p className="text-slate-600 mb-8 text-lg font-medium leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex justify-end gap-4">
                {confirmModal.type === "confirm" && (
                  <button
                    onClick={() => setConfirmModal({ isOpen: false, statusToClear: null, message: "", type: "confirm" })}
                    className="px-6 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all font-semibold"
                  >
                    Abort
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirmModal.type === "confirm") {
                      handleConfirmResume(confirmModal.statusToClear);
                    } else {
                      setConfirmModal({ isOpen: false, statusToClear: null, message: "", type: "confirm" });
                    }
                  }}
                  className="px-6 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all font-bold shadow-md shadow-teal-600/20"
                >
                  {confirmModal.type === "confirm" ? "Execute Resume" : "Acknowledge"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

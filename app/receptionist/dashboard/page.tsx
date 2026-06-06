"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, CheckCircle, Activity, UserPlus, LogOut, Keyboard, XCircle, Database, Server, Cpu } from "lucide-react";
import Link from "next/link";

const doctorSpecializationMap: Record<string, string> = {
  "DR MADHURAM CHOWDRY": "ORTHOPEDIC",
  "DR DARSHAN M S": "ORTHOPEDIC",
  "DR MOHAN KUMAR": "ORTHOPEDIC",
  "DR JAISHANKAR": "GENERAL PHYSICIAN",
  "DR LOKESH M G": "GENERAL SURGEON",
  "DR SACHIN H M": "GENERAL SURGEON",
  "DR GEETHA H N": "GYNAECOLOGIST",
  "DR CHANDRIKA M": "GYNAECOLOGIST",
  "DR PUNEETH S": "NEURO SURGEON",
  "DR VIJAY KUMAR": "PLASTIC SURGEON",
  "DR KIRAN SHETTY": "UROLOGIST",
  "DR ADARSH CHOWDRY": "OMFS",
  "DR PUJITH K V": "DERMATOLOGIST",
  "DR ABHILASH S": "ENT",
  "DR BANU": "PEDIATRICIAN"
};

const ALL_SPECIALIZATIONS = [
  "ORTHOPEDIC", "GENERAL PHYSICIAN", "GENERAL SURGEON", "GYNAECOLOGIST",
  "NEURO SURGEON", "PLASTIC SURGEON", "UROLOGIST", "OMFS",
  "DERMATOLOGIST", "ENT", "PEDIATRICIAN"
];

export default function ReceptionistDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [routingState, setRoutingState] = useState<'upload' | 'uploaded' | 'routing' | 'success'>('upload');
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedOPD, setSelectedOPD] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Manual Entry States
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    PatientName: "",
    Gender: "",
    Age: "",
    MobileNumber: ""
  });
  const [formErrors, setFormErrors] = useState<any>({});

  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const doctor = e.target.value;
    setSelectedDoctor(doctor);
    if (doctorSpecializationMap[doctor]) {
      setSelectedSpecialization(doctorSpecializationMap[doctor]);
    } else {
      setSelectedSpecialization("");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setParsing(true);
      
      const formData = new FormData();
      formData.append("billPdf", selectedFile);

      try {
        const response = await fetch("http://localhost:5000/api/upload-bill", {
          method: "POST",
          body: formData,
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setPatientData(result.data);
          setRoutingState('uploaded');
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setRoutingState('upload');
      } finally {
        setParsing(false);
      }
    }
  };

  const handleRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientData || !selectedDoctor || !selectedOPD) return;

    try {
      const response = await fetch(`http://localhost:5000/api/patients/${patientData.PatientID}/route`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ConsultingDoctor: selectedDoctor, OPDNumber: selectedOPD, Specialization: selectedSpecialization, IsEmergency: isEmergency }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setPatientData(result.patient);
        setRoutingState('success');
        
        setTimeout(() => {
          setRoutingState('upload');
          setFile(null);
          setPatientData(null);
          setSelectedDoctor("");
          setSelectedOPD("");
          setSelectedSpecialization("");
          setIsEmergency(false);
        }, 5000);
      }
    } catch (error) {
      console.error("Routing failed", error);
    }
  };

  const validateForm = () => {
    const errors: any = {};
    const nameRegex = /^[A-Za-z\s]+$/;
    const sameThreeLettersRegex = /([A-Za-z])\1\1/;

    if (!nameRegex.test(manualData.PatientName)) {
      errors.PatientName = "Only alphabets are allowed.";
    } else if (sameThreeLettersRegex.test(manualData.PatientName)) {
      errors.PatientName = "Sequence of the same 3 letters is not allowed.";
    }

    const age = parseInt(manualData.Age);
    if (isNaN(age) || age <= 0 || age > 125) {
      errors.Age = "Age must be a valid number up to 125.";
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(manualData.MobileNumber)) {
      errors.MobileNumber = "Mobile number must be exactly 10 digits starting with 6-9.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      const response = await fetch("http://localhost:5000/api/patients/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualData),
      });
      
      if (response.ok) {
        const result = await response.json();
        setPatientData(result.data);
        setIsManualEntry(false);
        setRoutingState('uploaded');
        setManualData({
            PatientName: "", Gender: "", Age: "", MobileNumber: ""
        });
        setFormErrors({});
      }
    } catch (error) {
      console.error("Manual entry failed", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500/30">
      
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/50 rounded-full blur-[120px]" />
      </div>

      {/* Top Navbar - Airport Control System Vibe */}
      <nav className="glass-panel-light border-b border-slate-200 px-4 md:px-8 py-4 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center z-10 sticky top-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Image src="/ar-logo-new.png" width={44} height={44} alt="AR Hospital Logo" className="object-contain" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-teal-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.6)] border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-slate-900 flex items-center space-x-2">
              <span>RECEPTIONIST</span>
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-0 md:space-x-8 mt-2 md:mt-0">
          <div className="text-right hidden md:flex flex-col items-end">
            <p className="text-sm font-medium text-slate-700">Welcome, Control Admin</p>
            <p className="text-xs text-slate-500 font-mono tracking-wider">{currentTime || "SYNCING..."}</p>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <Link href="/">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-200"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-[1400px] mx-auto w-full z-10">
        
        {/* Left Column: Upload or Manual Entry */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex flex-col space-y-6">
          <div className="premium-glass-light p-8 rounded-2xl h-full flex flex-col relative overflow-hidden group">
            
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold flex items-center text-slate-900 tracking-wide">
                {isManualEntry ? <Keyboard className="mr-3 text-teal-600 w-6 h-6"/> : <FileText className="mr-3 text-teal-600 w-6 h-6"/>} 
                {isManualEntry ? "Manual Data Entry" : "Upload PDF"}
              </h2>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsManualEntry(!isManualEntry)}
                className="text-xs px-4 py-2 border border-teal-200 text-teal-600 bg-white rounded-lg hover:bg-teal-50 transition-colors font-mono uppercase tracking-wider font-semibold shadow-sm"
              >
                {isManualEntry ? "Switch to Upload" : "Manual Override"}
              </motion.button>
            </div>
            
            {isManualEntry ? (
              <form onSubmit={handleManualSubmit} noValidate className="flex-1 flex flex-col space-y-5">
                <div>
                  <input 
                    required type="text" placeholder="Patient Name" 
                    value={manualData.PatientName} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^A-Za-z\s]/g, '');
                      setManualData({...manualData, PatientName: val});
                      if (formErrors.PatientName) setFormErrors({...formErrors, PatientName: undefined});
                    }}
                    className={`w-full bg-white border ${formErrors.PatientName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/10'} rounded-xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400 shadow-sm`}
                  />
                  {formErrors.PatientName && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">{formErrors.PatientName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <select required value={manualData.Gender} onChange={e => setManualData({...manualData, Gender: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all appearance-none cursor-pointer shadow-sm">
                    <option value="" disabled hidden>Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <div>
                    <input 
                      required type="text" placeholder="Age" 
                      value={manualData.Age} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 3) {
                          setManualData({...manualData, Age: val});
                        }
                        if (formErrors.Age) setFormErrors({...formErrors, Age: undefined});
                      }}
                      className={`w-full bg-white border ${formErrors.Age ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/10'} rounded-xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400 shadow-sm`}
                    />
                    {formErrors.Age && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">{formErrors.Age}</p>}
                  </div>
                </div>
                <div>
                  <input 
                    required type="text" placeholder="Mobile Number" 
                    value={manualData.MobileNumber} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) {
                        setManualData({...manualData, MobileNumber: val});
                      }
                      if (formErrors.MobileNumber) setFormErrors({...formErrors, MobileNumber: undefined});
                    }}
                    className={`w-full bg-white border ${formErrors.MobileNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/10'} rounded-xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400 shadow-sm`}
                  />
                  {formErrors.MobileNumber && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">{formErrors.MobileNumber}</p>}
                </div>
                <div className="flex-1"></div>
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                  type="submit" 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-4 font-bold tracking-widest transition-all shadow-lg shadow-teal-600/20 mt-auto"
                >
                  INITIALIZE RECORD
                </motion.button>
              </form>
            ) : (
              <label className="flex-1 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 transition-all relative overflow-hidden bg-white/50">
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                
                {/* Animated Data Stream background when parsing */}
                {parsing && (
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(13, 148, 136, 0.5) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'data-stream 2s linear infinite' }}></div>
                )}

                <AnimatePresence mode="wait">
                  {parsing ? (
                    <motion.div key="parsing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center space-y-5 relative z-10">
                      <div className="relative">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}>
                          <Cpu className="w-16 h-16 text-teal-600" />
                        </motion.div>
                        <div className="absolute inset-0 bg-teal-400/20 blur-xl rounded-full"></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="text-teal-600 font-mono tracking-widest text-sm font-bold">ANALYZING DATA</p>
                        <p className="text-xs text-slate-500 mt-1">Extracting patient metadata via secure node...</p>
                      </div>
                    </motion.div>
                  ) : file ? (
                    <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center space-y-4 relative w-full h-full justify-center z-10">
                      <div className="relative">
                        <CheckCircle className="w-16 h-16 text-green-500 relative z-10" />
                        <div className="absolute inset-0 bg-green-400/20 blur-xl rounded-full"></div>
                      </div>
                      <p className="text-green-600 font-bold tracking-wide">Data Extracted Successfully</p>
                      <p className="text-xs text-slate-600 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">{file.name}</p>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          setFile(null); setPatientData(null); setRoutingState('upload');
                        }}
                        className="absolute top-4 right-4 p-2 bg-white text-slate-500 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center space-x-2 border border-slate-200 shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Clear</span>
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center space-y-4 text-slate-400 group-hover:text-teal-600 transition-colors z-10">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-2 group-hover:border-teal-200 group-hover:bg-teal-50 transition-all shadow-sm">
                        <UploadCloud className="w-12 h-12" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-lg font-bold tracking-wide text-slate-700">Drag & Drop Patient Bill</p>
                        <p className="text-sm opacity-80 text-slate-500">PDF extraction module ready</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </label>
            )}
          </div>
        </motion.div>

        {/* Right Column: Extracted Data & Routing */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }} className="premium-glass-light p-8 rounded-2xl flex flex-col">
          <h2 className="text-xl font-semibold mb-8 flex items-center text-slate-900 tracking-wide">
            <Server className="mr-3 text-indigo-600 w-6 h-6"/> Registration
          </h2>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {routingState === 'success' && patientData ? (
                <motion.div 
                  key="success" 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} 
                  className="w-full flex flex-col items-center space-y-8"
                >
                  <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center border border-green-200 relative shadow-sm">
                    <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping opacity-50"></div>
                    <CheckCircle className="w-12 h-12 text-green-500 relative z-10" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-3xl font-bold text-slate-900 tracking-wider">{patientData.PatientName}</h3>
                    <div className="inline-flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      <p className="text-indigo-600 font-mono font-bold tracking-widest text-sm">
                        TOKEN: {patientData.IsEmergency && patientData.EmergencyTokenNumber ? `EMR${patientData.EmergencyTokenNumber.toString().padStart(3, '0')}` : (patientData.OpdTokenNumber ? patientData.OpdTokenNumber.toString() : patientData.PatientID?.toString().padStart(4, '0'))} • {patientData.OPDNumber}
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-white rounded-xl p-6 border border-slate-200 text-left grid grid-cols-2 gap-y-6 gap-x-4 shadow-sm">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Age / Gender</p>
                      <p className="text-slate-800 font-medium">{patientData.Age} yrs • {patientData.Gender}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Contact</p>
                      <p className="text-slate-800 font-medium">{patientData.MobileNumber}</p>
                    </div>
                    <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Assigned Physician</p>
                      <p className="text-teal-600 font-bold">{patientData.ConsultingDoctor}</p>
                    </div>
                  </div>

                  <div className="w-full bg-green-50 border border-green-200 text-green-600 rounded-xl py-4 text-sm font-bold tracking-widest text-center shadow-sm">
                    SUCCESSFULLY DISPATCHED TO QUEUE
                  </div>
                </motion.div>
              ) : routingState === 'uploaded' && patientData ? (
                <motion.div 
                  key="uploaded"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} 
                  className="w-full flex flex-col space-y-8"
                >
                  <div className="w-full bg-white rounded-2xl p-6 border border-slate-200 grid grid-cols-2 gap-y-6 gap-x-4 shadow-sm">
                    <div className="col-span-2 border-b border-slate-100 pb-4">
                      <p className="text-[10px] text-teal-600 uppercase tracking-widest font-bold mb-1">Patient Name</p>
                      <p className="text-2xl font-bold text-slate-900">{patientData.PatientName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Demographics</p>
                      <p className="text-slate-800 font-medium">{patientData.Gender}, {patientData.Age} yrs</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Contact</p>
                      <p className="text-slate-800 font-medium font-mono">{patientData.MobileNumber}</p>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                    onClick={() => setRoutingState('routing')}
                    className="w-full bg-teal-600 text-white py-5 font-bold tracking-widest rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 flex items-center justify-center space-x-3"
                  >
                    <span>VERIFY & PROCEED TO ROUTING</span>
                  </motion.button>
                </motion.div>
              ) : routingState === 'routing' && patientData ? (
                <motion.div 
                  key="routing"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} 
                  className="w-full flex flex-col space-y-6"
                >
                  <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Profile</p>
                      <p className="text-slate-800 font-bold">{patientData.PatientName} • {patientData.Age}y</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-teal-600" />
                    </div>
                  </div>

                  <form onSubmit={handleRoute} className="flex flex-col space-y-6 flex-1">
                    <div className="space-y-4">
                      
                      <div className="relative">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1 mb-1 block">Consulting Physician</label>
                        <select required value={selectedDoctor} onChange={handleDoctorChange} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-4 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all appearance-none cursor-pointer shadow-sm font-medium">
                          <option value="" disabled hidden>Select Physician...</option>
                          {Object.keys(doctorSpecializationMap).map(doc => (
                            <option key={doc} value={doc}>{doc}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1 mb-1 block">OPD Destination</label>
                          <select required value={selectedOPD} onChange={(e) => setSelectedOPD(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-4 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all appearance-none cursor-pointer shadow-sm font-medium">
                            <option value="" disabled hidden>Select OPD...</option>
                            <option value="OPD 1">OPD 1</option>
                            <option value="OPD 2">OPD 2</option>
                            <option value="OPD 3">OPD 3</option>
                          </select>
                        </div>
                        <div className="relative">
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1 mb-1 block">Specialization</label>
                          <select required value={selectedSpecialization} onChange={(e) => setSelectedSpecialization(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-4 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all appearance-none cursor-pointer shadow-sm font-medium">
                            <option value="" disabled hidden>Specialization...</option>
                            {selectedDoctor && doctorSpecializationMap[selectedDoctor] ? (
                              <option value={doctorSpecializationMap[selectedDoctor]}>{doctorSpecializationMap[selectedDoctor]}</option>
                            ) : (
                              ALL_SPECIALIZATIONS.map(spec => (
                                <option key={spec} value={spec}>{spec}</option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>

                    </div>
                    
                    <div className="flex flex-col space-y-4 w-full mt-auto pt-4 border-t border-slate-200">
                      <motion.button type="button" onClick={() => setIsEmergency(!isEmergency)} className={`w-full py-3 text-sm font-bold tracking-widest rounded-xl transition-all flex items-center justify-center border shadow-sm ${isEmergency ? 'bg-red-500 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white text-slate-500 border-slate-300 hover:border-red-300 hover:text-red-500 hover:bg-red-50'}`}>
                        {isEmergency ? 'EMERGENCY OVERRIDE: ACTIVE' : 'MARK AS EMERGENCY'}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-teal-600 text-white border border-teal-600 rounded-xl py-4 font-bold tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20">
                        DISPATCH TO QUEUE
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              ) : isManualEntry ? (
                <motion.div 
                  key="manual"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                  className="flex flex-col items-center space-y-4 text-slate-500"
                >
                  <div className="p-6 rounded-full bg-slate-100 border border-slate-200 shadow-sm">
                    <Keyboard className="w-12 h-12 text-teal-600" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="tracking-widest font-bold text-slate-700">MANUAL OVERRIDE ACTIVE</p>
                    <p className="text-sm">Please provide complete patient demographics.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="waiting"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                  className="flex flex-col items-center space-y-4 text-slate-500"
                >
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import io from 'socket.io-client';
import './ar-display.css';
const INITIAL_DEPARTMENTS = [
  { id: 'ORTHOPEDICS', opdNumber: 'OPD 1', name: 'ORTHOPEDICS', currentToken: null, queue: [], isCalling: false },
  { id: 'GENERAL_PHYSICIAN', opdNumber: 'OPD 2', name: '', currentToken: null, queue: [], isCalling: false },
  { id: 'GYNAECOLOGIST', opdNumber: 'OPD 3', name: '', currentToken: null, queue: [], isCalling: false },
];

export default function ARDisplay() {
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [scale, setScale] = useState(1);
  const [activeTimers, setActiveTimers] = useState({});
  const [now, setNow] = useState(Date.now());
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRefs = useRef([]);
  const fileInputRef = useRef(null);
  const prevCurrents = useRef({});
  const fadeIntervalRef = useRef(null);
  const speakingCountRef = useRef(0);
  const prevIndexRef = useRef(-1);

  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);


  const formatTimeLeft = (endTimeMs) => {
    const diff = Math.max(0, Math.floor((endTimeMs - now) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const updateScale = () => {
      // The design is perfectly optimized for 1920x1080.
      // We calculate the scale required to fit it perfectly into the current screen without squishing or cutting off elements.
      const targetRatio = 1920 / 1080;
      const currentRatio = window.innerWidth / window.innerHeight;
      let newScale = 1;
      if (currentRatio > targetRatio) {
        newScale = window.innerHeight / 1080; // Fit by height
      } else {
        newScale = window.innerWidth / 1920; // Fit by width
      }
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const API_BASE = "https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net";

  const fetchPlaylist = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/videos`);
      const data = await res.json();
      if (data.success && data.videos.length > 0) {
        setVideos(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data.videos)) {
            return data.videos;
          }
          return prev;
        });
      }
    } catch (e) {
      console.error("Failed to fetch playlist", e);
    }
  };

  useEffect(() => {
    fetchPlaylist();
    const interval = setInterval(fetchPlaylist, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (videos.length > 0 && currentVideoIndex >= videos.length) {
      setCurrentVideoIndex(0);
    }
  }, [videos, currentVideoIndex]);

  const handleVideoEnded = () => {
    if (videos.length > 0) {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    }
  };

  const triggerUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileUpload = (e) => {
    // Ignored since we are using live db now
  };

  const formatNameForTTS = (name) => {
    if (!name) return "";
    return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const fadeAudio = (targetVolume, durationMs = 1000) => {
    const activeVideo = videoRefs.current[currentVideoIndex];
    if (!activeVideo) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const startVolume = activeVideo.volume;
    const change = targetVolume - startVolume;
    const steps = 20;
    const stepTime = durationMs / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (videoRefs.current[currentVideoIndex]) {
        let newVol = startVolume + (change * (currentStep / steps));
        newVol = Math.max(0, Math.min(1, newVol));
        videoRefs.current[currentVideoIndex].volume = newVol;
      }
      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (videoRefs.current[currentVideoIndex]) {
          videoRefs.current[currentVideoIndex].volume = targetVolume;
        }
      }
    }, stepTime);
  };

  const announceToken = async (token, patient, department, specialization, opdNumber, gender) => {
    let destination = opdNumber;
    const formattedPatientName = formatNameForTTS(patient);

    let title = "";
    const lowerName = formattedPatientName.toLowerCase();
    if (!lowerName.startsWith("mr.") && !lowerName.startsWith("mrs.") && !lowerName.startsWith("ms.") && !lowerName.startsWith("miss ") && !lowerName.startsWith("mr ") && !lowerName.startsWith("mrs ")) {
      if (gender === "Male") title = "Mr. ";
      else if (gender === "Female") title = "Mrs. ";
    }

    const textToSpeak = `Token ${token}, ${title}${formattedPatientName}, please proceed to ${destination}.`;

    speakingCountRef.current += 1;
    fadeAudio(0.02, 500); // fade out video almost completely to 2%

    const onSpeakEnd = () => {
      speakingCountRef.current -= 1;
      if (speakingCountRef.current <= 0) {
        speakingCountRef.current = 0;
        fadeAudio(0.3, 2000); // fade back to 30% over 2 seconds
      }
    };

    let isNativeCapacitor = false;
    let capTextToSpeech = null;

    if (typeof window !== 'undefined') {
      try {
        const { Capacitor } = await import('@capacitor/core');
        isNativeCapacitor = Capacitor.isNativePlatform();
        if (isNativeCapacitor) {
          const ttsModule = await import('@capacitor-community/text-to-speech');
          capTextToSpeech = ttsModule.TextToSpeech;
        }
      } catch (e) {
        console.error("Failed to load Capacitor TTS dynamically", e);
      }
    }

    if (isNativeCapacitor && capTextToSpeech) {
      try {
        await capTextToSpeech.speak({
          text: textToSpeak,
          lang: 'en-IN',
          rate: 0.9,
          pitch: 1.0,
          volume: 1.0,
        });
        onSpeakEnd();
      } catch (e) {
        console.error("Native TTS Error: ", e);
        onSpeakEnd();
      }
    } else if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance();
      msg.text = textToSpeak;

      window.speechSynthesis.cancel(); // Clear any stuck Android TTS queues

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India') || v.name.includes('Indian')) || voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('en-GB') || v.name.includes('en-US'));
        if (preferredVoice) msg.voice = preferredVoice;
      }
      msg.rate = 0.9;
      msg.pitch = 1;
      msg.volume = 1.0; // Maximize AI voice volume

      msg.onend = onSpeakEnd;
      msg.onerror = onSpeakEnd;

      window.speechSynthesis.speak(msg);
    } else {
      onSpeakEnd();
    }
  };

  const fetchLivePatients = async () => {
    try {
      const newDeps = await Promise.all(INITIAL_DEPARTMENTS.map(async (dep) => {
        const res = await fetch(`https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/patients/opd/${dep.opdNumber}`);
        const data = await res.json();
        const patients = data.success ? data.patients : [];

        const statusRes = await fetch(`https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net/api/opd/${dep.opdNumber}/status`);
        const statusData = await statusRes.json();
        const doctorStatus = statusData.success ? statusData.status : 'AVAILABLE';

        const visiblePatients = patients.filter(p => p.QueueStatus !== 'HOLD');

        const activePatient = visiblePatients.find(p => p.IsActive === true || p.IsActive === 1);
        let currentToken = null;

        if (activePatient) {
          currentToken = {
            token: activePatient.IsEmergency && activePatient.EmergencyTokenNumber ? `EMR${activePatient.EmergencyTokenNumber.toString().padStart(3, '0')}` : (activePatient.OpdTokenNumber ? activePatient.OpdTokenNumber.toString() : activePatient.PatientID.toString().padStart(4, '0')),
            patientName: activePatient.PatientName,
            gender: activePatient.Gender,
            isEmergency: activePatient.IsEmergency,
            doctor: activePatient.ConsultingDoctor,
            specialization: activePatient.Specialization
          };
        }

        let isCalling = false;

        if (currentToken && currentToken.token !== prevCurrents.current[dep.id]) {
          prevCurrents.current[dep.id] = currentToken.token;
          announceToken(currentToken.token, currentToken.patientName, dep.name, currentToken.specialization, dep.opdNumber, currentToken.gender);
          isCalling = true;
        }

        const remainingPatients = visiblePatients.filter(p => !activePatient || p.PatientID !== activePatient.PatientID);
        const queueTokens = remainingPatients.map(p => ({
          token: p.IsEmergency && p.EmergencyTokenNumber ? `EMR${p.EmergencyTokenNumber.toString().padStart(3, '0')}` : (p.OpdTokenNumber ? p.OpdTokenNumber.toString() : p.PatientID.toString().padStart(4, '0')),
          patientName: p.PatientName,
          isEmergency: p.IsEmergency,
          isAvailable: false
        }));

        const maxUpcoming = dep.id === 'ORTHOPEDICS' ? 5 : 2;
        const paddedQueue = [];
        for (let i = 0; i < maxUpcoming; i++) {
          if (i < queueTokens.length) {
            paddedQueue.push(queueTokens[i]);
          } else {
            paddedQueue.push({ token: '---', patientName: 'Available', isAvailable: true });
          }
        }

        return {
          ...dep,
          currentToken,
          queue: paddedQueue,
          isCalling,
          doctor: currentToken ? currentToken.doctor : (patients.length > 0 ? patients[0].ConsultingDoctor : null),
          specialization: currentToken ? currentToken.specialization : (patients.length > 0 ? patients[0].Specialization : null),
          doctorStatus,
          timerInfo: statusData
        };
      }));

      setDepartments(newDeps);

      // Sync timers from backend on load/refresh so all devices share the state
      setActiveTimers(prev => {
        const syncedTimers = { ...prev };
        let changed = false;
        newDeps.forEach(dep => {
          if (dep.timerInfo?.hasTimer && dep.timerInfo?.isActive && dep.timerInfo?.endTime) {
            if (syncedTimers[dep.opdNumber] !== dep.timerInfo.endTime) {
              syncedTimers[dep.opdNumber] = dep.timerInfo.endTime;
              changed = true;
            }
          } else if (syncedTimers[dep.opdNumber]) {
            delete syncedTimers[dep.opdNumber];
            changed = true;
          }
        });
        return changed ? syncedTimers : prev;
      });

      const callingDeps = newDeps.filter(d => d.isCalling);
      if (callingDeps.length > 0) {
        setTimeout(() => {
          setDepartments(prev => prev.map(d => callingDeps.find(cd => cd.id === d.id) ? { ...d, isCalling: false } : d));
        }, 5000);
      }
    } catch (error) {
      console.error("Failed to fetch live patients", error);
    }
  };

  useEffect(() => {
    fetchLivePatients();
    const socket = io("https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net");
    socket.on("queue_updated", fetchLivePatients);
    socket.on("doctor_status_changed", fetchLivePatients);

    socket.on("ot_timer_started", (data) => {
      setActiveTimers(prev => ({ ...prev, [data.opdId]: data.endTime }));
    });

    socket.on("ot_timer_ended", (data) => {
      setActiveTimers(prev => {
        const copy = { ...prev };
        delete copy[data.opdId];
        return copy;
      });
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (videos.length > 0) {
      videos.forEach((_, idx) => {
        const v = videoRefs.current[idx];
        if (v) {
          if (idx === currentVideoIndex) {
            v.volume = speakingCountRef.current > 0 ? 0.01 : 0.08; // Base volume very low to avoid irritating disparities
            if (prevIndexRef.current !== currentVideoIndex) {
              v.currentTime = 0;
            }
            const playPromise = v.play();
            if (playPromise !== undefined) {
              playPromise.catch(e => console.log("Autoplay prevented or interrupted:", e));
            }
          } else {
            v.pause();
            // Removed v.currentTime = 0 to prevent glitching the last frame during fade-out
          }
        }
      });
      prevIndexRef.current = currentVideoIndex;
    }
  }, [currentVideoIndex, videos]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden', position: 'relative' }}>
      <div
        className="app-container"
        style={{
          width: '1920px',
          height: '1080px',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0
        }}
      >
        {/* Hidden file input for uploading excel */}
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          ref={fileInputRef}
          className="file-input"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {/* LEFT SECTION - OPD 1 (Orthopedics) */}
        <div className="left-sidebar">
          {/* Original Branding */}
          <div className="hospital-branding" onClick={triggerUpload} title="Click to upload Excel">
            <div className="hospital-logo">
              <img src="/logo.png" alt="AR Hospital Logo" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <div style={{ display: 'none', color: '#8c1538', fontWeight: 'bold' }}>AR</div>
            </div>
          </div>

          <div className="queue-list">
            {departments.filter(dep => dep.id === 'ORTHOPEDICS').map((dep) => (
              <div
                key={dep.id}
                className={`opd-panel opd-large ${dep.isCalling ? 'active-calling' : ''}`}
              >
                {dep.isCalling && <Volume2 className="speaker-icon" size={24} />}

                <div className="opd-header">
                  <div className="department-name">{dep.opdNumber} - {dep.name}</div>
                  <div className={`status-badge ${dep.isCalling ? '' : 'serving'}`}>
                    {activeTimers[dep.opdNumber] ? 'DOCTOR IN OT' : (dep.doctorStatus === 'AWAY' ? 'DOCTOR IS AWAY' : (dep.doctorStatus === 'HOLIDAY' ? 'DOCTOR ON HOLIDAY' : (dep.isCalling ? 'NOW CALLING' : (dep.currentToken ? 'SERVING' : 'NO QUEUE'))))}
                  </div>
                </div>

                {activeTimers[dep.opdNumber] ? (
                  <div className="token-display slide-up">
                    <div className="current-token-area">
                      <div className="token-label" style={{ color: '#ef4444' }}>DOCTOR IN OT</div>
                      <div className="patient-name">QUEUE PAUSED</div>
                    </div>
                  </div>
                ) : dep.doctorStatus === 'AWAY' ? (
                  <div className="token-display slide-up">
                    <div className="current-token-area">
                      <div className="token-label" style={{ color: '#f97316' }}>DOCTOR IS AWAY</div>
                      <div className="patient-name">QUEUE PAUSED</div>
                    </div>
                  </div>
                ) : dep.doctorStatus === 'HOLIDAY' ? (
                  <div className="token-display slide-up">
                    <div className="current-token-area">
                      <div className="token-label" style={{ color: '#a855f7' }}>DOCTOR ON HOLIDAY</div>
                      <div className="patient-name" style={{ fontSize: '1.5rem' }}>NO PATIENTS CAN BE SERVED</div>
                    </div>
                  </div>
                ) : (
                  <div className="token-display slide-up" key={dep.currentToken?.token || 'empty'}>
                    <div className="current-token-area">
                      <div className="token-label">NOW CALLING</div>
                      <div className="token-number">{dep.currentToken ? dep.currentToken.token : '---'}</div>
                      <div className="patient-name">{dep.currentToken ? dep.currentToken.patientName : 'Available'}</div>
                    </div>
                  </div>
                )}

                {/* Next 5 in Queue or Timer */}
                {activeTimers[dep.opdNumber] ? (
                  <div className="queue-extended ot-timer-container">
                    <div className="queue-header" style={{ color: '#ef4444' }}>RESUMING IN</div>
                    <div className="ot-timer-display" style={{ fontSize: '4rem', fontWeight: 'bold', textAlign: 'center', padding: '1rem', color: '#ef4444', fontFamily: 'monospace' }}>
                      {formatTimeLeft(activeTimers[dep.opdNumber])}
                    </div>
                  </div>
                ) : (dep.doctorStatus === 'AWAY' || dep.doctorStatus === 'HOLIDAY') ? (
                  <div className="queue-extended" style={{ opacity: 0.5 }}>
                    <div className="queue-header">UPCOMING QUEUE (PAUSED)</div>
                    <div className="queue-items">
                      {dep.queue.map((q, idx) => (
                        <div key={idx} className={`queue-item slide-up ${q.isAvailable ? 'available' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                          <div className="q-token" style={{ color: q.isEmergency ? '#ef4444' : '' }}>{q.token}</div>
                          <div className="q-name" style={{ color: q.isEmergency ? '#ef4444' : '' }}>{q.patientName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="queue-extended">
                    <div className="queue-header">UPCOMING QUEUE</div>
                    <div className="queue-items">
                      {dep.queue.map((q, idx) => (
                        <div key={idx} className={`queue-item slide-up ${q.isAvailable ? 'available' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                          <div className="q-token" style={{ color: q.isEmergency ? '#ef4444' : '' }}>{q.token}</div>
                          <div className="q-name" style={{ color: q.isEmergency ? '#ef4444' : '' }}>{q.patientName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* QR CODES - LEFT SIDEBAR */}
          <div className="qr-container">
            <div className="qr-dummy" style={{ padding: '8px' }}>
              <img src="/qr1_left.png" alt="QR 1 Left" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="qr-dummy" style={{ padding: '8px' }}>
              <img src="/qr2_left.png" alt="QR 2 Left" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="qr-dummy" style={{ padding: '8px' }}>
              <img src="/qr3_left.png" alt="QR 3 Left" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>

        {/* CENTER SECTION - DYNAMIC VIDEO LOOP */}
        <div className="video-section">
          {videos.length > 0 ? (
            videos.map((src, index) => {
              const isCurrent = index === currentVideoIndex;
              const isNext = index === (currentVideoIndex + 1) % videos.length;
              
              // Only render the current and next video to save TV memory and prevent freezing
              if (!isCurrent && !isNext) return null;

              return (
                <video
                  key={src}
                  ref={el => { if (el) videoRefs.current[index] = el }}
                  src={src}
                  className="bg-video"
                  style={{
                    opacity: isCurrent ? 1 : 0,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transition: 'opacity 0.8s ease-in-out',
                    zIndex: isCurrent ? 1 : 0,
                    pointerEvents: 'none'
                  }}
                  muted={false}
                  autoPlay={isCurrent}
                  playsInline
                  preload={isCurrent ? "auto" : "metadata"}
                  disableRemotePlayback
                  onEnded={() => {
                    if (isCurrent) handleVideoEnded();
                  }}
                  onError={() => {
                    if (isCurrent) handleVideoEnded();
                  }}
                />
              )
            })
          ) : (
            <div className="bg-video" style={{ backgroundColor: 'transparent' }}></div>
          )}
          <div className="video-overlay"></div>
        </div>

        {/* RIGHT SECTION - OPD 2 & 3 */}
        <div className="right-sidebar">
          {/* Original Branding */}
          <div className="hospital-branding">
            <div className="hospital-logo">
              <img src="/logo.png" alt="AR Hospital Logo" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <div style={{ display: 'none', color: '#8c1538', fontWeight: 'bold' }}>AR</div>
            </div>
          </div>

          <div className="queue-list">
            {departments.filter(dep => dep.id !== 'ORTHOPEDICS').map((dep) => (
              <div
                key={dep.id}
                className={`opd-panel ${dep.isCalling ? 'active-calling' : ''} ${dep.opdNumber === 'OPD 3' ? 'opd3-panel' : ''}`}
              >
                {dep.isCalling && <Volume2 className="speaker-icon" size={24} />}

                <div className="opd-header">
                  <div className="department-name" style={{ color: '#8C1538' }}>
                    {dep.opdNumber} {dep.specialization && dep.specialization !== "N/A" ? `(${dep.specialization.toUpperCase()})` : ""}
                  </div>
                  <div className={`status-badge ${dep.isCalling ? '' : 'serving'}`}>
                    {activeTimers[dep.opdNumber] ? 'DOCTOR IN OT' : (dep.doctorStatus === 'AWAY' ? 'DOCTOR IS AWAY' : (dep.doctorStatus === 'HOLIDAY' ? 'DOCTOR ON HOLIDAY' : (dep.isCalling ? 'NOW CALLING' : (dep.currentToken ? 'SERVING' : 'NO QUEUE'))))}
                  </div>
                </div>

                {/* Dynamic Doctor Name */}
                {dep.doctor && dep.doctor !== "N/A" && (
                  <div style={{ color: '#000000', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', marginTop: '-0.5rem' }}>
                    {dep.doctor.toUpperCase()}
                  </div>
                )}

                {activeTimers[dep.opdNumber] ? (
                  <div className="token-display slide-up">
                    <div className="current-token-area">
                      <div className="token-label" style={{ color: '#ef4444' }}>DOCTOR IN OT</div>
                      <div className="patient-name">QUEUE PAUSED</div>
                    </div>
                  </div>
                ) : dep.doctorStatus === 'AWAY' ? (
                  <div className="token-display slide-up">
                    <div className="current-token-area">
                      <div className="token-label" style={{ color: '#f97316' }}>DOCTOR IS AWAY</div>
                      <div className="patient-name">QUEUE PAUSED</div>
                    </div>
                  </div>
                ) : dep.doctorStatus === 'HOLIDAY' ? (
                  <div className="token-display slide-up">
                    <div className="current-token-area">
                      <div className="token-label" style={{ color: '#a855f7' }}>DOCTOR ON HOLIDAY</div>
                      <div className="patient-name" style={{ fontSize: '1.2rem' }}>NO PATIENTS CAN BE SERVED</div>
                    </div>
                  </div>
                ) : (
                  <div className="token-display slide-up" key={dep.currentToken?.token || 'empty'}>
                    <div className="current-token-area">
                      <div className={`token-label ${dep.currentToken?.isEmergency ? 'text-red-500 font-bold' : ''}`}>
                        {dep.currentToken?.isEmergency ? 'EMERGENCY' : 'NOW CALLING'}
                      </div>
                      <div className="token-number" style={{ color: dep.currentToken?.isEmergency ? '#ef4444' : '' }}>{dep.currentToken ? dep.currentToken.token : '---'}</div>
                      <div className="patient-name">{dep.currentToken ? dep.currentToken.patientName : 'Available'}</div>
                    </div>
                  </div>
                )}

                {/* Next 2 in Queue or Timer */}
                {activeTimers[dep.opdNumber] ? (
                  <div className="queue-extended ot-timer-container" style={{ marginTop: '1rem', paddingTop: '1rem' }}>
                    <div className="queue-header" style={{ color: '#ef4444' }}>RESUMING IN</div>
                    <div className="ot-timer-display" style={{ fontSize: '4rem', fontWeight: 'bold', textAlign: 'center', padding: '1rem', color: '#ef4444', fontFamily: 'monospace' }}>
                      {formatTimeLeft(activeTimers[dep.opdNumber])}
                    </div>
                  </div>
                ) : (dep.doctorStatus === 'AWAY' || dep.doctorStatus === 'HOLIDAY') ? (
                  <div className="queue-extended" style={{ marginTop: '1rem', paddingTop: '1rem', opacity: 0.5 }}>
                    <div className="queue-header">UPCOMING QUEUE (PAUSED)</div>
                    <div className="queue-items">
                      {dep.queue.map((q, idx) => (
                        <div key={idx} className={`queue-item slide-up ${q.isAvailable ? 'available' : ''}`} style={{ animationDelay: `${idx * 0.1}s`, padding: '0.5rem 1rem' }}>
                          <div className="q-token" style={{ fontSize: '1.2rem', width: 'auto', minWidth: '60px', color: q.isEmergency ? '#ef4444' : '' }}>{q.token}</div>
                          <div className="q-name" style={{ color: q.isEmergency ? '#ef4444' : '' }}>{q.patientName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="queue-extended" style={{ marginTop: '1rem', paddingTop: '1rem' }}>
                    <div className="queue-header">UPCOMING QUEUE</div>
                    <div className="queue-items">
                      {dep.queue.map((q, idx) => (
                        <div key={idx} className={`queue-item slide-up ${q.isAvailable ? 'available' : ''}`} style={{ animationDelay: `${idx * 0.1}s`, padding: '0.5rem 1rem' }}>
                          <div className="q-token" style={{ fontSize: '1.2rem', width: 'auto', minWidth: '60px', color: q.isEmergency ? '#ef4444' : '' }}>{q.token}</div>
                          <div className="q-name" style={{ color: q.isEmergency ? '#ef4444' : '' }}>{q.patientName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* QR CODES - RIGHT SIDEBAR */}
          <div className="qr-container">
            <div className="qr-dummy" style={{ padding: '8px' }}>
              <img src="/qr1_right.png" alt="QR 1 Right" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="qr-dummy" style={{ padding: '8px' }}>
              <img src="/qr2_right.png" alt="QR 2 Right" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="qr-dummy" style={{ padding: '8px' }}>
              <img src="/qr3_right.png" alt="QR 3 Right" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

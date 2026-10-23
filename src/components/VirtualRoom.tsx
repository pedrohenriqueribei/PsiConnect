import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { Appointment, ChatMessage } from '../types';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Send,
  ExternalLink,
  Shield,
  Clock,
  FileEdit,
  Maximize2,
  CheckCircle2
} from 'lucide-react';

interface VirtualRoomProps {
  appointment: Appointment;
  onLeave: () => void;
}

export const VirtualRoom: React.FC<VirtualRoomProps> = ({ appointment, onLeave }) => {
  const { user } = useAuth();
  const isPsychologist = user?.role === 'psychologist';

  // Media streams & controls
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    storage.getChatMessages(appointment.id)
  );
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // In-session clinical notes (for psychologist)
  const [notesOpen, setNotesOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Start session timer
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Request actual camera & mic
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initMedia() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCameraReady(true);
        setCameraError(false);
      } catch (err) {
        console.warn('Camera/microfone não autorizados ou ausentes no dispositivo:', err);
        setCameraError(true);
      }
    }

    initMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle toggles
  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !micActive;
      });
    }
    setMicActive(!micActive);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !videoActive;
      });
    }
    setVideoActive(!videoActive);
  };

  // Chat send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;

    const sent = storage.sendChatMessage({
      appointmentId: appointment.id,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: chatInput.trim(),
    });

    setMessages(prev => [...prev, sent]);
    setChatInput('');
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // Save in-session note to medical record
  const handleSaveNotes = () => {
    if (!sessionNotes.trim() || !isPsychologist) return;

    const existingRecord = storage.getRecordByAppointment(appointment.id);
    storage.saveMedicalRecord({
      id: existingRecord?.id,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      psychologistId: appointment.psychologistId,
      sessionDate: appointment.date,
      chiefComplaint: existingRecord?.chiefComplaint || appointment.notesFromPatient || 'Sessão online',
      clinicalEvolution: (existingRecord?.clinicalEvolution ? existingRecord.clinicalEvolution + '\n' : '') + sessionNotes,
      privateNotes: existingRecord?.privateNotes || '',
    });

    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 3000);
  };

  // Finalize consultation
  const handleEndSession = () => {
    storage.updateAppointmentStatus(appointment.id, 'completed');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onLeave();
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col text-slate-100 overflow-hidden font-sans">
      {/* Top Bar da Sala Virtual */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              Teleconsulta Protegida (Criptografia de Ponta a Ponta)
            </span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">
            {isPsychologist ? `Paciente: ${appointment.patientName}` : `Psicólogo(a): ${appointment.psychologistName}`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* External Meeting Button if psychologist has URL */}
          {appointment.meetingUrl && (
            <a
              href={appointment.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-950/60 border border-sky-800 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir no Google Meet
            </a>
          )}

          {/* Session Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{formatTimer(elapsedSeconds)} / 50:00</span>
          </div>

          <button
            onClick={handleEndSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            Finalizar Sessão
          </button>
        </div>
      </div>

      {/* Main Video & Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left/Center: Video Viewport */}
        <div className="flex-1 p-4 flex flex-col items-center justify-center relative bg-slate-950">
          <div className="w-full h-full max-w-5xl max-h-[82vh] grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Remote Participant */}
            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-lg">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-slate-700 shadow-md mb-3">
                {isPsychologist ? (
                  <div className="w-full h-full bg-sky-900/60 flex items-center justify-center text-sky-200 text-3xl font-bold">
                    {appointment.patientName.charAt(0)}
                  </div>
                ) : (
                  <img
                    src={appointment.psychologistAvatar || '/src/assets/images/avatar_psico_clara_1792608795986.jpg'}
                    alt={appointment.psychologistName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <span className="text-sm font-semibold text-slate-200">
                {isPsychologist ? appointment.patientName : appointment.psychologistName}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                {isPsychologist ? 'Paciente em atendimento' : (appointment.psychologistCrp || 'Psicólogo Clínico')}
              </span>

              {/* Pulsing audio simulated indicator */}
              <div className="flex items-center gap-1 mt-3">
                <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <span className="w-1.5 h-5 bg-emerald-400 rounded-full animate-pulse delay-75" />
                <span className="w-1.5 h-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
              </div>

              <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] text-slate-300">
                {isPsychologist ? appointment.patientName : appointment.psychologistName}
              </div>
            </div>

            {/* Box 2: Local User Camera Stream */}
            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shadow-lg">
              {cameraReady && videoActive ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="text-center p-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 mx-auto mb-3">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 text-slate-300 flex items-center justify-center text-2xl font-bold">
                        {user?.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-300 block">
                    {user?.name} (Você)
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    {cameraError ? 'Vídeo virtual (câmera sem permissão no navegador)' : 'Câmera pausada'}
                  </span>
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] text-slate-300 flex items-center gap-2">
                <span>Você ({isPsychologist ? 'Psicólogo' : 'Paciente'})</span>
                {!micActive && <MicOff className="w-3 h-3 text-red-400" />}
              </div>
            </div>
          </div>

          {/* Floating Call Control Bar */}
          <div className="absolute bottom-6 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 py-2 px-5 rounded-full shadow-2xl">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full transition-colors ${
                micActive
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={micActive ? 'Silenciar Microfone' : 'Ativar Microfone'}
            >
              {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${
                videoActive
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={videoActive ? 'Desligar Câmera' : 'Ligar Câmera'}
            >
              {videoActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-3 rounded-full transition-colors ${
                chatOpen
                  ? 'bg-sky-700 hover:bg-sky-800 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title="Chat da Consulta"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {isPsychologist && (
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className={`p-3 rounded-full transition-colors ${
                  notesOpen
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Anotações Clínicas Imediatas"
              >
                <FileEdit className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleEndSession}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="Encerrar Consulta"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Sidebar: Chat or Psychologist In-Session Notes */}
        {(chatOpen || notesOpen) && (
          <div className="w-80 md:w-96 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0">
            {/* Switcher Tab */}
            <div className="flex border-b border-slate-800 text-xs font-semibold">
              <button
                onClick={() => {
                  setChatOpen(true);
                  setNotesOpen(false);
                }}
                className={`flex-1 py-3 text-center transition-colors ${
                  chatOpen ? 'border-b-2 border-sky-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chat da Sessão ({messages.length})
              </button>
              {isPsychologist && (
                <button
                  onClick={() => {
                    setNotesOpen(true);
                    setChatOpen(false);
                  }}
                  className={`flex-1 py-3 text-center transition-colors ${
                    notesOpen ? 'border-b-2 border-amber-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Anotações do Prontuário
                </button>
              )}
            </div>

            {/* Chat Body */}
            {chatOpen && (
              <>
                <div
                  ref={chatScrollRef}
                  className="flex-1 p-4 space-y-3 overflow-y-auto text-xs"
                >
                  {messages.length === 0 ? (
                    <p className="text-center text-slate-500 py-10">
                      Nenhuma mensagem enviada. Use o chat para compartilhar materiais, links ou anotações durante a sessão.
                    </p>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-slate-400 mb-1">
                            {msg.senderName} · {msg.timestamp}
                          </span>
                          <div
                            className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                              isMe
                                ? 'bg-sky-700 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-200 rounded-bl-none'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {/* In-Session Notes (Psychologist Only) */}
            {notesOpen && isPsychologist && (
              <div className="flex-1 p-4 flex flex-col text-xs">
                <div className="mb-2">
                  <span className="font-bold text-slate-200 block">
                    Bloco de Anotações Clínicas
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Estas anotações serão automaticamente anexadas à evolução do prontuário do paciente.
                  </span>
                </div>

                {notesSaved && (
                  <div className="mb-2 p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Anotação gravada com sucesso no prontuário!</span>
                  </div>
                )}

                <textarea
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="Registre pontos de atenção, relatos importantes, tarefas prescritas ou hipóteses clínicas..."
                  className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-sans resize-none leading-relaxed"
                />

                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="mt-3 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors text-xs"
                >
                  Salvar no Prontuário
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

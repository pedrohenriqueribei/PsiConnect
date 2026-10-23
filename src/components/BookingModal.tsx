import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { User, AvailabilitySlot, Appointment } from '../types';
import { X, Calendar, Clock, DollarSign, CheckCircle2, Shield, AlertCircle } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  psychologist: User;
  onBookingSuccess: (appointment: Appointment) => void;
  onOpenAuth: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  psychologist,
  onBookingSuccess,
  onOpenAuth,
}) => {
  const { user } = useAuth();

  // Generate next 14 days for selection
  const availableDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // Start tomorrow or today
    return {
      dateStr: d.toISOString().split('T')[0],
      dayOfWeek: d.getDay(),
      dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      dateFormatted: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    };
  });

  const [selectedDate, setSelectedDate] = useState<string>(availableDays[0].dateStr);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientNotes, setPatientNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Selected day of week
  const currentSelectedDayObj = availableDays.find(d => d.dateStr === selectedDate);
  const selectedDayOfWeek = currentSelectedDayObj ? currentSelectedDayObj.dayOfWeek : 1;

  // Get psychologist slots for that day
  const slots: AvailabilitySlot[] = storage
    .getAvailabilitySlots(psychologist.id)
    .filter(s => s.dayOfWeek === selectedDayOfWeek && s.isActive);

  // Check existing appointments on that date to avoid collision
  const existingApts = storage
    .getAppointments(psychologist.id, 'psychologist')
    .filter(a => a.date === selectedDate && a.status !== 'cancelled');
  const bookedTimes = new Set(existingApts.map(a => a.time));

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      onOpenAuth();
      return;
    }

    if (!selectedTime) {
      setErrorMsg('Por favor, selecione um horário para a consulta.');
      return;
    }

    setIsSubmitting(true);

    const [h, m] = selectedTime.split(':').map(Number);
    const endMinutes = m + 50;
    const endH = endMinutes >= 60 ? h + 1 : h;
    const finalM = endMinutes >= 60 ? endMinutes - 60 : endMinutes;
    const endTime = `${endH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;

    const newApt = storage.createAppointment({
      psychologistId: psychologist.id,
      psychologistName: psychologist.name,
      psychologistAvatar: psychologist.avatar,
      psychologistCrp: psychologist.crp,
      patientId: user.id,
      patientName: user.name,
      patientEmail: user.email,
      patientPhone: user.phone,
      date: selectedDate,
      time: selectedTime,
      endTime,
      meetingType: psychologist.defaultMeetingType || 'native',
      meetingUrl: psychologist.externalMeetingUrl,
      notesFromPatient: patientNotes,
    });

    setIsSubmitting(false);
    onBookingSuccess(newApt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            {psychologist.avatar ? (
              <img
                src={psychologist.avatar}
                alt={psychologist.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-sm">
                {psychologist.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {psychologist.name}
              </h3>
              <div className="text-xs text-slate-500 font-medium">
                {psychologist.crp} · {psychologist.city || 'Atendimento Online'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing & Duration Bar */}
        <div className="px-6 py-2.5 bg-sky-50/50 border-b border-sky-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-sky-900">
            <DollarSign className="w-4 h-4 text-sky-700" />
            <span>Valor: R$ {psychologist.hourlyRate || 180},00 / sessão</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Duração: 50 minutos</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Escolha a Data */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-700" />
              1. Selecione a Data
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {availableDays.map(d => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d.dateStr);
                    setSelectedTime('');
                  }}
                  className={`flex-shrink-0 w-16 p-2 rounded-lg border text-center transition-all ${
                    selectedDate === d.dateStr
                      ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold ring-1 ring-sky-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-[10px] uppercase font-semibold text-slate-400">
                    {d.dayName}
                  </span>
                  <span className="block text-sm font-semibold mt-0.5 tabular-nums">
                    {d.dateFormatted}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Escolha o Horário Disponível */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-700" />
              2. Horários Livres para Esta Data
            </label>

            {slots.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                O profissional não atende neste dia da semana. Por favor, escolha outra data acima.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map(slot => {
                  const isBooked = bookedTimes.has(slot.startTime);
                  const isSelected = selectedTime === slot.startTime;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedTime(slot.startTime)}
                      className={`py-2 px-2.5 text-xs rounded-lg border font-semibold tabular-nums transition-all ${
                        isBooked
                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                          : isSelected
                          ? 'border-sky-700 bg-sky-700 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-sky-500 hover:bg-sky-50/50'
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Motivo ou Queixa Principal */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              3. Queixa Inicial ou Assunto Principal (Opcional)
            </label>
            <textarea
              rows={2}
              value={patientNotes}
              onChange={e => setPatientNotes(e.target.value)}
              placeholder="Ex: Gostaria de apoio com estresse e ansiedade no trabalho..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600"
            />
          </div>

          {/* Ethical Security Note */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
            <Shield className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <span>
              Ao agendar, você garante sua vaga exclusiva. Todas as consultas são conduzidas sob estrito sigilo ético profissional do Conselho Federal de Psicologia (CFP).
            </span>
          </div>

          {/* Action button */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedTime}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {user ? 'Confirmar Agendamento' : 'Acessar para Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

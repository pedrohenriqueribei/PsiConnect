import React from 'react';
import { Shield, Clock, Video, Lock, ArrowRight, UserPlus, CheckCircle2 } from 'lucide-react';

interface LandingHeroProps {
  onFindPsychologist: () => void;
  onRegisterPsychologist: () => void;
  onOpenAuth: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onFindPsychologist,
  onRegisterPsychologist,
  onOpenAuth,
}) => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section Split */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xs overflow-hidden">
          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-800">
                <Shield className="w-4 h-4 text-sky-700" />
                <span>Plataforma Conforme com as Diretrizes do CFP</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-slate-500">Sigilo Criptografado</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight text-balance">
                Cuidado psicológico ético, humano e acessível de onde você estiver.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Conecte-se com psicólogos com registro profissional verificado no Conselho Regional de Psicologia. Agendamento em tempo real, teleconsultas seguras e prontuário sigiloso.
              </p>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onFindPsychologist}
                className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors"
              >
                Buscar Psicólogo
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onRegisterPsychologist}
                className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Sou Psicólogo e Quero Atender
              </button>
            </div>

            {/* Trust points */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                CRP 100% Verificado
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                Sessões Não Gravadas
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Agendamento Imediato
              </span>
            </div>
          </div>

          {/* Right Image Column */}
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full rounded-2xl overflow-hidden border border-slate-100 shadow-xs">
            <img
              src="/src/assets/images/hero_psychology_clinic_1792608795226.jpg"
              alt="Consultório acolhedor de psicologia clínica para teleatendimentos"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent flex items-end p-6">
              <div className="text-white">
                <p className="text-xs font-semibold text-sky-200">Ambiente Terapêutico Seguro</p>
                <p className="text-sm font-bold">Tecnologia a serviço da saúde mental e acolhimento.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block mb-1">
            Fluxo Transparente
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Como funciona o PsiConnect
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Simples para pacientes, completo e organizado para os profissionais de saúde mental.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-base">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Escolha seu Especialista
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Filtre por abordagem terapêutica (TCC, Psicanálise, Gestalt, Humanista), demandas específicas e valor de consulta.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-base">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Agende o Melhor Horário
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consulte a disponibilidade em tempo real lançada pelo psicólogo e reserve a sessão com confirmação automática.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-base">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Teleconsulta com Privacidade
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No horário agendado, entre na sala virtual protegida diretamente pelo navegador ou através do link seguro da sua escolha.
            </p>
          </div>
        </div>
      </section>

      {/* Ethics & Regulation Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
              Regulamentação e Ética
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              Atendimento psicológico regulamentado pelo Conselho Federal de Psicologia.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              A prestação de serviços psicológicos por meios de tecnologia da informação e comunicação é autorizada pela Resolução CFP nº 011/2018. Todos os dados clínicos e prontuários permanecem sob sigilo absoluto.
            </p>
          </div>

          <div className="space-y-3 bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Prontuário Eletrônico Sigiloso</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Anotações de evolução clínica acessíveis somente ao psicólogo responsável pelo caso.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Transparência em Honorários</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sem taxas ocultas. Valores por sessão acordados de forma clara e profissional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

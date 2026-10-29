import React from 'react';
import { 
  Shield, 
  Clock, 
  ArrowRight, 
  UserPlus, 
  CheckCircle2, 
  Heart, 
  LogIn, 
  Sparkles, 
  BookOpen,
  Brain,
  Leaf,
  Compass,
  Users,
  Award
} from 'lucide-react';

interface LandingHeroProps {
  onFindPsychologist: () => void;
  onRegisterPsychologist: () => void;
  onRegisterPatient: () => void;
  onOpenLogin: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onFindPsychologist,
  onRegisterPsychologist,
  onRegisterPatient,
  onOpenLogin,
}) => {
  return (
    <div className="space-y-16 py-6 sm:py-8">
      {/* 1. Hero Section Welcome Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 md:p-12 shadow-xs overflow-hidden">
          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200/80 rounded-full text-xs font-semibold text-sky-800">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Boas-vindas ao PsiConnect</span>
                <span aria-hidden="true" className="text-sky-300">·</span>
                <span className="text-slate-600 font-normal">Plataforma Abrangente de Cuidado</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight text-balance">
                Cuidado emocional, psicológico e aconselhamento bíblico de onde você estiver.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Uma plataforma inclusiva e segura desenvolvida para aproximar você do suporte certo: <strong>psicólogos</strong>, <strong>terapeutas</strong> e <strong>psicanalistas</strong> para terapia emocional e comportamental, e <strong>pastores ordenados</strong> para quem busca acolhimento e aconselhamento bíblico.
              </p>
            </div>

            {/* Quick Action Options */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={onFindPsychologist}
                  className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-colors"
                >
                  <span>Explorar Especialistas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onRegisterPatient}
                  className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors"
                >
                  <Heart className="w-4 h-4 text-sky-700" />
                  <span>Cadastrar como Paciente</span>
                </button>

                <button
                  onClick={onRegisterPsychologist}
                  className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-slate-600" />
                  <span>Sou Profissional</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <span>Já possui cadastro?</span>
                <button
                  onClick={onOpenLogin}
                  className="font-semibold text-sky-700 hover:text-sky-800 hover:underline flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Fazer login (acessar conta)</span>
                </button>
              </div>
            </div>

            {/* Trust points */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Brain className="w-4 h-4 text-sky-600 shrink-0" />
                Psicologia, Terapias & Psicanálise
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                Aconselhamento Bíblico Pastoral
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                Agendamento 100% Online
              </span>
            </div>
          </div>

          {/* Right Image Column */}
          <div className="lg:col-span-5 relative min-h-[320px] lg:min-h-full rounded-2xl overflow-hidden border border-slate-100 shadow-xs">
            <img
              src="/src/assets/images/hero_psychology_clinic_1792608795226.jpg"
              alt="Espaço acolhedor para teleatendimentos éticos e aconselhamento"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent flex items-end p-6">
              <div className="text-white space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                  <Shield className="w-4 h-4" />
                  <span>Ambiente Seguro, Ético e Confidencial</span>
                </div>
                <p className="text-base font-bold leading-snug">
                  Cuidado integral da mente, das emoções e do espírito
                </p>
                <p className="text-xs text-slate-300 leading-normal">
                  Respeito estrito à sua busca e anonimato garantido em todas as sessões.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Welcome Gateways: Duas Áreas Claras de Cuidado */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block mb-1">
            Segmentos Especializados
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Escolha o atendimento ideal para a sua necessidade
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Nossos profissionais são claramente organizados para que você encontre exatamente o suporte desejado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Card 1: Terapia Emocional, Comportamental e Psicológica */}
          <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
                  Saúde Mental & Bem-Estar
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Terapia Emocional, Comportamental & Psicológica
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Para quem busca superar ansiedade, depressão, estresse, autossabotagem ou aprofundar seu autoconhecimento com metodologias científicas e terapêuticas consagradas.
              </p>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Psicólogos(as) (CRP):</strong> TCC, Gestalt, Fenomenologia e terapia humanista com verificação no Conselho de Psicologia.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Terapeutas:</strong> Regulação emocional, inteligência emocional, mindfulness e práticas integrativas.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Psicanalistas:</strong> Investigação profunda do inconsciente, análise freudiana/lacaniana e elaboração de traumas.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onFindPsychologist}
                className="flex items-center justify-center gap-2 py-3 px-5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors shadow-xs"
              >
                <span>Ver Psicólogos & Terapeutas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Aconselhamento Bíblico */}
          <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Fé & Direcionamento Espiritual
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Aconselhamento Bíblico & Pastoral
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Habilitado especificamente para pessoas, casais e famílias em busca de acolhimento pastoral, restauração de relacionamentos, paz interior e sabedoria fundamentada nas Sagradas Escrituras.
              </p>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Pastores Ordenados & Conselheiros:</strong> Ministros experientes com formação teológica e registro pastoral.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Aconselhamento Familiar & Matrimonial:</strong> Princípios bíblicos para fortalecer o casamento e guiar filhos.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Conforto Espiritual & Oração:</strong> Suporte nas perdas, luto e momentos de crise existencial à luz da fé.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onFindPsychologist}
                className="flex items-center justify-center gap-2 py-3 px-5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors shadow-xs"
              >
                <span>Ver Pastores & Conselheiros</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Para Todos os Profissionais Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
              Para Profissionais & Conselheiros
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              Cadastre seu consultório ou ministério online.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              O PsiConnect acolhe <strong>psicólogos</strong>, <strong>terapeutas</strong>, <strong>psicanalistas</strong> e <strong>pastores</strong> com ferramentas completas: controle de grade de disponibilidade, agendamento de consultas com teleatendimento por vídeo e prontuários/fichas de acompanhamento com sigilo.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onRegisterPsychologist}
                className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
              >
                Cadastrar como Profissional
              </button>
              <button
                onClick={onOpenLogin}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
              >
                Já Tenho Cadastro
              </button>
            </div>
          </div>

          <div className="space-y-3 bg-slate-800/80 p-6 rounded-2xl border border-slate-700 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Psicólogos (CRP)</h4>
                <p className="text-slate-400 mt-0.5">Prontuário Eletrônico do Paciente (PEP) confidencial conforme Res. CFP nº 001/2009.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-3 border-t border-slate-700">
              <Leaf className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Terapeutas & Psicanalistas</h4>
                <p className="text-slate-400 mt-0.5">Gestão de horários, sessões personalizadas e evolução contínua dos pacientes.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-3 border-t border-slate-700">
              <BookOpen className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Pastores & Conselheiros Bíblicos</h4>
                <p className="text-slate-400 mt-0.5">Ficha de acompanhamento pastoral reservada para orientação familiar e espiritual.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

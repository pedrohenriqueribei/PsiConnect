import {
  User,
  PatientMatchingProfile,
  ProfessionalMatchingProfile,
  PatientMatchResult,
  MatchScoreBreakdown,
  AgeGroup,
  MaritalStatus,
} from '../types';

export const MATCHING_WEIGHTS = {
  AGE_GROUP: 30,      // 30% da pontuação total (Faixa Etária)
  REASONS: 30,        // 30% da pontuação total (Motivos do Atendimento)
  MARITAL_STATUS: 20, // 20% da pontuação total (Estado Civil)
  CHILDREN: 20,       // 20% da pontuação total (Filhos)
} as const;

export const REASONS_FOR_CARE_LIST = [
  { id: 'midlife_crisis', label: 'Crise de Meia-Idade e Sentido de Vida', category: 'life_stage' },
  { id: 'marital_conflict', label: 'Conflitos Conjugais & Casamento', category: 'relationship' },
  { id: 'parenting_maternity', label: 'Maternidade, Paternidade & Filhos', category: 'family' },
  { id: 'anxiety_panic', label: 'Ansiedade, Estresse Crônico & Pânico', category: 'clinical' },
  { id: 'burnout_work', label: 'Burnout & Pressão Profissional', category: 'work' },
  { id: 'grief_loss', label: 'Luto, Perdas e Separação', category: 'clinical' },
  { id: 'depression_emptiness', label: 'Depressão e Vazio Existencial', category: 'clinical' },
  { id: 'life_transitions', label: 'Transições de Vida e Carreira', category: 'life_stage' },
  { id: 'biblical_counsel', label: 'Orientação Bíblica & Fé Familiar', category: 'spiritual' },
  { id: 'self_esteem', label: 'Autoestima & Relações Interpessoais', category: 'personal' },
];

export const PROFESSIONAL_AFFINITY_TAGS = [
  'Crise de Meia-Idade',
  'Casamento & Terapia de Casal',
  'Maternidade Real & Puerpério',
  'Família & Pais com Filhos',
  'Ansiedade & Regulação Emocional',
  'Burnout & Saúde Ocupacional',
  'Luto & Conflitos Existenciais',
  'Depressão & Reestruturação Cognitiva',
  'Aconselhamento Bíblico & Família',
  'Jovens Adultos & Identidade',
  'Transição de Carreira & Maturidade',
  'Gestalt & Autoconhecimento',
];

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  '18-25': '18 a 25 anos (Jovem Adulto)',
  '26-35': '26 a 35 anos (Início de Vida Adulta)',
  '36-50': '36 a 50 anos (Meia-Idade / Plena Maturidade)',
  '51+': 'Acima de 50 anos (Maturidade Sênior)',
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  single: 'Solteiro(a)',
  married: 'Casado(a)',
  stable_union: 'União Estável',
  divorced: 'Divorciado(a)',
  widowed: 'Viúvo(a)',
};

import { CLINICAL_EXPERIENCE_TAGS } from '../types';
export { CLINICAL_EXPERIENCE_TAGS };

// Mapa semântico de motivos do paciente para tags do profissional e termos clínicos
const REASON_TO_TAG_MAP: Record<string, string[]> = {
  'Crise de Meia-Idade e Sentido de Vida': [
    'Crise de Meia-Idade',
    'Transições de Carreira',
    'Transição de Carreira & Maturidade',
    'Luto & Conflitos Existenciais',
    'Luto',
    'Autoestima',
  ],
  'Conflitos Conjugais & Casamento': [
    'Casamento & Terapia de Casal',
    'Conflitos Conjugais',
    'Relacionamentos',
    'Família & Pais com Filhos',
    'Família & Filhos',
  ],
  'Maternidade, Paternidade & Filhos': [
    'Maternidade Real & Puerpério',
    'Maternidade & Paternidade',
    'Família & Pais com Filhos',
    'Família & Filhos',
    'Casamento & Terapia de Casal',
    'Relacionamentos',
  ],
  'Ansiedade, Estresse Crônico & Pânico': [
    'Ansiedade',
    'Ansiedade & Regulação Emocional',
    'Burnout & Saúde Ocupacional',
    'Burnout & Estresse',
    'Regulação Emocional',
    'Fobias & Pânico',
  ],
  'Burnout & Pressão Profissional': [
    'Burnout & Saúde Ocupacional',
    'Burnout & Estresse',
    'Ansiedade',
    'Ansiedade & Regulação Emocional',
    'Transições de Carreira',
    'Transição de Carreira & Maturidade',
  ],
  'Luto, Perdas e Separação': [
    'Luto',
    'Luto & Conflitos Existenciais',
    'Relacionamentos',
    'Casamento & Terapia de Casal',
    'Trauma & TEPT',
    'Depressão',
  ],
  'Depressão e Vazio Existencial': [
    'Depressão',
    'Depressão & Reestruturação Cognitiva',
    'Luto',
    'Luto & Conflitos Existenciais',
    'Regulação Emocional',
    'Autoestima',
  ],
  'Transições de Vida e Carreira': [
    'Transições de Carreira',
    'Transição de Carreira & Maturidade',
    'Jovens Adultos & Identidade',
    'Crise de Meia-Idade',
    'Desenvolvimento Pessoal',
    'Autoestima',
  ],
  'Orientação Bíblica & Fé Familiar': [
    'Aconselhamento Bíblico & Família',
    'Aconselhamento Bíblico',
    'Casamento & Terapia de Casal',
    'Conflitos Conjugais',
    'Família & Filhos',
  ],
  'Autoestima & Relações Interpessoais': [
    'Autoestima',
    'Relacionamentos',
    'Gestalt & Autoconhecimento',
    'Jovens Adultos & Identidade',
    'Desenvolvimento Pessoal',
    'Regulação Emocional',
  ],
};

/**
 * Calcula a compatibilidade entre o perfil do profissional e as respostas do formulário do paciente.
 * Refina a compatibilidade com base na experiência clínica e vivência pessoal.
 */
/**
 * Calcula a compatibilidade entre o perfil do profissional e as respostas do formulário do paciente.
 * Aplica pesos estritos conforme especificação:
 * - Faixa etária: 30% (máximo 30 pontos)
 * - Motivos do atendimento: 30% (máximo 30 pontos)
 * - Estado civil: 20% (máximo 20 pontos)
 * - Filhos: 20% (máximo 20 pontos)
 * Total: 100% (máximo 100 pontos)
 */
export function calculateMatchScore(
  professional: User,
  patient: User
): {
  score: number;
  scoreBreakdown: MatchScoreBreakdown;
  highlights: string[];
  sharedTags: string[];
  matchedClinicalTags: string[];
  matchedSpecializations: string[];
  matchedFormations: string[];
} {
  const profProfile: ProfessionalMatchingProfile = professional.professionalProfile || {
    ageGroup: '36-50',
    approximateAge: 44,
    maritalStatus: 'married',
    hasChildren: true,
    affinityTags: professional.clinicalTags || professional.approaches || [],
    formations: professional.formations || [],
    specializations: professional.specializations || [],
    updatedAt: new Date().toISOString(),
  };

  const patProfile: PatientMatchingProfile | undefined = patient.patientProfile;

  if (!patProfile) {
    const fallbackBreakdown: MatchScoreBreakdown = {
      ageGroupScore: 15,
      reasonsScore: 15,
      maritalScore: 10,
      childrenScore: 10,
      totalScore: 50,
    };
    return {
      score: 50,
      scoreBreakdown: fallbackBreakdown,
      highlights: ['Perfil preliminar sem questionário de acolhimento completo'],
      sharedTags: [],
      matchedClinicalTags: [],
      matchedSpecializations: [],
      matchedFormations: [],
    };
  }

  const highlights: string[] = [];
  const sharedTags: string[] = [];
  const matchedClinicalTags: string[] = [];
  const matchedSpecializations: string[] = [];
  const matchedFormations: string[] = [];

  // 1. Faixa Etária (Peso: 30% - máximo 30 pontos)
  let ageGroupScore = 0;
  if (profProfile.ageGroup === patProfile.ageGroup) {
    ageGroupScore = 30;
    if (patProfile.ageGroup === '36-50') {
      highlights.push('Faixa etária: Meia-idade coincidente (sincronia de maturidade - 30/30 pts)');
    } else {
      highlights.push(`Faixa etária idêntica: ${AGE_GROUP_LABELS[patProfile.ageGroup]} (30/30 pts)`);
    }
  } else {
    const order: AgeGroup[] = ['18-25', '26-35', '36-50', '51+'];
    const pIndex = order.indexOf(profProfile.ageGroup);
    const patIndex = order.indexOf(patProfile.ageGroup);
    const distance = Math.abs(pIndex - patIndex);

    if (distance === 1) {
      ageGroupScore = 15;
      highlights.push(`Faixas etárias adjacentes compatíveis (${AGE_GROUP_LABELS[patProfile.ageGroup]} e ${AGE_GROUP_LABELS[profProfile.ageGroup]} - 15/30 pts)`);
    } else {
      ageGroupScore = 0;
    }
  }

  // 2. Motivos do Atendimento, Especializações Clínicas & Formações Acadêmicas (Peso: 30% - máximo 30 pontos)
  let reasonsScore = 0;
  const profClinicalTags = professional.clinicalTags || [];
  const profSpecializations = professional.specializations || profProfile.specializations || [];
  const profFormations = professional.formations || profProfile.formations || [];
  const profApproaches = professional.approaches || [];
  const profAffinityTags = profProfile.affinityTags || [];

  // Normalização de termos para busca cruzada
  const allProfSearchTerms = [
    ...profClinicalTags,
    ...profSpecializations,
    ...profFormations,
    ...profApproaches,
    ...profAffinityTags,
  ].map(t => t.toLowerCase().trim());

  let matchedReasonsCount = 0;
  for (const reason of patProfile.reasonsForCare) {
    const rLower = reason.toLowerCase().trim();
    const relatedTags = (REASON_TO_TAG_MAP[reason] || []).map(t => t.toLowerCase().trim());

    const directHit = allProfSearchTerms.some(term => term.includes(rLower) || rLower.includes(term));
    const semanticHit = relatedTags.some(tag =>
      allProfSearchTerms.some(term => term.includes(tag) || tag.includes(term))
    );

    if (directHit || semanticHit) {
      matchedReasonsCount++;
      if (!sharedTags.includes(reason)) {
        sharedTags.push(reason);
      }
    }
  }

  // Identifica Especializações que correspondem às queixas e ao relato pessoal do paciente
  profSpecializations.forEach(spec => {
    const sLower = spec.toLowerCase().trim();
    const matchesReason = patProfile.reasonsForCare.some(reason => {
      const rLower = reason.toLowerCase();
      const mapped = (REASON_TO_TAG_MAP[reason] || []).map(m => m.toLowerCase().trim());
      return rLower.includes(sLower) || sLower.includes(rLower) || mapped.some(m => sLower.includes(m) || m.includes(sLower));
    });

    const matchesNote = patProfile.personalNote
      ? patProfile.personalNote.toLowerCase().split(/[ ,.;:!?]+/).some(word => word.length >= 4 && sLower.includes(word))
      : false;

    if ((matchesReason || matchesNote) && !matchedSpecializations.includes(spec)) {
      matchedSpecializations.push(spec);
    }
  });

  // Identifica Formações Acadêmicas qualificadas para a demanda
  profFormations.forEach(form => {
    const fLower = form.toLowerCase().trim();
    const matchesReason = patProfile.reasonsForCare.some(reason => {
      const mapped = (REASON_TO_TAG_MAP[reason] || []).map(m => m.toLowerCase().trim());
      return mapped.some(m => fLower.includes(m));
    });

    const isBiblicalAffinity =
      (fLower.includes('teologia') || fLower.includes('bíblico')) &&
      (patProfile.preferredCareCategory === 'biblical' || patProfile.reasonsForCare.some(r => r.includes('Bíblica')));

    const isClinicalAffinity =
      (fLower.includes('psicologia') || fLower.includes('saúde mental') || fLower.includes('psicoterapia')) &&
      patProfile.reasonsForCare.some(r => r.includes('Ansiedade') || r.includes('Depressão') || r.includes('Luto'));

    if ((matchesReason || isBiblicalAffinity || isClinicalAffinity) && !matchedFormations.includes(form)) {
      matchedFormations.push(form);
    }
  });

  // Tags de experiência clínica explícitas (ex: Ansiedade, Luto, Relacionamentos)
  profClinicalTags.forEach(cTag => {
    const cLower = cTag.toLowerCase().trim();
    const isDirectlyRelevant = patProfile.reasonsForCare.some(reason => {
      const rLower = reason.toLowerCase();
      const mapped = (REASON_TO_TAG_MAP[reason] || []).map(m => m.toLowerCase().trim());
      return rLower.includes(cLower) || cLower.includes(rLower) || mapped.includes(cLower);
    });

    const matchesNote = patProfile.personalNote
      ? patProfile.personalNote.toLowerCase().includes(cLower)
      : false;

    if ((isDirectlyRelevant || matchesNote) && !matchedClinicalTags.includes(cTag)) {
      matchedClinicalTags.push(cTag);
    }
  });

  if (patProfile.reasonsForCare.length > 0) {
    const ratio = matchedReasonsCount / patProfile.reasonsForCare.length;
    // Base de aderência às queixas: até 14 pontos
    const baseComplaintPoints = Math.round(ratio * 14);
    // Bônus de especializações clínicas específicas (+4 pts por especialização, max 8 pts)
    const specBonus = Math.min(8, matchedSpecializations.length * 4);
    // Bônus de formações acadêmicas validadas (+2 pts por formação, max 4 pts)
    const formBonus = Math.min(4, matchedFormations.length * 2);
    // Bônus de tags clínicas e relato (+2 pts por tag clínica coincidente, max 4 pts)
    const clinicalTagBonus = Math.min(4, matchedClinicalTags.length * 2);

    reasonsScore = Math.min(30, baseComplaintPoints + specBonus + formBonus + clinicalTagBonus);

    if (matchedSpecializations.length > 0) {
      highlights.push(`Especialização clínica afim: ${matchedSpecializations.join(', ')}`);
    }
    if (matchedFormations.length > 0) {
      highlights.push(`Formação acadêmica qualificada: ${matchedFormations.join(', ')}`);
    }
    if (matchedClinicalTags.length > 0) {
      highlights.push(`Experiência clínica comprovada: ${matchedClinicalTags.join(', ')}`);
    } else if (matchedReasonsCount > 0) {
      highlights.push(`Afinidade com as queixas selecionadas (${matchedReasonsCount}/${patProfile.reasonsForCare.length} motivos)`);
    }

    if (patProfile.personalNote && (matchedSpecializations.length > 0 || matchedClinicalTags.length > 0)) {
      highlights.push('Relato pessoal do paciente contemplado diretamente nas especialidades');
    }
  } else {
    reasonsScore = 15;
  }
  reasonsScore = Math.max(0, Math.min(30, reasonsScore));

  // 3. Estado Civil (Peso: 20% - máximo 20 pontos)
  let maritalScore = 0;
  const isProfCoupled = profProfile.maritalStatus === 'married' || profProfile.maritalStatus === 'stable_union';
  const isPatCoupled = patProfile.maritalStatus === 'married' || patProfile.maritalStatus === 'stable_union';

  if (profProfile.maritalStatus === patProfile.maritalStatus) {
    maritalScore = 20;
    highlights.push(`Estado civil em comum: ${MARITAL_STATUS_LABELS[patProfile.maritalStatus]} (20/20 pts)`);
  } else if (isProfCoupled && isPatCoupled) {
    maritalScore = 18;
    highlights.push('Vivência conjugal similar (casados / união estável - 18/20 pts)');
  } else if (!isProfCoupled && !isPatCoupled) {
    maritalScore = 12;
    highlights.push('Situação conjugal independente compartilhada (12/20 pts)');
  } else {
    maritalScore = 0;
  }
  maritalScore = Math.max(0, Math.min(20, maritalScore));

  // 4. Filhos (Peso: 20% - máximo 20 pontos)
  let childrenScore = 0;
  if (profProfile.hasChildren && patProfile.hasChildren) {
    childrenScore = 20;
    highlights.push('Experiência compartilhada com criação de filhos e parentalidade (20/20 pts)');
  } else if (!profProfile.hasChildren && !patProfile.hasChildren) {
    childrenScore = 16;
    highlights.push('Momento de vida sem filhos compartilhado (16/20 pts)');
  } else {
    childrenScore = 0;
  }
  childrenScore = Math.max(0, Math.min(20, childrenScore));

  // Pontuação Total (Soma exata dos 4 pilares: 0 a 100 pontos)
  const rawTotal = ageGroupScore + reasonsScore + maritalScore + childrenScore;
  const totalScore = Math.min(100, Math.max(0, rawTotal));

  const scoreBreakdown: MatchScoreBreakdown = {
    ageGroupScore,
    reasonsScore,
    maritalScore,
    childrenScore,
    totalScore,
  };

  return {
    score: totalScore,
    scoreBreakdown,
    highlights,
    sharedTags,
    matchedClinicalTags,
    matchedSpecializations,
    matchedFormations,
  };
}

/**
 * Ordena e filtra uma lista de pacientes para um profissional específico
 */
export function getRecommendedPatientsForProfessional(
  professional: User,
  allPatients: User[]
): PatientMatchResult[] {
  const results: PatientMatchResult[] = allPatients
    .filter(patient => patient.role === 'patient')
    .map(patient => {
      const {
        score,
        scoreBreakdown,
        highlights,
        sharedTags,
        matchedClinicalTags,
        matchedSpecializations,
        matchedFormations,
      } = calculateMatchScore(professional, patient);
      return {
        patient,
        score,
        scoreBreakdown,
        matchHighlights: highlights,
        sharedTags,
        matchedClinicalTags,
        matchedSpecializations,
        matchedFormations,
      };
    });

  // Ordena por maior pontuação de compatibilidade
  return results.sort((a, b) => b.score - a.score);
}


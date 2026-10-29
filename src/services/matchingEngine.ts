import {
  User,
  PatientMatchingProfile,
  ProfessionalMatchingProfile,
  PatientMatchResult,
  AgeGroup,
  MaritalStatus,
} from '../types';

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

// Mapa semântico de motivos do paciente para tags do profissional
const REASON_TO_TAG_MAP: Record<string, string[]> = {
  'Crise de Meia-Idade e Sentido de Vida': ['Crise de Meia-Idade', 'Transição de Carreira & Maturidade', 'Luto & Conflitos Existenciais'],
  'Conflitos Conjugais & Casamento': ['Casamento & Terapia de Casal', 'Família & Pais com Filhos'],
  'Maternidade, Paternidade & Filhos': ['Maternidade Real & Puerpério', 'Família & Pais com Filhos', 'Casamento & Terapia de Casal'],
  'Ansiedade, Estresse Crônico & Pânico': ['Ansiedade & Regulação Emocional', 'Burnout & Saúde Ocupacional'],
  'Burnout & Pressão Profissional': ['Burnout & Saúde Ocupacional', 'Ansiedade & Regulação Emocional', 'Transição de Carreira & Maturidade'],
  'Luto, Perdas e Separação': ['Luto & Conflitos Existenciais', 'Casamento & Terapia de Casal'],
  'Depressão e Vazio Existencial': ['Depressão & Reestruturação Cognitiva', 'Luto & Conflitos Existenciais'],
  'Transições de Vida e Carreira': ['Transição de Carreira & Maturidade', 'Jovens Adultos & Identidade', 'Crise de Meia-Idade'],
  'Orientação Bíblica & Fé Familiar': ['Aconselhamento Bíblico & Família', 'Casamento & Terapia de Casal'],
  'Autoestima & Relações Interpessoais': ['Gestalt & Autoconhecimento', 'Jovens Adultos & Identidade'],
};

/**
 * Calcula a compatibilidade entre o perfil do profissional e as respostas do formulário do paciente.
 * Dá ênfase expressa ao exemplo do usuário:
 * "uma psicóloga de meia-idade, seja para ela sugerida pacientes que tenham ali a sua mesma idade,
 * que seja casada, que tenha filho, para que uma paciente de meia-idade não possa ser sugerida para uma psicóloga novata."
 */
export function calculateMatchScore(
  professional: User,
  patient: User
): { score: number; highlights: string[]; sharedTags: string[] } {
  const profProfile: ProfessionalMatchingProfile = professional.professionalProfile || {
    ageGroup: '36-50',
    approximateAge: 44,
    maritalStatus: 'married',
    hasChildren: true,
    affinityTags: professional.approaches || [],
    updatedAt: new Date().toISOString(),
  };

  const patProfile: PatientMatchingProfile | undefined = patient.patientProfile;

  if (!patProfile) {
    return {
      score: 50,
      highlights: ['Perfil preliminar sem questionário de acolhimento completo'],
      sharedTags: [],
    };
  }

  let points = 0;
  const maxPoints = 100;
  const highlights: string[] = [];
  const sharedTags: string[] = [];

  // 1. Compatibilidade de Faixa Etária e Momento de Vida (Peso: até 35 pontos)
  if (profProfile.ageGroup === patProfile.ageGroup) {
    points += 35;
    if (patProfile.ageGroup === '36-50') {
      highlights.push('Mesma faixa etária: Meia-idade (vivência geracional síncrona)');
    } else {
      highlights.push(`Faixa etária compatível: ${AGE_GROUP_LABELS[patProfile.ageGroup]}`);
    }
  } else {
    // Tolerância para faixas adjacentes (ex: 26-35 com 36-50)
    const order: AgeGroup[] = ['18-25', '26-35', '36-50', '51+'];
    const pIndex = order.indexOf(profProfile.ageGroup);
    const patIndex = order.indexOf(patProfile.ageGroup);
    const distance = Math.abs(pIndex - patIndex);

    if (distance === 1) {
      points += 15;
      highlights.push('Faixas etárias próximas');
    } else {
      // Diferença geracional grande (ex: novata 18-25 vs paciente 36-50 ou 51+)
      points += 0;
    }
  }

  // 2. Vivência Familiar & Estado Civil & Filhos (Peso: até 25 pontos)
  // Estado civil
  const isProfCoupled = profProfile.maritalStatus === 'married' || profProfile.maritalStatus === 'stable_union';
  const isPatCoupled = patProfile.maritalStatus === 'married' || patProfile.maritalStatus === 'stable_union';

  if (isProfCoupled && isPatCoupled) {
    points += 12;
    highlights.push('Vivência conjugal semelhante (ambos casados/união estável)');
  } else if (profProfile.maritalStatus === patProfile.maritalStatus) {
    points += 10;
    highlights.push(`Estado civil em comum: ${MARITAL_STATUS_LABELS[patProfile.maritalStatus]}`);
  }

  // Filhos
  if (profProfile.hasChildren && patProfile.hasChildren) {
    points += 13;
    highlights.push('Experiência compartilhada com maternidade/paternidade e filhos');
  } else if (!profProfile.hasChildren && !patProfile.hasChildren) {
    points += 7;
  }

  // 3. Cruzamento entre Motivos de Busca do Paciente e Tags de Afinidade do Profissional (Peso: até 30 pontos)
  const profTags = new Set([
    ...(profProfile.affinityTags || []),
    ...(professional.approaches || []),
  ].map(t => t.toLowerCase().trim()));

  let matchedReasonsCount = 0;

  for (const reason of patProfile.reasonsForCare) {
    const relatedTags = REASON_TO_TAG_MAP[reason] || [];
    const directHit = profTags.has(reason.toLowerCase().trim());
    const semanticHit = relatedTags.some(tag => profTags.has(tag.toLowerCase().trim()));

    if (directHit || semanticHit) {
      matchedReasonsCount++;
      sharedTags.push(reason);
    }
  }

  if (patProfile.reasonsForCare.length > 0) {
    const ratio = matchedReasonsCount / patProfile.reasonsForCare.length;
    const clinicalPoints = Math.round(ratio * 30);
    points += clinicalPoints;

    if (matchedReasonsCount > 0) {
      highlights.push(`Afinidade clínica em ${matchedReasonsCount} queixa(s) relatada(s)`);
    }
  }

  // 4. Preferência de Categoria de Cuidado (Terapia vs Bíblica) (Peso: até 10 pontos)
  if (
    !patProfile.preferredCareCategory ||
    patProfile.preferredCareCategory === 'both' ||
    patProfile.preferredCareCategory === professional.careCategory
  ) {
    points += 10;
  }

  // Normalização final entre 20% e 99%
  const finalScore = Math.min(99, Math.max(25, points));

  return {
    score: finalScore,
    highlights,
    sharedTags,
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
      const { score, highlights, sharedTags } = calculateMatchScore(professional, patient);
      return {
        patient,
        score,
        matchHighlights: highlights,
        sharedTags,
      };
    });

  // Ordena por maior pontuação de compatibilidade
  return results.sort((a, b) => b.score - a.score);
}

export interface ClinicUnitPhoto {
  id: string;
  url: string;
  category: 'fachada' | 'recepcao' | 'consultorio' | 'outro';
  label?: string;
}

export type AccessibilityId =
  | 'rampa'
  | 'elevador'
  | 'banheiro_adaptado'
  | 'piso_tatile'
  | 'portas_largas'
  | 'vagas_reservadas'
  | 'sinalizacao_braille';

export interface AccessibilityOption {
  id: AccessibilityId;
  label: string;
  description: string;
}

export const ACCESSIBILITY_OPTIONS: AccessibilityOption[] = [
  { id: 'rampa', label: 'Rampa de Acesso', description: 'Rampa com inclinação padrão e corrimão contínuo' },
  { id: 'elevador', label: 'Elevador Acessível', description: 'Cabine ampla com botões táteis e avisos sonoros' },
  { id: 'banheiro_adaptado', label: 'Banheiro Adaptado (PCD)', description: 'Barras de apoio, porta larga e sanitário adaptado' },
  { id: 'piso_tatile', label: 'Piso Tátil & Alerta', description: 'Sinalização podotátil na entrada e corredores' },
  { id: 'portas_largas', label: 'Portas Largas (≥ 80cm)', description: 'Passagem desobstruída para cadeiras de rodas e macas' },
  { id: 'vagas_reservadas', label: 'Vagas Reservadas PCD', description: 'Estacionamento com vaga sinalizada em frente à unidade' },
  { id: 'sinalizacao_braille', label: 'Sinalização em Braille', description: 'Placas dos consultórios com leitura em braille' },
];

export type CareTypeId =
  | 'presencial'
  | 'teleconsulta'
  | 'infantil_atipicidades'
  | 'casal_familia'
  | 'grupo'
  | 'plantao_acolhimento';

export interface CareTypeOption {
  id: CareTypeId;
  label: string;
  badge: string;
  description: string;
}

export const CARE_TYPE_OPTIONS: CareTypeOption[] = [
  { id: 'presencial', label: 'Atendimento Presencial', badge: 'Presencial', description: 'Consultórios individuais com isolamento e poltronas ergonômicas' },
  { id: 'teleconsulta', label: 'Salas para Teleconsulta', badge: 'Teleatendimento', description: 'Isolamento acústico certificado, iluminação softbox e internet dedicada' },
  { id: 'infantil_atipicidades', label: 'Infantil / Atipicidades', badge: 'Neurodivergências', description: 'Salas de ludoterapia, recursos sensoriais para TEA, TDAH e neurodesenvolvimento' },
  { id: 'casal_familia', label: 'Terapia de Casal e Família', badge: 'Casal / Família', description: 'Espaço planejado para sessões conjuntas e mediação de conflitos' },
  { id: 'grupo', label: 'Psicoterapia em Grupo', badge: 'Grupos Terapêuticos', description: 'Salas amplas com disposição em círculo para rodas de conversa e oficinas' },
  { id: 'plantao_acolhimento', label: 'Plantão de Acolhimento Imediato', badge: 'Acolhimento', description: 'Sala de triagem e acolhimento em crises emocionais agudas' },
];

export interface ClinicUnit {
  id: string;
  // 1. Dados Jurídicos e Regulatórios
  cnpj: string; // Máscara 99.999.999/9999-99
  tradeName: string; // Nome Fantasia
  legalName: string; // Razão Social
  cnesNumber?: string; // Número do CNES (opcional/obrigatório conforme regra)
  technicalLeadName: string; // Psicólogo Responsável Técnico - Nome
  technicalLeadCrp: string; // Psicólogo Responsável Técnico - CRP/UF

  // 2. Contato e Mídias
  landlinePhone?: string; // Telefone Fixo (com máscara)
  receptionWhatsapp?: string; // WhatsApp da Recepção (com máscara)
  institutionalEmail?: string; // E-mail Institucional
  photos: ClinicUnitPhoto[]; // Fotos da Unidade (fachada, recepção, consultórios)

  // 3. Endereço Completo
  zipCode: string; // CEP (com busca automática por API/ViaCEP)
  street: string; // Logradouro
  number: string; // Número
  complement?: string; // Complemento
  neighborhood: string; // Bairro
  city: string; // Cidade
  state: string; // UF

  // 4. Estrutura e Operação
  operatingHours: string; // Horário de Funcionamento (ex: Seg a Sex das 08h às 20h)
  accessibilityItems: string[]; // Itens de Acessibilidade (rampa, elevador, banheiro adaptado...)
  serviceTypes: string[]; // Tipos de Atendimento (Presencial, Salas para Teleconsulta, Infantil/Atipicidades...)

  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

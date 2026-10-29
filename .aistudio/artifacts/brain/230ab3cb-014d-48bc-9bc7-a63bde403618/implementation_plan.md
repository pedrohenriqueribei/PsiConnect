# Metodologia Inteligente de Matching entre Pacientes e Profissionais

Sistema inteligente de afinidade e direcionamento clínico para unir pacientes aos profissionais mais adequados com base em vivência pessoal (faixa etária, estado civil, filhos), queixas clínicas/motivos de atendimento e especialidades declaradas.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões confirmadas na etapa de alinhamento:**
> - **Momento do formulário:** Apresentado em fluxo de onboarding logo após o cadastro do paciente, mantendo edição contínua no seu painel.
> - **Visualização das recomendações:** Dedicada prioritariamente à área do profissional ("Pacientes Recomendados / Matching"), permitindo aos psicólogos, terapeutas e pastores visualizar e acolher perfis com alta afinidade.
> - **Critérios de cálculo de compatibilidade:** Ponderação combinada entre dados sociodemográficos e de vivência (faixa etária, estado civil, filhos) e compatibilidade clínica (motivos de busca vs. abordagens e tags do profissional), garantindo que psicólogas de meia-idade e mães atendam prioritariamente pacientes em momentos de vida semelhantes.

---

## 1. Overview & Core Concept

- **O que faz:** Introduz uma matriz de afinidade bidirecional. O paciente responde a um formulário estruturado e humanizado detalhando o motivo de busca por terapia, momento de vida (idade, estado civil, se tem filhos) e preferências. O profissional configura suas tags de identificação pessoal e especialidades clínicas.
- **Público-alvo:** Profissionais de saúde mental e pastoral (que ganham previsibilidade e conexão terapêutica assertiva) e pacientes (que são acolhidos por quem compreende genuinamente seu contexto de vida).
- **Valor agregado:** Redução de evasão nas primeiras sessões, maior adesão ao tratamento e segurança clínica através do alinhamento empático e experiencial.

---

## 2. User Experience & Visual Design

### A. Fluxo do Paciente (Formulário de Acolhimento & Matching)
1. **Cadastro:** Ao finalizar a criação de conta no `AuthModal`, o paciente é convidado a responder o "Formulário de Acolhimento e Perfil Pessoal" (com opção de pular e preencher depois).
2. **Campos do Formulário:**
   - *Motivo do Atendimento:* Ansiedade, Estresse/Burnout, Conflitos no Casamento, Dificuldades com Filhos/Maternidade, Luto, Transição de Meia-idade, Depressão, Orientação Espiritual, etc.
   - *Perfil Sociodemográfico:* Idade / Faixa etária (ex: 18-25, 26-35, 36-50, 50+), Estado Civil (Solteiro, Casado, Divorciado, etc.), Filhos (Sim/Não e faixa de idade).
   - *Relato Pessoal / Demanda:* Breve texto em linguagem natural explicando o que está vivenciando e o que busca na terapia.
   - *Preferências Adicionais:* Formato preferido, urgência do acolhimento.
3. **Gestão no Painel:** Aba "Meu Perfil de Acolhimento" no `PatientDashboard` para atualizar informações sempre que necessário.

### B. Fluxo do Profissional (Tags de Identificação & Sugestões Afins)
1. **Configuração de Perfil & Tags (`PsychologistDashboard` -> Perfil):**
   - Dados de vivência pessoal do profissional (Faixa etária, Estado civil, É pai/mãe, Anos de prática).
   - Seleção de tags de identificação pessoal e clínica (ex: "Especialista em Meia-Idade", "Maternidade Real & Puerpério", "Casamento & Família", "Burnout Profissional", "Luto & Perdas").
2. **Nova Aba: "Pacientes Sugeridos / Matching" no Painel do Profissional:**
   - Grid de pacientes com **Pontuação de Afinidade** (ex: `95% Afinidade de Perfil`).
   - Tags de correspondência destacadas (ex: `Mesma faixa etária (36-50 anos)`, `Casada(o) com filhos`, `Busca apoio em Conflito Conjugal`).
   - Resumo clínico e contextual da demanda do paciente.
   - Ação rápida: "Convidar para Agendamento" ou "Enviar Mensagem de Acolhimento", facilitando o primeiro contato seguro.

### C. Visual Identity & Theme (SaaS Dashboard Guidelines)
- **Cores & Superfícies:** Fundo neutro limpo, tipografia nítida (`Plus Jakarta Sans`), divisores sutis em hairline border.
- **Zero-Pill Discipline:** Metadados limpos com separadores tipográficos (`·`), tags com sutileza e sem visual sobrecarregado.
- **Indicador de Afinidade:** Barra de compatibilidade elegante com escala de porcentagem precisa e justificativa dos critérios correspondidos.

---

## 3. Key Product Decisions & Trade-Offs

- **Algoritmo de Matching Ponderado:**
  - *Vivência Pessoal (45%):* Faixa etária compatível (evitando descompasso entre novatas e demandas complexas de meia-idade), estado civil e experiência com filhos.
  - *Demanda Clínica vs Tags (45%):* Intersecção exata entre os motivos preenchidos pelo paciente e as tags/abordagens selecionadas pelo profissional.
  - *Modalidade & Categoria de Atendimento (10%):* Categoria de atendimento preferida (Terapia Científica ou Aconselhamento Bíblico).
- **Privacidade & Ética:** O profissional vê o primeiro nome, iniciais do sobrenome, faixa etária e a demanda clínica geral, preservando dados sensíveis de contato direto até que haja agendamento ou aceite mútuo.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   PsicoConnect Matching                │
├──────────────────────────┬─────────────────────────────┤
│      Paciente Flow       │      Profissional Flow      │
├──────────────────────────┼─────────────────────────────┤
│  1. Cadastro no AuthModal│  1. Configuração de Tags    │
│  2. MatchingModal / Form │     (idade, filhos, tags)   │
│  3. PatientDashboard     │  2. Aba 'Pacientes Sugeridos│
│     (Editar Anamnese)    │  3. Algoritmo de Afinidade  │
└────────────┬─────────────┴───────────────┬─────────────┘
             │                             │
             ▼                             ▼
┌────────────────────────────────────────────────────────┐
│             Motor de Matching (matchingEngine.ts)      │
│  - matchScore(professional, patientProfile)            │
│  - Breakdown de afinidade (idade, família, motivos)    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│         Storage & Firestore Sync (storage.ts)          │
│  - user.matchingProfile                                │
│  - Seed com perfis ricos de pacientes e profissionais  │
└────────────────────────────────────────────────────────┘
```

### Modelo de Dados em `src/types/index.ts`:

```typescript
export interface PatientMatchingProfile {
  ageGroup: '18-25' | '26-35' | '36-50' | '51+';
  approximateAge?: number;
  maritalStatus: 'single' | 'married' | 'stable_union' | 'divorced' | 'widowed';
  hasChildren: boolean;
  childrenDetails?: string;
  reasonsForCare: string[]; // Ex: Ansiedade, Conflito Conjugal, Luto, Burnout, Meia-idade
  description: string; // Relato pessoal do paciente
  preferredTherapyType?: CareCategory;
  urgencyLevel?: 'routine' | 'moderate' | 'urgent';
  updatedAt: string;
}

export interface ProfessionalMatchingProfile {
  ageGroup: '20-30' | '31-45' | '46-60' | '61+';
  approximateAge?: number;
  maritalStatus?: 'single' | 'married' | 'stable_union' | 'divorced' | 'widowed';
  hasChildren?: boolean;
  affinityTags: string[]; // Ex: 'Casamento & Família', 'Crise de Meia-Idade', 'Maternidade', 'Burnout'
  targetAudienceExperience: string[]; // Público que mais tem afinidade em atender
  updatedAt: string;
}
```

---

## 5. Implementation Steps

1. **Atualização dos Tipos:** Adicionar `PatientMatchingProfile` e `ProfessionalMatchingProfile` em `src/types/index.ts`.
2. **Motor de Afinidade (`src/services/matchingEngine.ts`):** Função pura de cálculo de compatibilidade, motivos coincidentes e justificativas transparentes da afinidade.
3. **Persistência & Mock Seeds (`src/services/storage.ts`):** Atualizar perfis iniciais para profissionais e criar perfis realistas de pacientes de diferentes faixas etárias e contextos familiares.
4. **Formulário de Acolhimento do Paciente (`src/components/PatientMatchingModal.tsx`):** Modal amigável e acolhedor pós-cadastro e edição no painel do paciente.
5. **Aba de Matching no Painel do Profissional (`src/components/PsychologistDashboard.tsx`):**
   - Configuração de tags no perfil do profissional.
   - Nova aba "Pacientes Recomendados" com ordenação por afinidade, tags em comum e botão de ação.
6. **Compilação e Verificação:** Garantir build sem erros com `compile_applet`.

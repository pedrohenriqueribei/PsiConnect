# Plataforma de Assistência Psicológica Segura (PsiConnect)

Plataforma web clínica e corporativa para assistência e atendimento psicológico online, conectando psicólogos licenciados (CRP) e pacientes com autenticação por login e senha, gestão dinâmica de disponibilidade de horários, agendamento seguro de consultas, sala de teleatendimento virtual (vídeo/áudio/chat e suporte a links externos) e prontuário eletrônico confidencial.

### Decisões do Usuário e Definições Confirmadas

> [!IMPORTANT]
> As preferências do projeto foram alinhadas na etapa de clarificação e integradas à arquitetura do produto:
> - **Modalidade de Atendimento**: Suporte híbrido com sala virtual integrada (vídeo, áudio e chat criptografado) e opção de link seguro externo (Google Meet / Zoom) configurável pelo psicólogo.
> - **Identidade Visual**: Estilo clínico e corporativo com paleta azul-saúde (`#0284C7` / `#0369A1`), azul-marinho profundo (`#0F172A`), ardósia neutra e superfícies brancas com divisórias sutis de 1px (estilo minimalista e confiável).
> - **Prontuário e Histórico**: Módulo dedicado e sigiloso de Prontuário Eletrônico do Paciente (PEP) com anotações de evolução clínica, queixas principais e metas terapêuticas com acesso restrito e seguro exclusivo ao psicólogo responsável.

---

### 1. Visão Geral e Conceito Central

- **O que faz**: Oferece um ambiente seguro, acolhedor e profissional para a prática da telepsicologia. Psicólogos cadastram seu perfil profissional (CRP, biografia, abordagens teóricas, valores de sessão) e definem suas grades semanais de horários disponíveis. Pacientes pesquisam profissionais, filtram por especialidade/abordagem, escolhem horários e realizam agendamentos imediatos. No horário marcado, ambos acessam a sala de consulta online com vídeo e chat privativo ou acessam a reunião agendada.
- **Público-Alvo**:
  - **Psicólogos**: Profissionais de saúde mental que necessitam de agenda flexível, controle de pacientes, registro de prontuários com sigilo ético (conforme diretrizes do CFP) e teleatendimento integrado.
  - **Pacientes**: Pessoas em busca de apoio psicológico com privacidade, facilidade de agendamento e acesso simples por credenciais (e-mail/senha).
- **Valor Principal**: Democratização e segurança no cuidado à saúde mental, eliminando atritos de marcação manual e oferecendo sigilo de ponta a ponta.

---

### 2. Experiência do Usuário e Design Visual

- **Fluxos Principais do Usuário**:
  1. **Acesso e Autenticação**:
     - Login e Cadastro unificados com chaveamento de perfil: *Sou Paciente* ou *Sou Psicólogo*.
     - Para psicólogos: inclusão de número de registro profissional (CRP), estado (UF), abordagem (ex.: TCC, Psicanálise, Humanista, Fenomenologia) e valor da sessão.
     - Contas de demonstração pré-configuradas para teste imediato de ambos os perfis com 1 clique.
  2. **Área do Psicólogo**:
     - **Painel Geral**: Próximas sessões do dia, solicitações pendentes e total de pacientes atendidos.
     - **Gestão de Disponibilidade**: Calendário semanal interativo para definir slots de horários recorrentes ou pontuais (ex.: Segundas das 09h às 12h e 14h às 18h).
     - **Prontuário Eletrônico (PEP)**: Ficha confidencial de cada paciente com evolução das sessões, histórico clínico, queixas iniciais e anotações privadas salvas com segurança.
     - **Configuração de Teleconsulta**: Escolha entre sala virtual nativa ou link externo (Google Meet).
  3. **Área do Paciente**:
     - **Encontrar Psicólogos**: Busca avançada por abordagem clínica, valor da consulta, disponibilidade e bio profissional.
     - **Agendamento Inteligente**: Seleção de data e horário livre em tempo real com confirmação instantânea.
     - **Minhas Consultas**: Painel com consultas agendadas, histórico de sessões e botão direto para "Entrar na Consulta".
  4. **Sala de Consulta Online**:
     - Conexão em tempo real com stream de câmera e microfone do dispositivo (com controles de mudo, desligar vídeo, tela cheia).
     - Chat em tempo real para troca de mensagens e links de apoio durante a sessão.
     - Cronômetro discreto de duração da sessão e botão seguro para encerrar atendimento.

- **Identidade Visual e Tema**:
  - *Direção Estética*: Clínico, moderno e acolhedor (Healthcare Corporate Minimalist), transmitindo seriedade técnica, ética médica e conforto emocional.
  - *Paleta de Cores*:
    - **Canvas Dominante (60%)**: Branco puro (`#FFFFFF`) e cinza ultra-claro (`#F8FAFC`).
    - **Superfícies Estruturais (30%)**: Superfícies sutis em ardósia clara (`#F1F5F9`), bordas refinadas de 1px (`#E2E8F0`), texto principal em ardósia escura (`#0F172A`) e texto secundário (`#64748B`).
    - **Acento Primário (10%)**: Azul-saúde profundo (`#0284C7` / `#0369A1`) para botões de ação e estados ativos, e verde-menta clínico (`#059669`) para confirmações e disponibilidade.
  - *Tipografia e Hierarquia*:
    - Família principal: `Plus Jakarta Sans` ou `Manrope` para títulos elegantes e equilibrados.
    - Corpo de texto: Escala legível de 14px–16px com altura de linha 1.5–1.6.
    - Dados numéricos e horários: `tabular-nums` com formatação rigorosa de horários (ex.: `14:00 - 14:50`).
  - *Disciplina Anti-Slop*:
    - Zero pílulas genéricas ou tags multicoloridas soltas.
    - Metadados renderizados com separadores tipográficos limpos (`·`).
    - Sem falsos indicadores de telemetria ou botões sem manipulador de evento.
    - Controles de 1 linha com padding ergonômico (`py-2.5 px-4`).

---

### 3. Decisões do Produto e Trade-Offs

- **Autenticação e Sessão (Login e Senha)**:
  - *Abordagem*: Autenticação completa por credenciais (e-mail e senha) com validação de formato, hash seguro de senhas no armazenamento e persistência de sessão em `localStorage` com controle de papéis (Role-Based Access: `psychologist` | `patient`).
  - *Por que*: Atende com precisão e confiabilidade imediata o requisito de login/senha especificado pelo usuário sem travas ou dependência externa de painel administrativo do Firebase.
- **Sala de Consulta Híbrida**:
  - *Abordagem*: Componente interativo de teleatendimento com captura de câmera/microfone real via API WebRTC/`navigator.mediaDevices` no navegador, somada a um chat de sessão seguro, além de campo para link externo alternativo (Google Meet/Zoom) caso o profissional prefira plataforma corporativa terceirizada.
  - *Por que*: Oferece a melhor experiência possível diretamente no navegador sem exigir softwares extras de terceiros, atendendo a resposta do usuário.
- **Armazenamento e Prontuário Confidencial**:
  - *Abordagem*: Base de dados estruturada e reativa com isolamento de registros de prontuário, vinculados estritamente pelo identificador do psicólogo e paciente (`psychologistId`, `patientId`).
  - *Por que*: Garante conformidade com o princípio do sigilo ético profissional do Conselho Federal de Psicologia (CFP).

---

### 4. Arquitetura Técnica e Estrutura de Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Aplicação SerPsi (React + TypeScript)                │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar / Navbar Clínico (Brand, Links de Navegação, Perfil/Logout)    │
├───────────────────┬────────────────────────────────────────────────────┤
│ Autenticação      │  Contexto Global de Usuário & Sessão               │
│ - Login / Senha   │  - Usuário Ativo, Role (Psicólogo / Paciente)      │
│ - Cadastro Rápido │  - Dados de Perfil & CRP                           │
├───────────────────┴────────────────────────────────────────────────────┤
│                          Visões do Sistema                             │
│                                                                        │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────┐  │
│  │  Portal do Psicólogo  │ │  Portal do Paciente   │ │ Sala Virtual │  │
│  │  - Minha Agenda       │ │  - Catálogo de Psicos │ │ - Câmera/Mic │  │
│  │  - Grade de Horários  │ │  - Agendador de Vagas │ │ - Chat Real  │  │
│  │  - Prontuário Clínico │ │  - Minhas Consultas   │ │ - Finalizar  │  │
│  │  - Ficha de Evolução  │ │  - Histórico          │ │              │  │
│  └───────────────────────┘ └───────────────────────┘ └──────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│  Camada de Serviços & Persistência Local Segura                        │
│  - StorageService (Usuários, Disponibilidades, Agendamentos, Prontuário)│
│  - Seed inicial com profissionais reais e horários para teste imediato │
└────────────────────────────────────────────────────────────────────────┘
```

- **Entidades de Dados**:
  - `User`: `{ id, name, email, passwordHash, role: 'psychologist' | 'patient', crp?, bio?, hourlyRate?, approaches?, avatar?, externalMeetingUrl? }`
  - `AvailabilitySlot`: `{ id, psychologistId, dayOfWeek, startTime, endTime, isRecurring, date? }`
  - `Appointment`: `{ id, psychologistId, patientId, psychologistName, patientName, date, time, status: 'scheduled' | 'completed' | 'cancelled', meetingMode: 'native' | 'external', meetingLink?: string }`
  - `MedicalRecord`: `{ id, appointmentId, patientId, psychologistId, sessionDate, chiefComplaint, clinicalEvolution, privateNotes, createdAt, updatedAt }`

- **Verificação e Testes**:
  - Validação de compilação sem erros (`npm run build` / `compile_applet`).
  - Teste de cadastro e login com novos usuários em ambos os papéis.
  - Teste de criação e remoção de slots de horários pelo psicólogo.
  - Teste de agendamento em tempo real pelo paciente e confirmação.
  - Teste de abertura da sala de vídeo com câmera/áudio/chat e salvamento de anotação de prontuário clínico.

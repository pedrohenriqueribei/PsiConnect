import {
  PsychologicalRecord,
  EvolutionSession,
  SessionVersionHistory,
  AuditLogEntry,
  RecordStatus,
  GeneralAttachment,
  ClinicalMilestone,
} from '../types/psychologicalRecord';
import { recordSecurity } from './recordSecurity';
import { db, OperationType, handleFirestoreError, stripUndefinedDeep } from './firebase';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY = 'psiconnect_psychological_records_v1';

class PsychologicalRecordStorageService {
  private recordsCache: PsychologicalRecord[] = [];
  private listeners: Set<(records: PsychologicalRecord[]) => void> = new Set();

  constructor() {
    // Clean up any legacy localStorage data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    // Initialize real-time sync with Firestore database
    this.initFirestoreSync();
  }

  private initFirestoreSync(): void {
    try {
      const recordsCol = collection(db, 'psychologicalRecords');
      onSnapshot(recordsCol, (snapshot) => {
        const docs: PsychologicalRecord[] = [];
        snapshot.forEach((d) => {
          docs.push(d.data() as PsychologicalRecord);
        });
        this.recordsCache = docs;
        this.notifyListeners();
      }, (error) => {
        console.warn('Realtime listener error in psychologicalRecords:', error);
      });
    } catch (err) {
      console.warn('Failed to attach psychologicalRecords listener:', err);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.recordsCache]);
      } catch (e) {
        console.error('Error in record listener:', e);
      }
    });
  }

  /**
   * Subscribe to real-time changes in psychological records from Firestore.
   */
  subscribe(listener: (records: PsychologicalRecord[]) => void): () => void {
    this.listeners.add(listener);
    if (this.recordsCache.length > 0) {
      listener([...this.recordsCache]);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private getRecords(): PsychologicalRecord[] {
    return this.recordsCache;
  }

  /**
   * Direct write to Firestore database (ai-studio-psiconnect-230ab3cb-014d-48bc-9bc7-a63bde403618)
   */
  async syncRecordToFirestore(record: PsychologicalRecord): Promise<void> {
    const path = `psychologicalRecords/${record.id}`;
    try {
      await setDoc(doc(db, 'psychologicalRecords', record.id), stripUndefinedDeep(record));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  getAllRecords(): PsychologicalRecord[] {
    return this.getRecords();
  }

  getRecordsByProfessional(professionalId: string): PsychologicalRecord[] {
    return this.getRecords().filter(r => r.professionalId === professionalId);
  }

  getRecordById(recordId: string): PsychologicalRecord | undefined {
    return this.getRecords().find(r => r.id === recordId);
  }

  getRecordByPatientAndProfessional(patientId: string, professionalId: string): PsychologicalRecord | undefined {
    return this.getRecords().find(
      r => r.patientId === patientId && r.professionalId === professionalId
    );
  }

  /**
   * Creates a new unique psychological record for a patient and professional.
   * Business Rule: Cada paciente tem UM prontuário por profissional, criado no primeiro atendimento.
   */
  createRecord(
    recordData: Omit<PsychologicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'auditLogs' | 'retentionUntil'>,
    actor: { id: string; name: string; role: string }
  ): { success: boolean; record?: PsychologicalRecord; error?: string } {
    const records = this.getRecords();
    const existing = records.find(
      r => r.patientId === recordData.patientId && r.professionalId === recordData.professionalId
    );

    if (existing) {
      return {
        success: false,
        error: 'Este paciente já possui um prontuário cadastrado com você. Abra o prontuário existente.',
        record: existing,
      };
    }

    const now = new Date().toISOString();
    const isMinor = recordSecurity.isMinor(recordData.identification.birthDate);

    const initialAudit = recordSecurity.createAuditEntry(
      'criacao_prontuario',
      actor,
      `Abertura de prontuário psicológico para ${recordData.identification.fullName}. Conforme CFP nº 01/2009.`
    );

    const newRecord: PsychologicalRecord = {
      ...recordData,
      id: `pront_${recordData.patientId}_${recordData.professionalId}_${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
      isMinor,
      auditLogs: [initialAudit],
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
      retentionUntil: recordSecurity.calculateRetentionDate(now),
    };

    // Update memory cache and notify
    this.recordsCache = [newRecord, ...this.recordsCache.filter(r => r.id !== newRecord.id)];
    this.notifyListeners();

    // Persist directly to Firestore
    this.syncRecordToFirestore(newRecord).catch((err) => {
      console.error('Failed to persist psychological record to Firestore:', err);
    });

    return { success: true, record: newRecord };
  }

  /**
   * Updates identification, demand, history or therapeutic plan in the record.
   * Logs an audit entry to guarantee trace and compliance.
   */
  updateRecordData(
    recordId: string,
    updates: Partial<Omit<PsychologicalRecord, 'id' | 'patientId' | 'professionalId' | 'sessions' | 'auditLogs'>>,
    actor: { id: string; name: string; role: string }
  ): PsychologicalRecord | undefined {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return undefined;

    const current = records[index];
    const now = new Date().toISOString();

    const auditEntry = recordSecurity.createAuditEntry(
      'edicao_dados',
      actor,
      'Atualização de dados cadastrais/clínicos do prontuário.'
    );

    const updated: PsychologicalRecord = {
      ...current,
      ...updates,
      updatedAt: now,
      auditLogs: [auditEntry, ...current.auditLogs],
    };

    this.recordsCache = this.recordsCache.map(r => r.id === updated.id ? updated : r);
    this.notifyListeners();

    // Write to Firestore
    this.syncRecordToFirestore(updated).catch(err => {
      console.error('Failed to update psychological record in Firestore:', err);
    });

    return updated;
  }

  /**
   * Registers a new evolution session inside the psychological record.
   * Business rule: Cada sessão gera um novo REGISTRO DE EVOLUÇÃO dentro do prontuário.
   */
  addSessionEvolution(
    recordId: string,
    sessionInput: Omit<EvolutionSession, 'id' | 'sessionNumber' | 'createdAt' | 'updatedAt' | 'versions'>,
    actor: { id: string; name: string; role: string }
  ): { success: boolean; session?: EvolutionSession; record?: PsychologicalRecord; error?: string } {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return { success: false, error: 'Prontuário não encontrado.' };

    const record = records[index];
    const sessionCount = record.sessions.length;
    const sessionNumber = sessionCount + 1;
    const now = new Date().toISOString();

    const newSession: EvolutionSession = {
      ...sessionInput,
      id: `sess_${record.patientId}_${sessionNumber}_${Date.now().toString(36)}`,
      sessionNumber,
      createdAt: now,
      updatedAt: now,
      versions: [],
    };

    const auditEntry = recordSecurity.createAuditEntry(
      'registro_sessao',
      actor,
      `Registro da Sessão de Evolução nº ${sessionNumber} realizada em ${newSession.date}.`
    );

    const updatedRecord: PsychologicalRecord = {
      ...record,
      sessions: [newSession, ...record.sessions], // Latest on top
      updatedAt: now,
      retentionUntil: recordSecurity.calculateRetentionDate(newSession.date),
      auditLogs: [auditEntry, ...record.auditLogs],
    };

    this.recordsCache = this.recordsCache.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    this.notifyListeners();

    // Write to Firestore
    this.syncRecordToFirestore(updatedRecord).catch(err => {
      console.error('Failed to sync new session to Firestore:', err);
    });

    return { success: true, session: newSession, record: updatedRecord };
  }

  /**
   * Updates an existing evolution session.
   * Business rule: Registros NUNCA são apagados; edições geram histórico de versões (data, hora, autor).
   */
  updateSessionEvolution(
    recordId: string,
    sessionId: string,
    updatedData: Partial<EvolutionSession>,
    changesSummary: string,
    actor: { id: string; name: string; role: string }
  ): { success: boolean; session?: EvolutionSession; record?: PsychologicalRecord; error?: string } {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return { success: false, error: 'Prontuário não encontrado.' };

    const record = records[index];
    const sessionIndex = record.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return { success: false, error: 'Sessão não encontrada no prontuário.' };

    const oldSession = record.sessions[sessionIndex];
    const now = new Date().toISOString();

    // Create immutable version snapshot
    const versionSnapshot: SessionVersionHistory = {
      versionNumber: oldSession.versions.length + 1,
      editedAt: now,
      editedBy: `${actor.name} (${actor.role})`,
      authorId: actor.id,
      changesSummary: changesSummary || 'Edição de anotações da evolução clínica.',
      previousContent: {
        summaryContent: oldSession.summaryContent,
        interventions: oldSession.interventions,
        evolutionScore: oldSession.evolutionScore,
        evolutionTrend: oldSession.evolutionTrend,
        evolutionNotes: oldSession.evolutionNotes,
        emotionalState: oldSession.emotionalState,
        nextSessionTasks: oldSession.nextSessionTasks,
      },
    };

    const newSession: EvolutionSession = {
      ...oldSession,
      ...updatedData,
      updatedAt: now,
      versions: [versionSnapshot, ...oldSession.versions],
    };

    const auditEntry = recordSecurity.createAuditEntry(
      'edicao_sessao',
      actor,
      `Edição da Sessão nº ${oldSession.sessionNumber} gerando Versão nº ${versionSnapshot.versionNumber}. Justificativa: ${changesSummary}`
    );

    const updatedSessions = [...record.sessions];
    updatedSessions[sessionIndex] = newSession;

    const updatedRecord: PsychologicalRecord = {
      ...record,
      sessions: updatedSessions,
      updatedAt: now,
      auditLogs: [auditEntry, ...record.auditLogs],
    };

    this.recordsCache = this.recordsCache.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    this.notifyListeners();

    // Write to Firestore
    this.syncRecordToFirestore(updatedRecord).catch(err => {
      console.error('Failed to sync updated session to Firestore:', err);
    });

    return { success: true, session: newSession, record: updatedRecord };
  }

  /**
   * Updates record status (active, paused, discharged, abandoned, referred).
   */
  updateRecordStatus(
    recordId: string,
    status: RecordStatus,
    closureReason: string | undefined,
    actor: { id: string; name: string; role: string }
  ): PsychologicalRecord | undefined {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return undefined;

    const current = records[index];
    const now = new Date().toISOString();
    const closureDate = status !== 'active' && status !== 'paused' ? now.split('T')[0] : undefined;

    const auditEntry = recordSecurity.createAuditEntry(
      'alteracao_status',
      actor,
      `Alteração de status do prontuário para "${status}". Motivo: ${closureReason || 'Não informado'}`
    );

    const updated: PsychologicalRecord = {
      ...current,
      status,
      closureDate,
      closureReason,
      updatedAt: now,
      retentionUntil: closureDate
        ? recordSecurity.calculateRetentionDate(closureDate)
        : current.retentionUntil,
      auditLogs: [auditEntry, ...current.auditLogs],
    };

    this.recordsCache = this.recordsCache.map(r => r.id === updated.id ? updated : r);
    this.notifyListeners();

    // Write to Firestore
    this.syncRecordToFirestore(updated).catch(err => {
      console.error('Failed to sync record status to Firestore:', err);
    });

    return updated;
  }

  /**
   * Adds an attachment to the psychological record.
   */
  addAttachment(
    recordId: string,
    attachment: Omit<GeneralAttachment, 'id' | 'uploadedAt'>,
    actor: { id: string; name: string; role: string }
  ): PsychologicalRecord | undefined {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return undefined;

    const current = records[index];
    const now = new Date().toISOString();

    const newAtt: GeneralAttachment = {
      ...attachment,
      id: 'att_' + Date.now().toString(36),
      uploadedAt: now,
    };

    const auditEntry = recordSecurity.createAuditEntry(
      'edicao_dados',
      actor,
      `Anexo de documento inserido no prontuário: "${attachment.name}".`
    );

    const updated: PsychologicalRecord = {
      ...current,
      attachments: [newAtt, ...current.attachments],
      updatedAt: now,
      auditLogs: [auditEntry, ...current.auditLogs],
    };

    this.recordsCache = this.recordsCache.map(r => r.id === updated.id ? updated : r);
    this.notifyListeners();

    // Write to Firestore
    this.syncRecordToFirestore(updated).catch(err => {
      console.error('Failed to sync attachment to Firestore:', err);
    });

    return updated;
  }

  /**
   * Adds a clinical milestone to the patient's therapeutic journey.
   */
  addMilestoneToRecord(
    recordId: string,
    milestone: ClinicalMilestone,
    actor: { id: string; name: string; role: string }
  ): PsychologicalRecord | undefined {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return undefined;

    const current = records[index];
    const now = new Date().toISOString();
    const existingMilestones = current.milestones || [];

    const updatedMilestones = [...existingMilestones, milestone];

    const auditEntry = recordSecurity.createAuditEntry(
      'edicao_dados',
      actor,
      `Registro de marco clínico na Jornada do Paciente: "${milestone.title}".`
    );

    const updated: PsychologicalRecord = {
      ...current,
      milestones: updatedMilestones,
      updatedAt: now,
      auditLogs: [auditEntry, ...current.auditLogs],
    };

    this.recordsCache = this.recordsCache.map(r => r.id === updated.id ? updated : r);
    this.notifyListeners();

    // Write to Firestore
    this.syncRecordToFirestore(updated).catch(err => {
      console.error('Failed to sync milestone to Firestore:', err);
    });

    return updated;
  }

  /**
   * Logs a view or export event in the immutable audit trail.
   */
  logAuditAction(
    recordId: string,
    action: AuditLogEntry['action'],
    actor: { id: string; name: string; role: string },
    details: string
  ): void {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return;

    const current = records[index];
    const auditEntry = recordSecurity.createAuditEntry(action, actor, details);

    const updated = {
      ...current,
      auditLogs: [auditEntry, ...current.auditLogs],
    };

    this.recordsCache = this.recordsCache.map(r => r.id === updated.id ? updated : r);
    this.notifyListeners();

    // Write to Firestore
    this.syncRecordToFirestore(updated).catch(err => {
      console.error('Failed to sync audit log to Firestore:', err);
    });
  }
}

export const psychologicalRecordStorage = new PsychologicalRecordStorageService();


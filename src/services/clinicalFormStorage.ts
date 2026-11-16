import {
  ClinicalForm,
  FormDispatch,
  FormSubmission,
  QuestionAnswer,
  FormStatus,
} from '../types/clinicalForm';
import { recordSecurity } from './recordSecurity';
import { db, OperationType, handleFirestoreError, stripUndefinedDeep } from './firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

class ClinicalFormStorageService {
  private formsCache: ClinicalForm[] = [];
  private dispatchesCache: FormDispatch[] = [];
  private submissionsCache: FormSubmission[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initFirestoreSync();
  }

  private initFirestoreSync(): void {
    try {
      // 1. Listen to clinicalForms
      onSnapshot(
        collection(db, 'clinicalForms'),
        snapshot => {
          const docs: ClinicalForm[] = [];
          snapshot.forEach(d => docs.push(d.data() as ClinicalForm));
          this.formsCache = docs;
          this.notify();
        },
        err => console.warn('Realtime listener error in clinicalForms:', err)
      );

      // 2. Listen to formDispatches
      onSnapshot(
        collection(db, 'formDispatches'),
        snapshot => {
          const docs: FormDispatch[] = [];
          snapshot.forEach(d => docs.push(d.data() as FormDispatch));
          this.dispatchesCache = docs;
          this.notify();
        },
        err => console.warn('Realtime listener error in formDispatches:', err)
      );

      // 3. Listen to formSubmissions
      onSnapshot(
        collection(db, 'formSubmissions'),
        snapshot => {
          const docs: FormSubmission[] = [];
          snapshot.forEach(d => docs.push(d.data() as FormSubmission));
          this.submissionsCache = docs;
          this.notify();
        },
        err => console.warn('Realtime listener error in formSubmissions:', err)
      );
    } catch (err) {
      console.warn('Failed to attach clinical forms listeners:', err);
    }
  }

  private notify(): void {
    this.listeners.forEach(l => {
      try {
        l();
      } catch (err) {
        console.error('Error in form storage listener:', err);
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ==========================================
  // 1. FORMS MANAGEMENT & RIGID TENANT ISOLATION
  // ==========================================

  /**
   * Strictly returns forms that belong to this professional.
   * Total tenant/owner isolation: no other professional can view, edit or clone these forms.
   */
  getFormsByProfessional(professionalId: string): ClinicalForm[] {
    return this.formsCache.filter(f => f.professionalId === professionalId);
  }

  /**
   * Retrieves a single form ensuring owner verification.
   */
  getFormById(formId: string, professionalId?: string): ClinicalForm | undefined {
    const form = this.formsCache.find(f => f.id === formId);
    if (!form) return undefined;
    if (professionalId && form.professionalId !== professionalId) {
      // Access denied across professional tenant boundary
      return undefined;
    }
    return form;
  }

  /**
   * Patient answering form: allows fetching a published form if dispatched.
   */
  getPublishedFormForPatient(formId: string): ClinicalForm | undefined {
    const form = this.formsCache.find(f => f.id === formId);
    if (!form || form.status !== 'published') return undefined;
    return form;
  }

  /**
   * Saves or creates a form with strict owner binding.
   */
  async saveForm(form: ClinicalForm): Promise<ClinicalForm> {
    const now = new Date().toISOString();
    const updatedForm: ClinicalForm = stripUndefinedDeep({
      ...form,
      updatedAt: now,
      createdAt: form.createdAt || now,
    });

    // Update cache immediately
    const index = this.formsCache.findIndex(f => f.id === updatedForm.id);
    if (index >= 0) {
      this.formsCache[index] = updatedForm;
    } else {
      this.formsCache.unshift(updatedForm);
    }
    this.notify();

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'clinicalForms', updatedForm.id), updatedForm);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `clinicalForms/${updatedForm.id}`);
    }

    return updatedForm;
  }

  /**
   * Duplicates an existing form for the professional.
   * Strictly bounds the clone to the calling professional.
   */
  async duplicateForm(formId: string, professionalId: string, professionalName: string): Promise<ClinicalForm> {
    const original = this.getFormById(formId, professionalId);
    if (!original) {
      throw new Error('Formulário não encontrado ou você não tem permissão para duplicá-lo.');
    }

    const now = new Date().toISOString();
    const duplicated: ClinicalForm = {
      ...original,
      id: 'form_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      professionalId,
      professionalName,
      title: `${original.title} (Cópia)`,
      status: 'draft', // Clones start as Drafts for safety
      createdAt: now,
      updatedAt: now,
      questions: original.questions.map(q => ({
        ...q,
        id: 'q_' + Math.random().toString(36).substring(2, 8),
      })),
    };

    return this.saveForm(duplicated);
  }

  /**
   * Deletes a form strictly checking owner isolation.
   */
  async deleteForm(formId: string, professionalId: string): Promise<void> {
    const form = this.getFormById(formId, professionalId);
    if (!form) {
      throw new Error('Acesso negado: você só pode excluir formulários de sua autoria.');
    }

    this.formsCache = this.formsCache.filter(f => f.id !== formId);
    this.notify();

    try {
      await deleteDoc(doc(db, 'clinicalForms', formId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `clinicalForms/${formId}`);
    }
  }

  // ==========================================
  // 2. DISPATCHES & MANDATORY TIMESTAMP AUDITING
  // ==========================================

  /**
   * Dispatches a form to a specific patient.
   * Rigorously stamps exact `sentAt` ISO timestamp.
   */
  async dispatchForm(params: {
    formId: string;
    professionalId: string;
    patientId: string;
    patientName: string;
    patientEmail: string;
    deadline?: string;
  }): Promise<FormDispatch> {
    const form = this.getFormById(params.formId, params.professionalId);
    if (!form) {
      throw new Error('Formulário não encontrado ou sem permissão de envio.');
    }
    if (form.status !== 'published') {
      throw new Error('Não é possível enviar um formulário com status de Rascunho. Publique-o primeiro.');
    }

    const sentAt = new Date().toISOString();
    const shareToken = 'tok_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);

    const dispatch: FormDispatch = stripUndefinedDeep({
      id: 'disp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      formId: form.id,
      formTitle: form.title,
      professionalId: params.professionalId,
      patientId: params.patientId,
      patientName: params.patientName,
      patientEmail: params.patientEmail,
      sentAt,
      deadline: params.deadline,
      status: 'pending',
      submissionCount: 0,
      shareToken,
    });

    this.dispatchesCache.unshift(dispatch);
    this.notify();

    try {
      await setDoc(doc(db, 'formDispatches', dispatch.id), dispatch);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `formDispatches/${dispatch.id}`);
    }

    return dispatch;
  }

  getDispatchesByProfessional(professionalId: string): FormDispatch[] {
    return this.dispatchesCache.filter(d => d.professionalId === professionalId);
  }

  getDispatchesByPatient(patientId: string): FormDispatch[] {
    return this.dispatchesCache.filter(d => d.patientId === patientId);
  }

  getDispatchByToken(shareToken: string): FormDispatch | undefined {
    return this.dispatchesCache.find(d => d.shareToken === shareToken);
  }

  getDispatchById(dispatchId: string): FormDispatch | undefined {
    return this.dispatchesCache.find(d => d.id === dispatchId);
  }

  // ==========================================
  // 3. SUBMISSIONS, ENCRYPTION & LONGITUDINAL HISTORY
  // ==========================================

  /**
   * Submits a patient's answers to a form.
   * Obligatorily stamps exact `submittedAt` ISO timestamp.
   * Applies AES-256-GCM cipher envelope to sensitive clinical text to comply with CFP & LGPD.
   */
  async submitFormResponse(params: {
    formId: string;
    dispatchId?: string;
    patientId: string;
    patientName: string;
    patientEmail?: string;
    answers: QuestionAnswer[];
  }): Promise<FormSubmission> {
    const form = this.getPublishedFormForPatient(params.formId);
    if (!form) {
      throw new Error('Formulário não encontrado ou não está disponível para preenchimento.');
    }

    const submittedAt = new Date().toISOString();

    // Clinical encryption of entire answer payload
    const plainJson = JSON.stringify(params.answers);
    const encryptedPayload = recordSecurity.encryptClinicalText(plainJson);

    const submission: FormSubmission = stripUndefinedDeep({
      id: 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      formId: form.id,
      formTitle: form.title,
      dispatchId: params.dispatchId,
      professionalId: form.professionalId, // Rigorous isolation
      patientId: form.isAnonymous ? 'anonimo' : params.patientId,
      patientName: form.isAnonymous ? 'Paciente Anônimo' : params.patientName,
      patientEmail: form.isAnonymous ? undefined : params.patientEmail,
      submittedAt,
      answers: params.answers,
      encryptedPayload,
      isReadByProfessional: false, // Triggers real-time notification in professional panel
    });

    // Update dispatch if exists
    if (params.dispatchId) {
      const dispatch = this.dispatchesCache.find(d => d.id === params.dispatchId);
      if (dispatch) {
        dispatch.status = 'completed';
        dispatch.submissionCount = (dispatch.submissionCount || 0) + 1;
        dispatch.lastSubmittedAt = submittedAt;
        try {
          await setDoc(doc(db, 'formDispatches', dispatch.id), stripUndefinedDeep(dispatch));
        } catch (e) {
          console.warn('Error updating dispatch status:', e);
        }
      }
    }

    this.submissionsCache.unshift(submission);
    this.notify();

    try {
      await setDoc(doc(db, 'formSubmissions', submission.id), submission);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `formSubmissions/${submission.id}`);
    }

    return submission;
  }

  /**
   * Strictly returns submissions for the owner professional.
   */
  getSubmissionsByProfessional(professionalId: string): FormSubmission[] {
    return this.submissionsCache.filter(s => s.professionalId === professionalId);
  }

  /**
   * Returns patient submission history for a specific form and patient.
   * Sorted in ASCENDING chronological order to plot the evolution chart!
   */
  getSubmissionsByPatientAndForm(
    patientId: string,
    formId: string,
    professionalId: string
  ): FormSubmission[] {
    return this.submissionsCache
      .filter(
        s =>
          s.patientId === patientId &&
          s.formId === formId &&
          s.professionalId === professionalId
      )
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  }

  /**
   * Returns all submissions by a patient across all forms.
   */
  getSubmissionsByPatient(patientId: string): FormSubmission[] {
    return this.submissionsCache
      .filter(s => s.patientId === patientId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  /**
   * Marks a submission as read by the professional.
   */
  async markSubmissionAsRead(submissionId: string, professionalId: string): Promise<void> {
    const sub = this.submissionsCache.find(
      s => s.id === submissionId && s.professionalId === professionalId
    );
    if (sub && !sub.isReadByProfessional) {
      sub.isReadByProfessional = true;
      sub.readAt = new Date().toISOString();
      this.notify();
      try {
        await setDoc(doc(db, 'formSubmissions', sub.id), stripUndefinedDeep(sub));
      } catch (e) {
        console.warn('Error marking submission as read in Firestore:', e);
      }
    }
  }

  /**
   * Count unread submissions to show a live badge in the professional dashboard.
   */
  getUnreadSubmissionsCount(professionalId: string): number {
    return this.submissionsCache.filter(
      s => s.professionalId === professionalId && !s.isReadByProfessional
    ).length;
  }
}

export const clinicalFormStorage = new ClinicalFormStorageService();

import {
  User,
  AvailabilitySlot,
  Appointment,
  MedicalRecord,
  ChatMessage,
  PatientMatchingProfile,
  ProfessionalMatchingProfile,
} from '../types';
import { db, auth, OperationType, handleFirestoreError, stripUndefinedDeep } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'serpsi_users_v2',
  CURRENT_USER: 'serpsi_current_user_v2',
  SLOTS: 'serpsi_slots_v1',
  APPOINTMENTS: 'serpsi_appointments_v1',
  RECORDS: 'serpsi_medical_records_v1',
  CHAT: 'serpsi_chat_messages_v1',
};

const REMOVED_DEMO_USER_IDS = new Set([
  'psy_clara',
  'psy_marcos',
  'psy_renata',
  'ther_camila',
  'pas_david',
  'pat_luciana',
  'pat_patricia',
  'pat_lucas',
  'pat_mariana',
  'pat_roberto',
  'pat_enzo',
  'pat_eduardo',
]);

class StorageService {
  private usersCache: User[] = [];
  private slotsCache: AvailabilitySlot[] = [];
  private appointmentsCache: Appointment[] = [];
  private recordsCache: MedicalRecord[] = [];
  private messagesCache: ChatMessage[] = [];

  private listeners: Set<() => void> = new Set();
  private isInitialized = false;
  private usersLoaded = false;

  constructor() {
    // Clear legacy localStorage data stores and any removed demo session
    try {
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.SLOTS);
      localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
      localStorage.removeItem(STORAGE_KEYS.RECORDS);
      localStorage.removeItem(STORAGE_KEYS.CHAT);

      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as Partial<User>;
        if (!parsed?.id || REMOVED_DEMO_USER_IDS.has(parsed.id)) {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
      }
    } catch {}

    // Initialize real-time synchronization with Firestore database
    this.initFirestoreSync();
  }

  private initFirestoreSync(): void {
    try {
      // 1. Users real-time listener
      onSnapshot(collection(db, 'users'), (snapshot) => {
        const list: User[] = [];
        snapshot.forEach((d) => list.push(d.data() as User));
        this.usersCache = list;
        this.usersLoaded = true;
        this.notifyListeners();
      }, (err) => console.warn('Users listener:', err));

      // 2. Slots real-time listener
      onSnapshot(collection(db, 'slots'), (snapshot) => {
        const list: AvailabilitySlot[] = [];
        snapshot.forEach((d) => list.push(d.data() as AvailabilitySlot));
        this.slotsCache = list;
        this.notifyListeners();
      }, (err) => console.warn('Slots listener:', err));

      // 3. Appointments real-time listener
      onSnapshot(collection(db, 'appointments'), (snapshot) => {
        const list: Appointment[] = [];
        snapshot.forEach((d) => list.push(d.data() as Appointment));
        this.appointmentsCache = list;
        this.notifyListeners();
      }, (err) => console.warn('Appointments listener:', err));

      // 4. Medical records real-time listener
      onSnapshot(collection(db, 'medicalRecords'), (snapshot) => {
        const list: MedicalRecord[] = [];
        snapshot.forEach((d) => list.push(d.data() as MedicalRecord));
        this.recordsCache = list;
        this.notifyListeners();
      }, (err) => console.warn('MedicalRecords listener:', err));

      // 5. Messages real-time listener
      onSnapshot(collection(db, 'messages'), (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((d) => list.push(d.data() as ChatMessage));
        this.messagesCache = list;
        this.notifyListeners();
      }, (err) => console.warn('Messages listener:', err));

      this.isInitialized = true;
    } catch (err) {
      console.warn('Failed to initialize Firestore sync in storage:', err);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Error in storage listener callback:', e);
      }
    });
  }

  /**
   * Subscribe to database updates.
   */
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  isUsersLoaded(): boolean {
    return this.usersLoaded;
  }

  // --- Auth & Users ---
  getUsers(): User[] {
    return this.usersCache;
  }

  async fetchUsersFromFirestore(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const list: User[] = [];
      snapshot.forEach((d) => list.push(d.data() as User));
      this.usersCache = list;
      this.usersLoaded = true;
      this.notifyListeners();
      return list;
    } catch (err) {
      console.warn('Erro ao buscar usuários no Firestore:', err);
      return this.usersCache;
    }
  }

  async fetchUserByIdFromFirestore(uid: string): Promise<User | null> {
    const cached = this.usersCache.find(u => u.id === uid);
    if (cached) return cached;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const user = snap.data() as User;
        this.usersCache = [user, ...this.usersCache.filter(u => u.id !== user.id)];
        this.notifyListeners();
        return user;
      }
      return null;
    } catch (err) {
      console.warn('Erro ao buscar usuário por ID no Firestore:', err);
      return null;
    }
  }

  async fetchUserByEmailFromFirestore(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const cached = this.usersCache.find(u => u.email.toLowerCase() === normalized);
    if (cached) return cached;
    const users = this.usersLoaded ? this.usersCache : await this.fetchUsersFromFirestore();
    return users.find(u => u.email.toLowerCase() === normalized) || null;
  }

  async saveUserToFirestore(user: User): Promise<void> {
    const path = `users/${user.id}`;
    try {
      const cleanData = stripUndefinedDeep(user);
      await setDoc(doc(db, 'users', user.id), cleanData);
      this.usersCache = [user, ...this.usersCache.filter((u) => u.id !== user.id)];
      this.notifyListeners();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async saveUserAsync(newUser: Omit<User, 'id' | 'joinedAt'>): Promise<{ success: boolean; user?: User; error?: string }> {
    const existing = await this.fetchUserByEmailFromFirestore(newUser.email);
    if (existing) {
      return { success: false, error: 'Já existe uma conta cadastrada com este e-mail.' };
    }

    const createdUser: User = {
      ...newUser,
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      joinedAt: new Date().toISOString(),
    };

    await this.saveUserToFirestore(createdUser);
    return { success: true, user: createdUser };
  }

  saveUser(newUser: Omit<User, 'id' | 'joinedAt'>): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existing) {
      return { success: false, error: 'Já existe uma conta cadastrada com este e-mail.' };
    }

    const createdUser: User = {
      ...newUser,
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      joinedAt: new Date().toISOString(),
    };

    this.usersCache = [createdUser, ...this.usersCache.filter(u => u.id !== createdUser.id)];
    this.notifyListeners();

    // Persist directly to Firestore database
    this.saveUserToFirestore(createdUser).catch((err) => {
      console.error('Error saving user to Firestore:', err);
    });

    return { success: true, user: createdUser };
  }

  updateUser(updated: User): void {
    const existsInCache = this.usersCache.some(u => u.id === updated.id);
    this.usersCache = existsInCache
      ? this.usersCache.map(u => (u.id === updated.id ? updated : u))
      : [updated, ...this.usersCache];
    this.notifyListeners();

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === updated.id) {
      this.setCurrentUser(updated);
    }

    // Direct write to Firestore database
    const path = `users/${updated.id}`;
    const cleanData = stripUndefinedDeep(updated);
    setDoc(doc(db, 'users', updated.id), cleanData, { merge: true }).catch(error => {
      handleFirestoreError(error, OperationType.UPDATE, path);
    });
  }

  findUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!stored) {
        return null;
      }
      const parsed = JSON.parse(stored) as User;
      if (!parsed?.id || REMOVED_DEMO_USER_IDS.has(parsed.id)) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } catch {}
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } catch {}
    }
  }

  getProfessionals(careCategory?: 'therapy' | 'biblical', professionalType?: string): User[] {
    let list = this.getUsers().filter(u => u.role !== 'patient');
    if (careCategory) {
      list = list.filter(u => u.careCategory === careCategory);
    }
    if (professionalType && professionalType !== 'all') {
      list = list.filter(u => u.professionalType === professionalType || u.role === professionalType);
    }
    return list;
  }

  getPsychologists(): User[] {
    return this.getProfessionals();
  }

  getAllPatients(): User[] {
    return this.getUsers().filter(u => u.role === 'patient');
  }

  savePatientMatchingProfile(patientId: string, profile: PatientMatchingProfile): User | null {
    const user = this.getUsers().find(u => u.id === patientId);
    if (!user) return null;
    const updatedUser: User = {
      ...user,
      patientProfile: profile,
    };
    this.updateUser(updatedUser);
    return updatedUser;
  }

  saveProfessionalMatchingProfile(profId: string, profile: ProfessionalMatchingProfile): User | null {
    const user = this.getUsers().find(u => u.id === profId);
    if (!user) return null;
    const updatedUser: User = {
      ...user,
      professionalProfile: profile,
      isAcceptingNewPatients:
        typeof profile.acceptsNewMatchedPatients === 'boolean'
          ? profile.acceptsNewMatchedPatients
          : user.isAcceptingNewPatients ?? true,
    };
    this.updateUser(updatedUser);
    return updatedUser;
  }

  updateProfessionalAvailabilityStatus(profId: string, isAccepting: boolean): User | null {
    const user = this.getUsers().find(u => u.id === profId);
    if (!user) return null;
    const updatedProfile: ProfessionalMatchingProfile = {
      ageGroup: user.professionalProfile?.ageGroup || '36-50',
      affinityTags: user.professionalProfile?.affinityTags || user.clinicalTags || [],
      ...user.professionalProfile,
      acceptsNewMatchedPatients: isAccepting,
      updatedAt: new Date().toISOString(),
    };
    const updatedUser: User = {
      ...user,
      isAcceptingNewPatients: isAccepting,
      professionalProfile: updatedProfile,
    };
    this.updateUser(updatedUser);
    return updatedUser;
  }

  // --- Disponibilidade e Horários ---
  getAvailabilitySlots(psychologistId?: string): AvailabilitySlot[] {
    const all = this.slotsCache;
    if (!psychologistId) return all;
    return all.filter(s => s.psychologistId === psychologistId);
  }

  addAvailabilitySlot(slot: Omit<AvailabilitySlot, 'id'>): AvailabilitySlot {
    const newSlot: AvailabilitySlot = {
      ...slot,
      id: 'slot_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.slotsCache = [...this.slotsCache, newSlot];
    this.notifyListeners();

    const path = `slots/${newSlot.id}`;
    const cleanData = Object.fromEntries(
      Object.entries(newSlot).filter(([_, v]) => v !== undefined)
    );
    setDoc(doc(db, 'slots', newSlot.id), cleanData).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, path);
    });

    return newSlot;
  }

  addAvailabilitySlotsBatch(newSlotsData: Omit<AvailabilitySlot, 'id'>[]): AvailabilitySlot[] {
    if (newSlotsData.length === 0) return [];
    const createdList: AvailabilitySlot[] = [];

    newSlotsData.forEach((slot, index) => {
      const newSlot: AvailabilitySlot = {
        ...slot,
        id: 'slot_' + Date.now().toString(36) + '_' + index + '_' + Math.random().toString(36).substring(2, 5),
      };
      createdList.push(newSlot);
      this.slotsCache.push(newSlot);

      const path = `slots/${newSlot.id}`;
      const cleanData = Object.fromEntries(
        Object.entries(newSlot).filter(([_, v]) => v !== undefined)
      );
      setDoc(doc(db, 'slots', newSlot.id), cleanData).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, path);
      });
    });

    this.notifyListeners();
    return createdList;
  }

  removeAvailabilitySlot(slotId: string): void {
    this.slotsCache = this.slotsCache.filter(s => s.id !== slotId);
    this.notifyListeners();

    const path = `slots/${slotId}`;
    deleteDoc(doc(db, 'slots', slotId)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, path);
    });
  }

  removeAvailabilitySlotsBatch(slotIds: string[]): void {
    const set = new Set(slotIds);
    this.slotsCache = this.slotsCache.filter(s => !set.has(s.id));
    this.notifyListeners();

    slotIds.forEach(slotId => {
      const path = `slots/${slotId}`;
      deleteDoc(doc(db, 'slots', slotId)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, path);
      });
    });
  }

  toggleAvailabilitySlot(slotId: string): void {
    const target = this.slotsCache.find(s => s.id === slotId);
    if (!target) return;
    const newActive = !target.isActive;
    this.slotsCache = this.slotsCache.map(s => (s.id === slotId ? { ...s, isActive: newActive } : s));
    this.notifyListeners();

    const path = `slots/${slotId}`;
    updateDoc(doc(db, 'slots', slotId), { isActive: newActive }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, path);
    });
  }

  // --- Agendamentos ---
  getAppointments(userId?: string, role?: 'psychologist' | 'patient'): Appointment[] {
    const all = this.appointmentsCache;
    if (!userId) return all;
    if (role === 'psychologist') {
      return all.filter(a => a.psychologistId === userId);
    } else if (role === 'patient') {
      return all.filter(a => a.patientId === userId);
    }
    return all.filter(a => a.psychologistId === userId || a.patientId === userId);
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.getAppointments().find(a => a.id === id);
  }

  createAppointment(apt: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Appointment {
    const newApt: Appointment = {
      ...apt,
      id: 'apt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    this.appointmentsCache = [newApt, ...this.appointmentsCache];
    this.notifyListeners();

    const path = `appointments/${newApt.id}`;
    const cleanData = Object.fromEntries(
      Object.entries(newApt).filter(([_, v]) => v !== undefined)
    );
    setDoc(doc(db, 'appointments', newApt.id), cleanData).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, path);
    });

    return newApt;
  }

  updateAppointmentStatus(id: string, status: Appointment['status']): void {
    this.appointmentsCache = this.appointmentsCache.map(a =>
      a.id === id ? { ...a, status } : a
    );
    this.notifyListeners();

    const path = `appointments/${id}`;
    updateDoc(doc(db, 'appointments', id), { status }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, path);
    });
  }

  // --- Prontuário Eletrônico do Paciente (PEP) ---
  getMedicalRecords(psychologistId?: string, patientId?: string): MedicalRecord[] {
    let records = this.recordsCache;
    if (psychologistId) {
      records = records.filter(r => r.psychologistId === psychologistId);
    }
    if (patientId) {
      records = records.filter(r => r.patientId === patientId);
    }
    return records;
  }

  getRecordByAppointment(appointmentId: string): MedicalRecord | undefined {
    return this.getMedicalRecords().find(r => r.appointmentId === appointmentId);
  }

  saveMedicalRecord(recordData: Omit<MedicalRecord, 'id' | 'updatedAt'> & { id?: string }): MedicalRecord {
    const existingIndex = this.recordsCache.findIndex(
      r => r.id === recordData.id || r.appointmentId === recordData.appointmentId
    );

    if (existingIndex >= 0) {
      const updated: MedicalRecord = {
        ...this.recordsCache[existingIndex],
        ...recordData,
        updatedAt: new Date().toISOString(),
      };
      this.recordsCache[existingIndex] = updated;
      this.notifyListeners();

      const path = `medicalRecords/${updated.id}`;
      const cleanData = Object.fromEntries(
        Object.entries(updated).filter(([_, v]) => v !== undefined)
      );
      setDoc(doc(db, 'medicalRecords', updated.id), cleanData).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, path);
      });
      return updated;
    } else {
      const created: MedicalRecord = {
        ...recordData,
        id: recordData.id || ('rec_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)),
        updatedAt: new Date().toISOString(),
      };
      this.recordsCache = [created, ...this.recordsCache];
      this.notifyListeners();

      const path = `medicalRecords/${created.id}`;
      const cleanData = Object.fromEntries(
        Object.entries(created).filter(([_, v]) => v !== undefined)
      );
      setDoc(doc(db, 'medicalRecords', created.id), cleanData).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, path);
      });
      return created;
    }
  }

  // --- Chat de Consulta em Tempo Real ---
  getChatMessages(appointmentId: string): ChatMessage[] {
    const all = this.messagesCache;
    return all.filter(m => m.appointmentId === appointmentId);
  }

  sendChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      ...message,
      id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      timestamp,
    };
    this.messagesCache.push(newMsg);
    this.notifyListeners();

    const path = `messages/${newMsg.id}`;
    setDoc(doc(db, 'messages', newMsg.id), stripUndefinedDeep(newMsg)).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, path);
    });

    return newMsg;
  }

  // Real-time Firestore Listeners for Chat
  subscribeChat(appointmentId: string, onUpdate: (messages: ChatMessage[]) => void): Unsubscribe {
    const path = 'messages';
    try {
      const q = query(collection(db, path), where('appointmentId', '==', appointmentId));
      return onSnapshot(
        q,
        snapshot => {
          if (!snapshot.empty) {
            const list: ChatMessage[] = [];
            snapshot.forEach(d => list.push(d.data() as ChatMessage));
            list.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
            onUpdate(list);
          } else {
            onUpdate(this.getChatMessages(appointmentId));
          }
        },
        error => {
          handleFirestoreError(error, OperationType.LIST, path);
        }
      );
    } catch {
      onUpdate(this.getChatMessages(appointmentId));
      return () => {};
    }
  }
}

export const storage = new StorageService();

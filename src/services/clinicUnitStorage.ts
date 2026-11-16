import { ClinicUnit, ClinicUnitPhoto } from '../types/clinicUnit';
import { db, OperationType, handleFirestoreError, stripUndefinedDeep } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

const STORAGE_KEY = 'psiconnect_clinic_units_v1';
const FIRESTORE_COLLECTION = 'clinicUnits';

// Curated high-resolution clinic photos for optional quick selection
export const SAMPLE_CLINIC_PHOTOS: ClinicUnitPhoto[] = [
  {
    id: 'sample_fachada_1',
    category: 'fachada',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80',
    label: 'Fachada Principal & Entrada Acessível',
    highlightTag: 'Acesso Nível da Rua',
    isCover: true,
  },
  {
    id: 'sample_fachada_2',
    category: 'fachada',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
    label: 'Edifício Corporativo & Portaria com Catraca',
    highlightTag: 'Segurança & Estacionamento',
  },
  {
    id: 'sample_recepcao_1',
    category: 'recepcao',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80',
    label: 'Recepção Humanizada & Sala de Espera Climatizada',
    highlightTag: 'Poltronas & Café Cortesia',
  },
  {
    id: 'sample_recepcao_2',
    category: 'recepcao',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80',
    label: 'Balcão de Check-in e Atendimento Acolhedor',
    highlightTag: 'Wi-Fi 5G & Água',
  },
  {
    id: 'sample_consultorio_1',
    category: 'consultorio',
    url: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=1000&q=80',
    label: 'Consultório 01 - Psicoterapia Individual e Adultos',
    highlightTag: 'Isolamento Acústico',
  },
  {
    id: 'sample_consultorio_ludo',
    category: 'consultorio',
    url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1000&q=80',
    label: 'Consultório 02 - Ludoterapia & Atendimento Infantil',
    highlightTag: 'Brinquedos Sensoriais & TEA',
  },
  {
    id: 'sample_teleconsulta',
    category: 'consultorio',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80',
    label: 'Sala Acústica Integrada para Teleconsulta',
    highlightTag: 'Fibra Óptica & Câmera HD',
  },
  {
    id: 'sample_consultorio_casal',
    category: 'consultorio',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    label: 'Consultório 03 - Terapia de Casal e Família',
    highlightTag: 'Ambiente Amplo & Sofás',
  },
  {
    id: 'sample_acessibilidade',
    category: 'outro',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80',
    label: 'Sanitário Acessível PCD & Corredor Podotátil',
    highlightTag: 'Norma ABNT NBR 9050',
  },
];

const REMOVED_SEED_UNIT_IDS = new Set([
  'unit_jardins_matriz',
  'unit_alphaville_saude',
  'unit_botafogo_acolhe',
]);

class ClinicUnitStorageService {
  private inMemoryCache: ClinicUnit[] | null = null;

  public getClinicUnits(): ClinicUnit[] {
    if (this.inMemoryCache) {
      return this.inMemoryCache;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((u: ClinicUnit) => !REMOVED_SEED_UNIT_IDS.has(u.id));
          if (cleaned.length !== parsed.length) {
            this.persistLocally(cleaned);
          }
          this.inMemoryCache = cleaned;
          return cleaned;
        }
      }
    } catch (err) {
      console.warn('Erro ao ler clinic units do localStorage:', err);
    }

    this.inMemoryCache = [];
    return this.inMemoryCache;
  }

  public getClinicUnitById(id: string): ClinicUnit | undefined {
    const list = this.getClinicUnits();
    return list.find(u => u.id === id);
  }

  public async fetchClinicUnitsFromFirestore(): Promise<ClinicUnit[]> {
    try {
      const colRef = collection(db, FIRESTORE_COLLECTION);
      const snapshot = await getDocs(colRef);
      const remoteUnits: ClinicUnit[] = snapshot.docs
        .map(d => d.data() as ClinicUnit)
        .filter(u => !REMOVED_SEED_UNIT_IDS.has(u.id));
      this.inMemoryCache = remoteUnits;
      this.persistLocally(remoteUnits);
      return remoteUnits;
    } catch (err) {
      console.warn('Aviso ao consultar Firestore para clinicUnits:', err);
    }
    return this.getClinicUnits();
  }

  public async saveClinicUnit(unit: ClinicUnit): Promise<ClinicUnit> {
    const list = this.getClinicUnits();
    const existingIndex = list.findIndex(u => u.id === unit.id);
    let updatedList: ClinicUnit[];

    const unitToSave: ClinicUnit = {
      ...unit,
      updatedAt: new Date().toISOString(),
      createdAt: unit.createdAt || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = unitToSave;
    } else {
      updatedList = [unitToSave, ...list];
    }

    this.inMemoryCache = updatedList;
    this.persistLocally(updatedList);

    // Save to Firestore
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, unitToSave.id);
      await setDoc(docRef, stripUndefinedDeep(unitToSave));
    } catch (err) {
      console.warn('Erro ao sincronizar unidade no Firestore (salvo localmente):', err);
    }

    return unitToSave;
  }

  public async deleteClinicUnit(unitId: string): Promise<void> {
    const list = this.getClinicUnits();
    const updated = list.filter(u => u.id !== unitId);
    this.inMemoryCache = updated;
    this.persistLocally(updated);

    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, unitId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Erro ao deletar unidade do Firestore:', err);
    }
  }

  private persistLocally(units: ClinicUnit[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
    } catch (err) {
      console.warn('Erro ao persistir clinic units no localStorage:', err);
    }
  }
}

export const clinicUnitStorage = new ClinicUnitStorageService();

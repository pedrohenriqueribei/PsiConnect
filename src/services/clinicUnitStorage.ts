import { ClinicUnit, ClinicUnitPhoto } from '../types/clinicUnit';
import { db, OperationType, handleFirestoreError } from './firebase';
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

// Curated high-resolution clinic photos for demo and quick selection
export const SAMPLE_CLINIC_PHOTOS: ClinicUnitPhoto[] = [
  {
    id: 'sample_fachada_1',
    category: 'fachada',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80',
    label: 'Fachada Principal & Entrada Acessível',
  },
  {
    id: 'sample_recepcao_1',
    category: 'recepcao',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80',
    label: 'Recepção Humanizada & Sala de Espera',
  },
  {
    id: 'sample_consultorio_1',
    category: 'consultorio',
    url: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=1000&q=80',
    label: 'Consultório de Psicoterapia Individual',
  },
  {
    id: 'sample_consultorio_ludo',
    category: 'consultorio',
    url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1000&q=80',
    label: 'Sala de Ludoterapia & Atendimento Infantil',
  },
  {
    id: 'sample_teleconsulta',
    category: 'consultorio',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80',
    label: 'Sala Acústica com Equipamento de Teleconsulta',
  },
];

const INITIAL_CLINIC_UNITS: ClinicUnit[] = [
  {
    id: 'unit_jardins_matriz',
    cnpj: '42.128.940/0001-85',
    tradeName: 'Psiconnect Jardins & Instituto de Saúde Mental',
    legalName: 'Psiconnect Serviços Clínicos e Terapêuticos Ltda.',
    cnesNumber: '9841203',
    technicalLeadName: 'Dra. Clara Vasconcellos',
    technicalLeadCrp: 'CRP 06/138420',
    landlinePhone: '(11) 3254-8800',
    receptionWhatsapp: '(11) 98452-3310',
    institutionalEmail: 'recepcao.jardins@psiconnect.med.br',
    photos: [
      SAMPLE_CLINIC_PHOTOS[0],
      SAMPLE_CLINIC_PHOTOS[1],
      SAMPLE_CLINIC_PHOTOS[2],
      SAMPLE_CLINIC_PHOTOS[3],
    ],
    zipCode: '01414-001',
    street: 'Alameda Santos',
    number: '1820',
    complement: 'Conjunto 142 - 14º Andar',
    neighborhood: 'Cerqueira César',
    city: 'São Paulo',
    state: 'SP',
    operatingHours: 'Segunda a Sexta das 08h às 21h | Sábados das 08h às 14h',
    accessibilityItems: [
      'rampa',
      'elevador',
      'banheiro_adaptado',
      'piso_tatile',
      'portas_largas',
      'vagas_reservadas',
      'sinalizacao_braille',
    ],
    serviceTypes: [
      'presencial',
      'teleconsulta',
      'infantil_atipicidades',
      'casal_familia',
      'grupo',
    ],
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-02-01T15:00:00Z',
  },
  {
    id: 'unit_alphaville_saude',
    cnpj: '38.419.055/0001-22',
    tradeName: 'Centro Clínico de Psicoterapia Alphaville',
    legalName: 'Alphaville Saúde Mental Integrada Eireli',
    cnesNumber: '7458921',
    technicalLeadName: 'Dr. Marcos Alencar',
    technicalLeadCrp: 'CRP 06/112504',
    landlinePhone: '(11) 4195-2240',
    receptionWhatsapp: '(11) 97120-4491',
    institutionalEmail: 'contato@psicoalphaville.com.br',
    photos: [
      SAMPLE_CLINIC_PHOTOS[1],
      SAMPLE_CLINIC_PHOTOS[2],
      SAMPLE_CLINIC_PHOTOS[4],
    ],
    zipCode: '06454-000',
    street: 'Alameda Rio Negro',
    number: '585',
    complement: 'Bloco B - Sala 804',
    neighborhood: 'Alphaville Centro Industrial',
    city: 'Barueri',
    state: 'SP',
    operatingHours: 'Segunda a Sexta das 07h30 às 20h30',
    accessibilityItems: [
      'rampa',
      'elevador',
      'banheiro_adaptado',
      'portas_largas',
      'vagas_reservadas',
    ],
    serviceTypes: [
      'presencial',
      'teleconsulta',
      'casal_familia',
    ],
    createdAt: '2025-01-20T11:00:00Z',
    updatedAt: '2025-02-10T09:30:00Z',
  },
  {
    id: 'unit_botafogo_acolhe',
    cnpj: '50.892.311/0001-70',
    tradeName: 'Espaço Psicanálise & Acolhimento Botafogo',
    legalName: 'Botafogo Terapias & Clínica Psicanalítica Ltda.',
    cnesNumber: '8192304',
    technicalLeadName: 'Dra. Renata Mendonça',
    technicalLeadCrp: 'CRP 05/44912',
    landlinePhone: '(21) 2537-9100',
    receptionWhatsapp: '(21) 99318-6205',
    institutionalEmail: 'acolhimento.botafogo@psiconnect.med.br',
    photos: [
      SAMPLE_CLINIC_PHOTOS[0],
      SAMPLE_CLINIC_PHOTOS[2],
    ],
    zipCode: '22260-001',
    street: 'Rua Voluntários da Pátria',
    number: '190',
    complement: 'Sala 603',
    neighborhood: 'Botafogo',
    city: 'Rio de Janeiro',
    state: 'RJ',
    operatingHours: 'Segunda a Sexta das 08h às 20h',
    accessibilityItems: [
      'rampa',
      'elevador',
      'banheiro_adaptado',
      'portas_largas',
    ],
    serviceTypes: [
      'presencial',
      'teleconsulta',
      'grupo',
    ],
    createdAt: '2025-02-01T14:00:00Z',
    updatedAt: '2025-02-15T18:00:00Z',
  },
];

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.inMemoryCache = parsed;
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Erro ao ler clinic units do localStorage:', err);
    }

    // Seed initial
    this.inMemoryCache = [...INITIAL_CLINIC_UNITS];
    this.persistLocally(this.inMemoryCache);
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
      if (!snapshot.empty) {
        const remoteUnits: ClinicUnit[] = snapshot.docs.map(d => d.data() as ClinicUnit);
        if (remoteUnits.length > 0) {
          this.inMemoryCache = remoteUnits;
          this.persistLocally(remoteUnits);
          return remoteUnits;
        }
      }
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
      await setDoc(docRef, unitToSave);
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

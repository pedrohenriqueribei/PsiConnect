/**
 * Firestore Security Rules Test Suite for Psiconnect
 * Validates access control and asserts PERMISSION_DENIED on the Dirty Dozen adversarial payloads.
 */

export interface TestCase {
  id: string;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email?: string } | null;
  data?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: TestCase[] = [
  {
    id: 'DD-01',
    name: 'Identity Spoofing - Impersonate Psychologist',
    operation: 'create',
    path: '/users/psy_clara',
    auth: { uid: 'attacker_123', email: 'attacker@test.com' },
    data: { id: 'psy_clara', name: 'Fake Clara', email: 'clara@psiconnect.med.br', role: 'psychologist' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-02',
    name: 'Patient PII Scraping by third party',
    operation: 'get',
    path: '/users/pat_lucas',
    auth: { uid: 'unrelated_user_789' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-03',
    name: 'Slot Hijacking by unauthorized user',
    operation: 'create',
    path: '/slots/slot_malicious',
    auth: { uid: 'attacker_123' },
    data: { id: 'slot_malicious', psychologistId: 'psy_clara', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', isActive: true },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-04',
    name: 'Ghost Slot Deletion by non-owner',
    operation: 'delete',
    path: '/slots/slot_1',
    auth: { uid: 'attacker_123' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-05',
    name: 'Unauthenticated Appointment Creation',
    operation: 'create',
    path: '/appointments/apt_fake',
    auth: null,
    data: { id: 'apt_fake', psychologistId: 'psy_clara', patientId: 'anon' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-06',
    name: 'Appointment Patient Impersonation',
    operation: 'create',
    path: '/appointments/apt_spoof',
    auth: { uid: 'attacker_123' },
    data: { id: 'apt_spoof', psychologistId: 'psy_clara', patientId: 'pat_lucas' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-07',
    name: 'Appointment Participant Snooping',
    operation: 'get',
    path: '/appointments/apt_today_1',
    auth: { uid: 'third_party_456' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-08',
    name: 'State Skipping / Immutable Field Tampering',
    operation: 'update',
    path: '/appointments/apt_today_1',
    auth: { uid: 'pat_lucas' },
    data: { patientId: 'other_patient' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-09',
    name: 'Medical Record Breach by patient',
    operation: 'get',
    path: '/medicalRecords/rec_lucas_1',
    auth: { uid: 'pat_lucas' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-10',
    name: 'Medical Record Tampering / Forgery',
    operation: 'update',
    path: '/medicalRecords/rec_lucas_1',
    auth: { uid: 'attacker_123' },
    data: { chiefComplaint: 'Forged diagnosis' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-11',
    name: 'Chat Message Sender Forgery',
    operation: 'create',
    path: '/messages/msg_spoofed',
    auth: { uid: 'pat_lucas' },
    data: { id: 'msg_spoofed', appointmentId: 'apt_today_1', senderId: 'psy_clara', text: 'Impersonated message' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-12',
    name: 'Denial of Wallet / 500KB string payload',
    operation: 'create',
    path: '/appointments/apt_huge',
    auth: { uid: 'pat_lucas' },
    data: { id: 'apt_huge', patientId: 'pat_lucas', notesFromPatient: 'A'.repeat(50000) },
    expectedOutcome: 'PERMISSION_DENIED'
  }
];

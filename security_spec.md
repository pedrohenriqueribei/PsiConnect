# Security Specification - Psiconnect

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created or modified by the authenticated user whose `request.auth.uid == userId`. A user cannot alter their account role arbitrarily to escalate privileges.
2. **Psychologist Public Access vs Patient Privacy**: Public psychologist profiles can be read by authenticated users for search and booking, but patient profile data is strictly restricted to the patient themselves (`request.auth.uid == userId`).
3. **Availability Slot Invariant**: A psychologist slot at `/slots/{slotId}` must have `psychologistId == request.auth.uid`. A non-psychologist or unauthorized user cannot create, alter, or delete another psychologist's slots.
4. **Appointment Integrity**: An appointment at `/appointments/{appointmentId}` can only be created by the authenticated patient (`patientId == request.auth.uid`). Once created, `patientId` and `psychologistId` cannot be changed.
5. **Appointment Access Invariant**: Only the participating patient or the assigned psychologist can read or update an appointment.
6. **Medical Record Confidentiality (CFP Res. nº 001/2009)**: Medical records (`/medicalRecords/{recordId}`) contain highly confidential clinical notes (anamnesis, evolution, hypotheses). They can ONLY be created, updated, or read by the licensed psychologist responsible for the session (`psychologistId == request.auth.uid`).
7. **Chat Message Integrity**: Live chat messages (`/messages/{messageId}`) can only be authored with `senderId == request.auth.uid`. Existing messages cannot be tampered with or overwritten.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Scenarios)

1. **Payload 1 (Identity Spoofing - Impersonate Psychologist)**:
   A user `attacker_123` tries to create/overwrite `/users/psy_clara` claiming to be Dra. Clara.
   Expected: `PERMISSION_DENIED`.

2. **Payload 2 (Patient PII Scraping)**:
   User `user_a` tries to read `/users/pat_lucas` (a private patient record with phone and contact info).
   Expected: `PERMISSION_DENIED`.

3. **Payload 3 (Slot Hijacking)**:
   User `attacker_123` tries to create a slot in `/slots/slot_malicious` with `psychologistId: "psy_clara"`.
   Expected: `PERMISSION_DENIED`.

4. **Payload 4 (Ghost Slot Deletion)**:
   User `attacker_123` tries to delete `/slots/slot_1` belonging to `psy_clara`.
   Expected: `PERMISSION_DENIED`.

5. **Payload 5 (Unauthenticated Appointment Creation)**:
   Unauthenticated user attempts to write to `/appointments/apt_fake`.
   Expected: `PERMISSION_DENIED`.

6. **Payload 6 (Appointment Patient Impersonation)**:
   User `attacker_123` tries to create an appointment setting `patientId: "pat_lucas"`.
   Expected: `PERMISSION_DENIED`.

7. **Payload 7 (Appointment Participant Snooping)**:
   User `third_party_456` tries to read an appointment `/appointments/apt_today_1` between `pat_lucas` and `psy_clara`.
   Expected: `PERMISSION_DENIED`.

8. **Payload 8 (State Skipping / Tampering)**:
   User attempts to update an appointment by modifying immutable fields like `psychologistId` or `patientId`.
   Expected: `PERMISSION_DENIED`.

9. **Payload 9 (Medical Record Breach)**:
   A patient (`pat_lucas`) or outsider tries to read `/medicalRecords/rec_lucas_1` directly.
   Expected: `PERMISSION_DENIED`.

10. **Payload 10 (Medical Record Tampering / Forgery)**:
    User `attacker_123` tries to forge or modify a medical record with fake clinical evolutions.
    Expected: `PERMISSION_DENIED`.

11. **Payload 11 (Chat Message Sender Forgery)**:
    User `pat_lucas` posts a message setting `senderId: "psy_clara"` and `senderRole: "psychologist"`.
    Expected: `PERMISSION_DENIED`.

12. **Payload 12 (Denial of Wallet / 1MB String Injection)**:
    Attacker sends a 500KB junk text string into `chiefComplaint` or `notesFromPatient` violating schema limits.
    Expected: `PERMISSION_DENIED`.

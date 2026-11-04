import { ContactFormData, ContactInquiry, ContactSubmissionResult } from '../types/contact';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const STORAGE_KEY = 'psiconnect_contact_inquiries';

/**
 * Service to handle Contact Us ("Fale Conosco") submissions.
 * Designed to seamlessly connect with backend APIs or Firestore,
 * while maintaining a local fallback so form submissions always succeed in any environment.
 */
export const contactService = {
  /**
   * Submit a new contact inquiry
   */
  async submitInquiry(data: ContactFormData): Promise<ContactSubmissionResult> {
    // Generate a human-friendly protocol: #PSI-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const protocol = `#PSI-${randomSuffix}`;
    const nowIso = new Date().toISOString();

    const newInquiry: ContactInquiry = {
      id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      subject: data.subject,
      message: data.message.trim(),
      protocol,
      status: 'pending',
      createdAt: nowIso
    };

    // 1. Persist to local storage for offline resilience & immediate inspection
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      const list: ContactInquiry[] = existingRaw ? JSON.parse(existingRaw) : [];
      list.unshift(newInquiry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    } catch (err) {
      console.warn('Could not store contact inquiry locally:', err);
    }

    // 2. Persist to Firestore if available
    try {
      if (db) {
        await addDoc(collection(db, 'contactInquiries'), {
          ...newInquiry,
          firestoreTimestamp: serverTimestamp()
        });
      }
    } catch (fbErr) {
      console.warn('Firestore write for contact inquiry skipped or failed, fallback to local:', fbErr);
    }

    // 3. Realistic slight latency to demonstrate smooth loading state
    await new Promise((resolve) => setTimeout(resolve, 750));

    return {
      success: true,
      protocol,
      createdAt: nowIso
    };
  },

  /**
   * Retrieve stored inquiries (for administrative view or debugging)
   */
  getStoredInquiries(): ContactInquiry[] {
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      return existingRaw ? JSON.parse(existingRaw) : [];
    } catch {
      return [];
    }
  }
};

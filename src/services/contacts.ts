import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import { isValidPhone, normalizePhone } from '@/lib/phone';

/** contacts/{id}: önemli numara (yönetici, asansör firması, tesisatçı...). */
export interface Contact {
  id: string;
  /** Kişi veya firma adı, örn. "ABC Asansör" */
  name: string;
  /** Görev, örn. "Asansör firması" */
  role: string;
  /** Sadece rakam ve başta "+": "05321234567" */
  phone: string;
}

export interface ContactInput {
  name: string;
  role: string;
  phone: string;
}

const contactsCollection = collection(db, 'contacts');

/** Kullanıcıya gösterilebilecek mesaj içeren hata. */
export class ContactError extends Error {}

function toContact(snapshot: DocumentSnapshot<DocumentData>): Contact | null {
  const data = snapshot.data();
  if (!data) return null;
  return {
    id: snapshot.id,
    name: String(data.name ?? ''),
    role: String(data.role ?? ''),
    phone: String(data.phone ?? ''),
  };
}

export function subscribeToContacts(onChange: (contacts: Contact[]) => void, onError: (error: Error) => void) {
  return onSnapshot(
    contactsCollection,
    (snap) =>
      onChange(
        snap.docs
          .map(toContact)
          .filter((c): c is Contact => c !== null)
          .sort((a, b) => a.role.localeCompare(b.role, 'tr') || a.name.localeCompare(b.name, 'tr')),
      ),
    onError,
  );
}

export async function getContact(id: string): Promise<Contact | null> {
  return toContact(await getDoc(doc(contactsCollection, id)));
}

function validate(input: ContactInput): ContactInput {
  const name = input.name.trim();
  const role = input.role.trim();
  const phone = normalizePhone(input.phone);
  if (!name) throw new ContactError('Kişi veya firma adını yazın.');
  if (!role) throw new ContactError('Görevini yazın (örn. "Tesisatçı").');
  if (name.length > 60 || role.length > 60) throw new ContactError('Ad veya görev çok uzun.');
  if (!isValidPhone(phone)) throw new ContactError('Geçerli bir telefon numarası girin.');
  return { name, role, phone };
}

export async function createContact(input: ContactInput) {
  await addDoc(contactsCollection, { ...validate(input), createdAt: serverTimestamp() });
}

export async function updateContact(id: string, input: ContactInput) {
  await updateDoc(doc(contactsCollection, id), { ...validate(input), updatedAt: serverTimestamp() });
}

export async function deleteContact(id: string) {
  await deleteDoc(doc(contactsCollection, id));
}

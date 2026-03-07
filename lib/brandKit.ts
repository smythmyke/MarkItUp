import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { BrandKit } from '../types';

const MAX_BRANDS = 5;

function brandsCol(uid: string) {
  return collection(db, 'users', uid, 'brands');
}

export async function loadBrandKits(uid: string): Promise<BrandKit[]> {
  const q = query(brandsCol(uid), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BrandKit));
}

export async function saveBrandKit(uid: string, kit: BrandKit): Promise<void> {
  // Enforce max limit on new kits
  if (!kit.createdAt) {
    const existing = await loadBrandKits(uid);
    if (existing.length >= MAX_BRANDS && !existing.find((k) => k.id === kit.id)) {
      throw new Error(`Maximum of ${MAX_BRANDS} brand kits allowed.`);
    }
  }

  const ref = doc(db, 'users', uid, 'brands', kit.id);
  const { id, ...data } = kit;
  await setDoc(ref, { ...data, updatedAt: Date.now() });
}

export async function deleteBrandKit(uid: string, kitId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'brands', kitId));
}

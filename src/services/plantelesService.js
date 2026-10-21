// Catálogo de planteles de la Zona Escolar 072 (colección "planteles").
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export const obtenerPlanteles = async () => {
  const snap = await getDocs(collection(db, 'planteles'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es'));
};

export const obtenerPlantel = async (plantelId) => {
  if (!plantelId) return null;
  const snap = await getDoc(doc(db, 'planteles', plantelId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Read firebase-applet-config.json
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('Firebase Config loaded for project:', firebaseConfig.projectId);
console.log('Target Database ID:', firebaseConfig.firestoreDatabaseId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkAndSeed() {
  console.log('--- Checking current database state ---');
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`Current users in Firestore (${firebaseConfig.firestoreDatabaseId}):`, usersSnap.size);

  const recordsSnap = await getDocs(collection(db, 'psychologicalRecords'));
  console.log(`Current psychologicalRecords in Firestore:`, recordsSnap.size);

  const slotsSnap = await getDocs(collection(db, 'slots'));
  console.log(`Current slots in Firestore:`, slotsSnap.size);

  const aptSnap = await getDocs(collection(db, 'appointments'));
  console.log(`Current appointments in Firestore:`, aptSnap.size);
}

checkAndSeed()
  .then(() => {
    console.log('Check finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Check failed with error:', err);
    process.exit(1);
  });

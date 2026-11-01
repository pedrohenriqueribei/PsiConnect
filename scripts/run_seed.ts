import { seedFirestoreDatabase } from '../src/services/firestoreSeeder';
import { db } from '../src/services/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
  console.log('Seeding Firestore Database...');
  const res = await seedFirestoreDatabase(true);
  console.log('Seed result:', res);

  console.log('\n--- Verifying Firestore Collections ---');
  const users = await getDocs(collection(db, 'users'));
  console.log(`✓ Users in Firestore: ${users.size}`);

  const slots = await getDocs(collection(db, 'slots'));
  console.log(`✓ Slots in Firestore: ${slots.size}`);

  const apts = await getDocs(collection(db, 'appointments'));
  console.log(`✓ Appointments in Firestore: ${apts.size}`);

  const medRecs = await getDocs(collection(db, 'medicalRecords'));
  console.log(`✓ Medical Records in Firestore: ${medRecs.size}`);

  const psychRecs = await getDocs(collection(db, 'psychologicalRecords'));
  console.log(`✓ Psychological Records (Prontuários) in Firestore: ${psychRecs.size}`);

  const msgs = await getDocs(collection(db, 'messages'));
  console.log(`✓ Chat Messages in Firestore: ${msgs.size}`);
}

main()
  .then(() => {
    console.log('\nFirestore Database is verified populated!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });

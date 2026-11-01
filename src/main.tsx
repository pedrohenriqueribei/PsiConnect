import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { seedFirestoreDatabase } from './services/firestoreSeeder';

// Trigger initial Firestore database verification/seeding if needed
seedFirestoreDatabase(false).catch((err) => {
  console.warn('Firestore seeding check:', err);
});

createRoot(document.getElementById('root')!).render(<App />);


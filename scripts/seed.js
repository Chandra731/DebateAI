import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const topics = [
  {
    title: 'Artificial Intelligence in the Classroom',
    description: 'Should AI be used to personalize learning and assist teachers?',
    category: 'Education',
    difficulty_level: 1,
    is_active: true,
  },
  {
    title: 'Social Media and Mental Health',
    description: 'Does social media have a net negative impact on the mental well-being of teenagers?',
    category: 'Health',
    difficulty_level: 2,
    is_active: true,
  },
  {
    title: 'The Future of Work: Remote vs. Office',
    description: 'Is a fully remote work model sustainable and beneficial for both employees and companies?',
    category: 'Business',
    difficulty_level: 2,
    is_active: true,
  },
  {
    title: 'Climate Change: Individual vs. Corporate Responsibility',
    description: 'Who bears the primary responsibility for addressing climate change: individuals or corporations?',
    category: 'Environment',
    difficulty_level: 3,
    is_active: true,
  },
];

const features = [
    {
        title: 'AI-Powered Sparring Partner',
        description: 'Hone your arguments against a sophisticated AI opponent that adapts to your skill level.',
        icon: 'cpu',
        display_order: 1,
    },
    {
        title: 'Guided Skill Trees',
        description: 'Master the art of debate through structured lessons and exercises, from basic fallacies to advanced rhetoric.',
        icon: 'git-merge',
        display_order: 2,
    },
    {
        title: 'Real-Time Feedback',
        description: 'Receive instant analysis of your performance, highlighting logical strengths and weaknesses.',
        icon: 'bar-chart-2',
        display_order: 3,
    },
];

async function seedDatabase() {
  console.log('Starting to seed the database...');

  const batch = writeBatch(db);

  // Seed topics
  const topicsCollection = collection(db, 'topics');
  topics.forEach((topic) => {
    const docRef = doc(topicsCollection);
    batch.set(docRef, { ...topic, created_at: new Date() });
  });
  console.log(`${topics.length} topics prepared for seeding.`);

  // Seed features
  const featuresCollection = collection(db, 'features');
  features.forEach((feature) => {
    const docRef = doc(featuresCollection);
    batch.set(docRef, feature);
  });
  console.log(`${features.length} features prepared for seeding.`);

  try {
    await batch.commit();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();

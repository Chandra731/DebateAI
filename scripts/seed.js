import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import { skillCategories, skills, lessons, exercises, skillDependencies } from './seedData.js';

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


async function seedDatabase() {
  console.log('Starting to seed the database...');

  const batch = writeBatch(db);

  // Seed skill categories
  const skillCategoriesCollection = collection(db, 'skill_categories');
  skillCategories.forEach((category) => {
    const docRef = doc(skillCategoriesCollection, category.id);
    batch.set(docRef, { ...category, created_at: new Date() });
  });
  console.log(`${skillCategories.length} skill categories prepared for seeding.`);

  // Seed skills as subcollections of skill categories
  skills.forEach((skill) => {
    const skillDocRef = doc(db, 'skill_categories', skill.category_id, 'skills', skill.id);
    batch.set(skillDocRef, { ...skill, created_at: new Date() });
  });
  console.log(`${skills.length} skills prepared for seeding.`);

  // Create a map for skillId to categoryId for easier lookup
  const skillToCategoryMap = new Map();
  skills.forEach(skill => {
    skillToCategoryMap.set(skill.id, skill.category_id);
  });

  // Create a map for lessonId to skillId and categoryId for easier lookup
  const lessonToSkillCategoryMap = new Map();
  lessons.forEach(lesson => {
    const categoryId = skillToCategoryMap.get(lesson.skill_id);
    if (categoryId) {
      lessonToSkillCategoryMap.set(lesson.id, { skillId: lesson.skill_id, categoryId: categoryId });
    }
  });

  // Seed lessons as subcollections of skills within categories
  lessons.forEach((lesson) => {
    const categoryId = skillToCategoryMap.get(lesson.skill_id);
    if (categoryId) {
      const lessonDocRef = doc(db, 'skill_categories', categoryId, 'skills', lesson.skill_id, 'lessons', lesson.id);
      batch.set(lessonDocRef, { ...lesson, created_at: new Date() });
    } else {
      console.warn(`Skipping lesson ${lesson.id} as skill ${lesson.skill_id} not found or has no category.`);
    }
  });
  console.log(`${lessons.length} lessons prepared for seeding.`);

  // Seed exercises as subcollections of lessons within skills within categories
  exercises.forEach((exercise) => {
    const lessonInfo = lessonToSkillCategoryMap.get(exercise.lesson_id);
    if (lessonInfo) {
      const exerciseDocRef = doc(db, 'skill_categories', lessonInfo.categoryId, 'skills', lessonInfo.skillId, 'lessons', exercise.lesson_id, 'exercises', exercise.id);
      batch.set(exerciseDocRef, { ...exercise, created_at: new Date() });
    } else {
      console.warn(`Skipping exercise ${exercise.id} as lesson ${exercise.lesson_id} not found or has no skill/category info.`);
    }
  });
  console.log(`${exercises.length} exercises prepared for seeding.`);

  // Seed skill dependencies
  const skillDependenciesCollection = collection(db, 'skill_dependencies');
  skillDependencies.forEach((dependency) => {
    const docRef = doc(skillDependenciesCollection);
    batch.set(docRef, { from_skill_id: dependency.from, to_skill_id: dependency.to });
  });
  console.log(`${skillDependencies.length} skill dependencies prepared for seeding.`);

  try {
    await batch.commit();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
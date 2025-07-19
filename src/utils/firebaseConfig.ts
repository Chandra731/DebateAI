export const isFirebaseConfigured = () => {
  const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const firebaseAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const firebaseStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const firebaseMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const firebaseAppId = import.meta.env.VITE_FIREBASE_APP_ID;

  return (
    firebaseApiKey &&
    firebaseAuthDomain &&
    firebaseProjectId &&
    firebaseStorageBucket &&
    firebaseMessagingSenderId &&
    firebaseAppId &&
    firebaseApiKey !== 'your_firebase_api_key'
  );
};
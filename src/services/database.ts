import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, limit, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { Profile, Topic, Case, Debate, Achievement, UserAchievement, Feature, Testimonial, Statistics } from '../types';

export class DatabaseService {
  static async createProfile(profile: Profile): Promise<Profile> {
    await setDoc(doc(db, 'profiles', profile.id), profile);
    return profile;
  }

  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Profile : null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const profileRef = doc(db, 'profiles', userId);
      await updateDoc(profileRef, updates);
      const updatedDoc = await getDoc(profileRef);
      return updatedDoc.exists() ? { id: updatedDoc.id, ...updatedDoc.data() } as Profile : null;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  static async getTopics(activeOnly = true): Promise<Topic[]> {
    try {
      let q = query(collection(db, 'topics'));
      if (activeOnly) {
        q = query(q, where('is_active', '==', true));
      }
      q = query(q, orderBy('difficulty_level'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));
    } catch (error) {
      console.error('Error getting topics:', error);
      return [];
    }
  }

  static async getTopic(id: string): Promise<Topic | null> {
    try {
      const docRef = doc(db, 'topics', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Topic : null;
    } catch (error) {
      console.error('Error getting topic:', error);
      return null;
    }
  }

  static async addTopic(topicData: Omit<Topic, 'id' | 'created_at'>): Promise<Topic | null> {
    try {
      const docRef = await addDoc(collection(db, 'topics'), { ...topicData, created_at: new Date() });
      const newTopic = await getDoc(docRef);
      return newTopic.exists() ? { id: newTopic.id, ...newTopic.data() } as Topic : null;
    } catch (error) {
      console.error('Error adding topic:', error);
      return null;
    }
  }

  static async updateTopic(topicId: string, updates: Partial<Topic>): Promise<Topic | null> {
    try {
      const topicRef = doc(db, 'topics', topicId);
      await updateDoc(topicRef, updates);
      const updatedDoc = await getDoc(topicRef);
      return updatedDoc.exists() ? { id: updatedDoc.id, ...updatedDoc.data() } as Topic : null;
    } catch (error) {
      console.error('Error updating topic:', error);
      return null;
    }
  }

  static async deleteTopic(topicId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'topics', topicId));
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  }

  static async saveCase(caseData: Omit<Case, 'id' | 'created_at'>): Promise<Case | null> {
    try {
      const docRef = await addDoc(collection(db, 'cases'), { ...caseData, created_at: new Date() });
      const newCase = await getDoc(docRef);
      return newCase.exists() ? { id: newCase.id, ...newCase.data() } as Case : null;
    } catch (error) {
      console.error('Error saving case:', error);
      return null;
    }
  }

  static async getUserCases(userId: string): Promise<Case[]> {
    try {
      const q = query(collection(db, 'cases'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
    } catch (error) {
      console.error('Error getting user cases:', error);
      return [];
    }
  }

  static async createDebate(debateData: Omit<Debate, 'id' | 'created_at'>): Promise<Debate | null> {
    try {
      const docRef = await addDoc(collection(db, 'debates'), { ...debateData, created_at: new Date() });
      const newDebate = await getDoc(docRef);
      return newDebate.exists() ? { id: newDebate.id, ...newDebate.data() } as Debate : null;
    } catch (error) {
      console.error('Error creating debate:', error);
      return null;
    }
  }

  static async getDebate(debateId: string): Promise<Debate | null> {
    try {
      const docRef = doc(db, 'debates', debateId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Debate : null;
    } catch (error) {
      console.error('Error getting debate:', error);
      return null;
    }
  }

  static async saveDebate(debateId: string, debateData: Partial<Debate>): Promise<void> {
    try {
      const debateRef = doc(db, 'debates', debateId);
      await updateDoc(debateRef, debateData);
    } catch (error) {
      console.error('Error saving debate:', error);
    }
  }

  static async getUserDebates(userId: string): Promise<Debate[]> {
    try {
      const q = query(collection(db, 'debates'), where('participants', 'array-contains', userId), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debate));
    } catch (error) {
      console.error('Error getting user debates:', error);
      return [];
    }
  }

  static async addXP(
    userId: string,
    amount: number,
    reason: string,
    sourceType?: string,
    sourceId?: string
  ): Promise<{ newXP: number; newLevel: number } | null> {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        throw new Error('Profile not found');
      }

      const profile = profileSnap.data() as Profile;
      const currentXP = profile.xp || 0;
      const currentLevel = profile.level || 1;

      const newXP = currentXP + amount;
      const newLevel = Math.floor(newXP / 500) + 1; // 500 XP per level

      await updateDoc(profileRef, {
        xp: newXP,
        level: newLevel,
        updated_at: new Date()
      });

      await addDoc(collection(db, 'xp_logs'), {
        user_id: userId,
        amount,
        reason,
        source_type: sourceType,
        source_id: sourceId,
        created_at: new Date()
      });

      return { newXP, newLevel };
    } catch (error) {
      console.error('Error adding XP:', error);
      return null;
    }
  }

  static async getLeaderboard(user: Profile | null, type = 'global', timeFilter = 'allTime', limitCount = 50): Promise<Profile[]> {
    try {
      let q = query(collection(db, 'profiles'), orderBy('xp', 'desc'), limit(limitCount));

      if (type === 'school' && user?.school) {
        q = query(q, where('school', '==', user.school));
      } else if (type === 'friends' && user?.friends?.length) {
        q = query(q, where('id', 'in', user.friends));
      }

      if (timeFilter !== 'allTime') {
        const now = new Date();
        let startDate;

        if (timeFilter === 'weekly') {
          startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (timeFilter === 'monthly') {
          startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        if (startDate) {
          q = query(q, where('last_practiced_at', '>=', startDate));
        }
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  static async getAchievements(): Promise<Achievement[]> {
    try {
      const q = query(collection(db, 'achievements'), where('is_active', '==', true), orderBy('category'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const q = query(collection(db, 'user_achievements'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const userAchievements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserAchievement));

      const detailedAchievements = await Promise.all(userAchievements.map(async (ua) => {
        const achievementDoc = await getDoc(doc(db, 'achievements', ua.achievement_id));
        return achievementDoc.exists() ? { ...ua, achievements: { id: achievementDoc.id, ...achievementDoc.data() } as Achievement } : ua;
      }));
      return detailedAchievements;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  static async updateStreak(userId: string): Promise<number | null> {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        throw new Error('Profile not found');
      }

      const profile = profileSnap.data() as Profile;
      const today = new Date().toISOString().slice(0, 10);
      const lastPracticeDate = profile.last_practiced_at?.slice(0, 10);

      if (lastPracticeDate === today) {
        return profile.streak || 0;
      }

      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = lastPracticeDate === yesterday ? (profile.streak || 0) + 1 : 1;

      await updateDoc(profileRef, {
        streak: newStreak,
        last_practiced_at: new Date().toISOString(),
      });

      return newStreak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return null;
    }
  }

  // Admin Dashboard Methods
  static async getAdminDashboardStats(): Promise<any> {
    try {
      const [usersSnapshot, debatesSnapshot] = await Promise.all([
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'debates')),
      ]);

      const usersData = usersSnapshot.docs.map(doc => doc.data());
      const debatesData = debatesSnapshot.docs.map(doc => doc.data());

      return {
        totalUsers: usersData.length,
        activeDebates: debatesData.filter(d => d.status === 'active').length,
        totalSessions: debatesData.length,
        avgSessionTime: '12.5 min' // This would be calculated from actual data
      };
    } catch (error) {
      console.error('Error getting admin dashboard stats:', error);
      return null;
    }
  }

  static async getAdminRecentUsers(limitCount = 10): Promise<Profile[]> {
    try {
      const q = query(collection(db, 'profiles'), orderBy('created_at', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
    } catch (error) {
      console.error('Error getting admin recent users:', error);
      return [];
    }
  }

  static async getAdminRecentDebates(limitCount = 10): Promise<Debate[]> {
    try {
      const q = query(collection(db, 'debates'), orderBy('created_at', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      const recentDebatesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debate));

      const debatesWithTopics = await Promise.all(recentDebatesData.map(async (debate) => {
        if (debate.topic_id) {
          const topicDoc = await getDoc(doc(db, 'topics', debate.topic_id));
          return { ...debate, topic: topicDoc.exists() ? topicDoc.data() as Topic : null };
        }
        return debate;
      }));

      return debatesWithTopics;
    } catch (error) {
      console.error('Error getting admin recent debates:', error);
      return [];
    }
  }

  static async getAdminTopics(): Promise<Topic[]> {
    try {
      const q = query(collection(db, 'topics'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));
    } catch (error) {
      console.error('Error getting admin topics:', error);
      return [];
    }
  }

  // HomePage Methods
  static async getFeatures(): Promise<Feature[]> {
    try {
      const q = query(collection(db, 'features'), orderBy('display_order'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feature));
    } catch (error) {
      console.error('Error getting features:', error);
      return [];
    }
  }

  static async getTestimonials(): Promise<Testimonial[]> {
    try {
      const q = query(collection(db, 'testimonials'), orderBy('display_order'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
    } catch (error) {
      console.error('Error getting testimonials:', error);
      return [];
    }
  }

  static async getStatistics(): Promise<Statistics | null> {
    try {
      const docRef = doc(db, 'statistics', 'homepage');
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as Statistics : null;
    } catch (error) {
      console.error('Error getting statistics:', error);
      return null;
    }
  }


  static clearCache(): void {
    // Not applicable for Firestore direct calls, caching is handled by Firestore SDK or component state
  }

  static async healthCheck(): Promise<boolean> {
    try {
      // Attempt to read a small document to check connectivity
      const testDocRef = doc(db, 'profiles', 'test_id'); // Use a known, small document or create a dummy one
      await getDoc(testDocRef);
      return true;
    } catch (error) {
      console.error('Firestore health check failed:', error);
      return false;
    }
  }
}

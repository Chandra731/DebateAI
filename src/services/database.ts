/**
 * @file database.ts
 * @description This file provides a DatabaseService class that abstracts all interactions with the Firestore database.
 * It includes methods for creating, reading, updating, and deleting data for all collections in the database.
 * All methods are static and can be called directly on the class.
 */
import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, limit, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { Profile, Topic, Case, Debate, Achievement, UserAchievement, Feature, Testimonial, Statistics } from '../types';

export class DatabaseService {
  // --- PROFILE MANAGEMENT ---
  /**
   * Creates a new user profile document in Firestore.
   * @param profile - The profile object to create.
   * @returns The created profile object.
   */
  static async createProfile(profile: Profile): Promise<Profile> {
    await setDoc(doc(db, 'profiles', profile.id), profile);
    return profile;
  }

  /**
   * Fetches a user profile from Firestore by user ID.
   * @param userId - The ID of the user to fetch.
   * @returns The user's profile object or null if not found.
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Profile : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Updates a user profile in Firestore.
   * @param userId - The ID of the user to update.
   * @param updates - An object containing the fields to update.
   * @returns The updated profile object or null on error.
   */
  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const profileRef = doc(db, 'profiles', userId);
      await updateDoc(profileRef, updates);
      const updatedDoc = await getDoc(profileRef);
      return updatedDoc.exists() ? { id: updatedDoc.id, ...updatedDoc.data() } as Profile : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Deletes a user profile from Firestore. Note: This does not delete the user from Firebase Auth.
   * @param userId - The ID of the user to delete.
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'profiles', userId));
    } catch (error) {
      throw error; 
    }
  }

  /**
   * Fetches all user profiles from Firestore.
   * @returns An array of all user profile objects.
   */
  static async getAllUsers(): Promise<Profile[]> {
    try {
      const q = query(collection(db, 'profiles'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
    } catch (error) {
      return [];
    }
  }

  // --- TOPIC MANAGEMENT ---
  /**
   * Fetches all debate topics from Firestore.
   * @param activeOnly - If true, only returns active topics.
   * @returns An array of topic objects.
   */
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
      return [];
    }
  }

  /**
   * Fetches a single debate topic from Firestore by ID.
   * @param id - The ID of the topic to fetch.
   * @returns The topic object or null if not found.
   */
  static async getTopic(id: string): Promise<Topic | null> {
    try {
      const docRef = doc(db, 'topics', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Topic : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Adds a new debate topic to Firestore.
   * @param topicData - The data for the new topic.
   * @returns The newly created topic object or null on error.
   */
  static async addTopic(topicData: Omit<Topic, 'id' | 'created_at'>): Promise<Topic | null> {
    try {
      const docRef = await addDoc(collection(db, 'topics'), { ...topicData, created_at: new Date() });
      const newTopic = await getDoc(docRef);
      return newTopic.exists() ? { id: newTopic.id, ...newTopic.data() } as Topic : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Updates a debate topic in Firestore.
   * @param topicId - The ID of the topic to update.
   * @param updates - An object containing the fields to update.
   * @returns The updated topic object or null on error.
   */
  static async updateTopic(topicId: string, updates: Partial<Topic>): Promise<Topic | null> {
    try {
      const topicRef = doc(db, 'topics', topicId);
      await updateDoc(topicRef, updates);
      const updatedDoc = await getDoc(topicRef);
      return updatedDoc.exists() ? { id: updatedDoc.id, ...updatedDoc.data() } as Topic : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Deletes a debate topic from Firestore.
   * @param topicId - The ID of the topic to delete.
   */
  static async deleteTopic(topicId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'topics', topicId));
    } catch (error) {
    }
  }

  // --- CASE MANAGEMENT ---
  /**
   * Saves a user's case preparation data to Firestore.
   * @param caseData - The case data to save.
   * @returns The newly created case object or null on error.
   */
  static async saveCase(caseData: Omit<Case, 'id' | 'created_at'>): Promise<Case | null> {
    try {
      const docRef = await addDoc(collection(db, 'cases'), { ...caseData, created_at: new Date() });
      const newCase = await getDoc(docRef);
      return newCase.exists() ? { id: newCase.id, ...newCase.data() } as Case : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetches all cases for a specific user from Firestore.
   * @param userId - The ID of the user whose cases to fetch.
   * @returns An array of the user's case objects.
   */
  static async getUserCases(userId: string): Promise<Case[]> {
    try {
      const q = query(collection(db, 'cases'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
    } catch (error) {
      return [];
    }
  }

  // --- DEBATE MANAGEMENT ---
  /**
   * Creates a new debate session in Firestore.
   * @param debateData - The data for the new debate.
   * @returns The newly created debate object or null on error.
   */
  static async createDebate(debateData: Omit<Debate, 'id' | 'created_at'>): Promise<Debate | null> {
    try {
      const docRef = await addDoc(collection(db, 'debates'), { ...debateData, created_at: new Date() });
      const newDebate = await getDoc(docRef);
      return newDebate.exists() ? { id: newDebate.id, ...newDebate.data() } as Debate : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetches a single debate session from Firestore by ID.
   * @param debateId - The ID of the debate to fetch.
   * @returns The debate object or null if not found.
   */
  static async getDebate(debateId: string): Promise<Debate | null> {
    try {
      const docRef = doc(db, 'debates', debateId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Debate : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Updates a debate session in Firestore.
   * @param debateId - The ID of the debate to update.
   * @param debateData - An object containing the fields to update.
   */
  static async saveDebate(debateId: string, debateData: Partial<Debate>): Promise<void> {
    try {
      const debateRef = doc(db, 'debates', debateId);
      await updateDoc(debateRef, debateData);
    } catch (error) {
    }
  }

  /**
   * Fetches all debates for a specific user from Firestore.
   * @param userId - The ID of the user whose debates to fetch.
   * @returns An array of the user's debate objects.
   */
  static async getUserDebates(userId: string): Promise<Debate[]> {
    try {
      const q = query(collection(db, 'debates'), where('participants', 'array-contains', userId), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debate));
    } catch (error) {
      return [];
    }
  }

  // --- XP & LEADERBOARD ---
  /**
   * Adds experience points (XP) to a user's profile and logs the transaction.
   * @param userId - The ID of the user to grant XP to.
   * @param amount - The amount of XP to add.
   * @param reason - The reason for granting XP.
   * @param sourceType - The type of the source of the XP (e.g., 'debate', 'exercise').
   * @param sourceId - The ID of the source of the XP.
   * @returns An object containing the user's new XP and level, or null on error.
   */
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
      return null;
    }
  }

  /**
   * Fetches the leaderboard from Firestore, sorted by XP.
   * @param user - The current user, used for filtering by school or friends.
   * @param type - The type of leaderboard to fetch ('global', 'school', or 'friends').
   * @param timeFilter - The time filter for the leaderboard ('allTime', 'weekly', or 'monthly').
   * @param limitCount - The number of users to fetch.
   * @returns An array of profile objects for the leaderboard.
   */
  static async getLeaderboard(user: Profile | null, type = 'global', timeFilter = 'allTime', leaderboardType: 'debate' | 'skill' = 'debate', limitCount = 50): Promise<Profile[]> {
    try {
      let q = query(collection(db, 'profiles'));

      if (leaderboardType === 'debate') {
        q = query(q, orderBy('xp', 'desc'));
      } else if (leaderboardType === 'skill') {
        q = query(q, orderBy('level', 'desc'), orderBy('xp', 'desc'));
      }

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
      
      q = query(q, limit(limitCount));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        xp: doc.data().xp || 0, // Ensure XP defaults to 0
        level: doc.data().level || 1, // Ensure level defaults to 1
        total_debates: doc.data().total_debates || 0, // Ensure total_debates defaults to 0
        wins: doc.data().wins || 0, // Ensure wins defaults to 0
        streak: doc.data().streak || 0, // Ensure streak defaults to 0
      }) as Profile);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }

  // --- ACHIEVEMENTS ---
  /**
   * Fetches all active achievements from Firestore.
   * @returns An array of achievement objects.
   */
  static async getAchievements(): Promise<Achievement[]> {
    try {
      const q = query(collection(db, 'achievements'), where('is_active', '==', true), orderBy('category'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetches all achievements for a specific user from Firestore.
   * @param userId - The ID of the user whose achievements to fetch.
   * @returns An array of the user's achievement objects.
   */
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
      return [];
    }
  }

  /**
   * Updates a user's practice streak in Firestore.
   * @param userId - The ID of the user whose streak to update.
   * @returns The user's new streak or null on error.
   */
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
      return null;
    }
  }

  // --- ADMIN DASHBOARD METHODS ---
  /**
   * Fetches statistics for the admin dashboard.
   * @returns An object containing various statistics.
   */
  static async getAdminDashboardStats(): Promise<{
    totalUsers: number;
    activeDebates: number;
    totalSessions: number;
    avgSessionTime: string;
  }> {
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
      return null;
    }
  }

  /**
   * Fetches the most recent users for the admin dashboard.
   * @param limitCount - The number of recent users to fetch.
   * @returns An array of the most recent user profile objects.
   */
  static async getAdminRecentUsers(limitCount = 10): Promise<Profile[]> {
    try {
      const q = query(collection(db, 'profiles'), orderBy('created_at', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetches the most recent debates for the admin dashboard.
   * @param limitCount - The number of recent debates to fetch.
   * @returns An array of the most recent debate objects.
   */
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
      return [];
    }
  }

  /**
   * Fetches all debate topics for the admin dashboard.
   * @returns An array of all topic objects.
   */
  static async getAdminTopics(): Promise<Topic[]> {
    try {
      const q = query(collection(db, 'topics'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));
    } catch (error) {
      return [];
    }
  }

  // --- HOMEPAGE METHODS ---
  /**
   * Fetches the features to display on the homepage.
   * @returns An array of feature objects.
   */
  static async getFeatures(): Promise<Feature[]> {
    try {
      const q = query(collection(db, 'features'), orderBy('display_order'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feature));
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetches the testimonials to display on the homepage.
   * @returns An array of testimonial objects.
   */
  static async getTestimonials(): Promise<Testimonial[]> {
    try {
      const q = query(collection(db, 'testimonials'), orderBy('display_order'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetches the statistics to display on the homepage.
   * @returns The statistics object or null if not found.
   */
  static async getStatistics(): Promise<Statistics | null> {
    try {
      const docRef = doc(db, 'statistics', 'homepage');
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as Statistics : null;
    } catch (error) {
      return null;
    }
  }

  // --- UTILITY METHODS ---
  /**
   * Clears the cache. Not applicable for Firestore direct calls.
   */
  static clearCache(): void {
    // Not applicable for Firestore direct calls, caching is handled by Firestore SDK or component state
  }

  /**
   * Checks the health of the Firestore connection.
   * @returns True if the connection is healthy, false otherwise.
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // Attempt to read a small document to check connectivity
      const testDocRef = doc(db, 'profiles', 'test_id'); // Use a known, small document or create a dummy one
      await getDoc(testDocRef);
      return true;
    } catch (error) {
      return false;
    }
  }
}

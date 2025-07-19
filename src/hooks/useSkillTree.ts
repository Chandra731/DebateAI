import { useState, useEffect, useCallback } from 'react';
import { SkillTreeService, SkillCategory, UserSkillProgress, Lesson, Exercise, UserLearningGoals, LearningAnalytics } from '../services/skillTreeService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/monitoring';

export const useSkillTree = () => {
  const { user } = useAuth();
  const [state, setState] = useState<{ 
    skillTree: SkillCategory[];
    userProgress: UserSkillProgress[];
    userGoals: UserLearningGoals | null;
    loading: boolean;
    error: string | null;
    unlockedSkillIds: Set<string>;
  }>({ 
    skillTree: [], 
    userProgress: [], 
    userGoals: null, 
    loading: true, 
    error: null, 
    unlockedSkillIds: new Set()
  });

  const loadSkillTreeData = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));

      const [treeData, progressData, goalsData] = await Promise.all([
        SkillTreeService.getSkillTree(),
        user?.uid ? SkillTreeService.getUserSkillProgress(user.uid) : Promise.resolve([]),
        user?.uid ? SkillTreeService.getUserLearningGoals(user.uid) : Promise.resolve(null)
      ]);

      const unlocked = new Set<string>();
      if (user?.uid) {
        const allSkills = treeData.flatMap(cat => cat.skills || []);
        for (const skill of allSkills) {
          const canUnlock = await SkillTreeService.checkSkillPrerequisites(user.uid, skill.id);
          if (canUnlock) {
            unlocked.add(skill.id);
          } else {
            const isFirstSkill = !skill.prerequisites || skill.prerequisites.length === 0;
            if (isFirstSkill) {
              unlocked.add(skill.id);
            }
          }
        }
      }

      setState(s => ({ ...s, skillTree: treeData, userProgress: progressData, userGoals: goalsData, unlockedSkillIds: unlocked, loading: false }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load skill tree data';
      setState(s => ({ ...s, error: errorMessage, loading: false }));
      logger.error(err as Error, { component: 'useSkillTree', action: 'loadSkillTreeData' });
    } 
  }, [user?.uid]);

  useEffect(() => {
    loadSkillTreeData();
  }, [loadSkillTreeData]);

  const getRecommendedLesson = useCallback((): Lesson | null => {
    if (!state.skillTree.length || !state.userProgress.length || !state.userGoals?.goals.length) return null;

    for (const goal of state.userGoals.goals) {
      for (const category of state.skillTree) {
        const skill = category.skills?.find(s => s.name.toLowerCase().includes(goal.toLowerCase()));
        if (skill && !isSkillMastered(skill.id)) {
          // Further logic needed here to get lessons for the skill
        }
      }
    }
    return null;
  }, [state.skillTree, state.userProgress, state.userGoals]);

  const unlockSkill = useCallback(async (skillId: string) => {
    if (!user?.uid) return;

    try {
      const newProgress = await SkillTreeService.unlockSkill(user.uid, skillId);
      if (newProgress) {
        setState(s => ({ ...s, userProgress: [...s.userProgress.filter(p => p.skill_id !== skillId), newProgress]}));
        loadSkillTreeData();
      }
    } catch (err) {
      logger.error(err as Error, { component: 'useSkillTree', action: 'unlockSkill' });
      throw err;
    }
  }, [user?.uid, loadSkillTreeData]);

  const getSkillProgress = useCallback((skillId: string): UserSkillProgress | null => {
    return state.userProgress.find(p => p.skill_id === skillId) || null;
  }, [state.userProgress]);

  const isSkillUnlocked = useCallback((skillId: string): boolean => {
    return state.unlockedSkillIds.has(skillId);
  }, [state.unlockedSkillIds]);

  const isSkillMastered = useCallback((skillId: string): boolean => {
    const progress = getSkillProgress(skillId);
    return progress?.is_mastered || false;
  }, [getSkillProgress]);

  const getSkillMasteryLevel = useCallback((skillId: string): number => {
    const progress = getSkillProgress(skillId);
    return progress?.mastery_level || 0;
  }, [getSkillProgress]);

  return {
    ...state,
    unlockSkill,
    getSkillProgress,
    isSkillUnlocked,
    isSkillMastered,
    getSkillMasteryLevel,
    getRecommendedLesson,
    refetch: loadSkillTreeData
  };
};

export const useSkillLessons = (skillId: string, isUnlocked: boolean) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLessons = async () => {
      if (!skillId || !isUnlocked) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedLessons = await SkillTreeService.getSkillLessons(skillId);

        const lessonsWithStructuredContent = await Promise.all(fetchedLessons.map(async (lesson) => {
          if (!lesson.content || lesson.content.length === 0 || typeof lesson.content[0] === 'string') {
            const structuredContent = await SkillTreeService.generateStructuredLessonContent(
              lesson.id,
              lesson.title,
              lesson.learning_objectives
            );
            return { ...lesson, content: structuredContent };
          } else {
            return lesson;
          }
        }));
        setLessons(lessonsWithStructuredContent);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load lessons';
        setError(errorMessage);
        logger.error(err as Error, { component: 'useSkillLessons', action: 'loadLessons' });
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, [skillId]);

  return { lessons, loading, error };
};

export const useLesson = (lessonId: string) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLesson = async () => {
      if (!lessonId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedLesson = await SkillTreeService.getLesson(lessonId);

        if (fetchedLesson && (!fetchedLesson.content || fetchedLesson.content.length === 0)) {
          const structuredContent = await SkillTreeService.generateStructuredLessonContent(
            fetchedLesson.id,
            fetchedLesson.title,
            fetchedLesson.learning_objectives
          );
          setLesson({ ...fetchedLesson, content: structuredContent });
        } else {
          setLesson(fetchedLesson);
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load lesson';
        setError(errorMessage);
        logger.error(err as Error, { component: 'useLesson', action: 'loadLesson' });
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId]);

  return { lesson, loading, error };
};

export const useLessonExercises = (lessonId: string, exerciseId?: string) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExercises = async () => {
      if (!lessonId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await SkillTreeService.getLessonExercises(lessonId);
        setExercises(data);
        if (exerciseId) {
          const currentExercise = data.find(ex => ex.id === exerciseId);
          setExercise(currentExercise || null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load exercises';
        setError(errorMessage);
        logger.error(err as Error, { component: 'useLessonExercises', action: 'loadExercises' });
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, [lessonId, exerciseId]);

  return { exercises, exercise, loading, error };
};

export const useLearningAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        setError(null);
        const data = await SkillTreeService.getUserLearningAnalytics(user.uid);
        setAnalytics(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
        setError(errorMessage);
        logger.error(err as Error, { component: 'useLearningAnalytics', action: 'loadAnalytics' });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user?.uid]);

  return { analytics, loading, error };
};
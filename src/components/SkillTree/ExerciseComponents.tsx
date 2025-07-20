import { useState, useEffect, useCallback } from 'react';
import { SkillTreeService } from '../../services/skillTreeService';
import type { SkillCategory, UserSkillProgress, Lesson, Exercise, UserLearningGoals, LearningAnalytics } from '../services/skillTreeService';
import { useAuth } from "../../contexts/AuthContext";
import { logger } from "../../utils/monitoring";

const cleanMarkdown = (text: string): string => {
  let cleanedText = text;

  // 1. Ensure newlines before headings
  cleanedText = cleanedText.replace(/([^\n])(#+)/g, '$1\n$2');

  // 2. Normalize multiple newlines to single newlines
  cleanedText = cleanedText.replace(/\n{2,}/g, '\n');

  return cleanedText.trim();
};

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

  const findFirstUncompletedLesson = useCallback(async (userId: string, lessons: Lesson[]): Promise<Lesson | null> => {
    const completedLessons = await SkillTreeService.getUserLessonCompletions(userId);
    const completedLessonIds = new Set(completedLessons.map(c => c.lesson_id));
    return lessons.find(lesson => !completedLessonIds.has(lesson.id)) || null;
  }, []);

  const getRecommendedLesson = useCallback(async (): Promise<Lesson | null> => {
    if (!user?.uid || !state.skillTree.length || !state.userGoals?.goals.length) return null;

    const allSkills = state.skillTree.flatMap(cat => cat.skills || []);
    const unlockedSkills = allSkills.filter(skill => isSkillUnlocked(skill.id) && !isSkillMastered(skill.id));

    // 1. Prioritize skills matching user goals
    for (const goal of state.userGoals.goals) {
      const goalRegex = new RegExp(goal.replace(/[^a-zA-Z0-9 ]/g, ''), 'i'); // Sanitize goal for regex
      for (const skill of unlockedSkills) {
        if (goalRegex.test(skill.name) || goalRegex.test(skill.description)) {
          const lessons = await SkillTreeService.getSkillLessons(skill.id);
          const firstUncompletedLesson = await findFirstUncompletedLesson(user.uid, lessons);
          if (firstUncompletedLesson) return firstUncompletedLesson;
        }
      }
    }

    // 2. If no goal-related lessons, find the next lesson in the lowest-difficulty unlocked skill
    const sortedSkills = unlockedSkills.sort((a, b) => {
      const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
      return difficultyOrder[a.difficulty_level] - difficultyOrder[b.difficulty_level];
    });

    for (const skill of sortedSkills) {
      const lessons = await SkillTreeService.getSkillLessons(skill.id);
      const firstUncompletedLesson = await findFirstUncompletedLesson(user.uid, lessons);
      if (firstUncompletedLesson) return firstUncompletedLesson;
    }

    return null;
  }, [user?.uid, state.skillTree, state.userGoals, isSkillUnlocked, isSkillMastered, findFirstUncompletedLesson]);

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
              lesson.learning_objects
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
  }, [skillId, isUnlocked]);

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

        if (fetchedLesson) {
          // If content is missing, generate it first.
          if (!fetchedLesson.content || fetchedLesson.content.length === 0) {
            const structuredContent = await SkillTreeService.generateStructuredLessonContent(
              fetchedLesson.id,
              fetchedLesson.title,
              fetchedLesson.learning_objects
            );
            fetchedLesson.content = structuredContent;
          }

          // Now, clean the content regardless of whether it was just generated or fetched.
          const cleanedContent = fetchedLesson.content.map(section => {
            if (section.type === 'quiz' && section.quiz) {
              const cleanedQuiz = section.quiz.map(q => {
                const correctAnswer = (typeof q.correct_answer === 'string')
                  ? q.correct_answer
                  : (q.correct_answer as string)?.selected_option;

                return { ...q, correct_answer: correctAnswer || '' };
              });
              return { ...section, quiz: cleanedQuiz };
            } else if (section.type === 'text' && section.content) {
              return { ...section, content: cleanMarkdown(section.content) };
            }
            return section;
          });

          setLesson({ ...fetchedLesson, content: cleanedContent });

        } else {
          setLesson(null);
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
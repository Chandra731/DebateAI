import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy, setDoc, updateDoc, QueryConstraint } from 'firebase/firestore';
import { GroqService } from './groqService';
import { logger } from '../utils/monitoring';
import { DatabaseService } from './database';
import { 
  SkillCategory, 
  Skill, 
  UserSkillProgress, 
  Lesson, 
  LessonSection, 
  Exercise, 
  ExerciseAttempt, 
  AIFeedback, 
  UserLearningGoals, 
  UserLessonCompletion, 
  UserReviewSchedule, 
  Prerequisite
} from '../types';

export class SkillTreeService {
  private static async _getData<T>(pathSegments: string[], ...queryConstraints: QueryConstraint[]): Promise<T[]> {
    try {
      const collectionRef = collection(db, ...pathSegments);
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: '_getData', pathSegments });
      throw error;
    }
  }

  private static async _getDoc<T>(pathSegments: string[], docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, ...pathSegments, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: '_getDoc', pathSegments, docId });
      throw error;
    }
  }

  static async getSkillWithCategory(skillId: string): Promise<{ skill: Skill; category: SkillCategory } | null> {
    logger.info(`Attempting to get skill with ID: ${skillId}`);
    const categories = await this._getData<SkillCategory>(['skill_categories']);
    logger.info('Fetched skill categories:', categories);
    for (const category of categories) {
      logger.info(`Searching for skill ${skillId} in category: ${category.id}`);
      const skill = await this._getDoc<Skill>(['skill_categories', category.id, 'skills'], skillId);
      if (skill) {
        logger.info(`Found skill ${skillId} in category ${category.id}:`, skill);
        return { skill, category };
      }
    }
    logger.warn(`Skill with ID ${skillId} not found in any category.`);
    return null;
  }

  static async getSkillTree(): Promise<SkillCategory[]> {
    const categories = await this._getData<SkillCategory>(['skill_categories'], where('is_active', '==', true), orderBy('display_order'));
    for (const category of categories) {
      const skills = await this._getData<Skill>(['skill_categories', category.id, 'skills'], where('is_active', '==', true), orderBy('display_order'));
      for (const skill of skills) {
        const dependencies = await this._getData<{ from_skill_id: string, to_skill_id: string }>(['skill_dependencies'], where('to_skill_id', '==', skill.id));
        skill.prerequisites = dependencies.map(dep => ({ prerequisite_skill_id: dep.from_skill_id }));
      }
      category.skills = skills;
    }
    return categories;
  }

  static async getUserSkillProgress(userId: string): Promise<UserSkillProgress[]> {
    return this._getData<UserSkillProgress>(['user_skill_progress'], where('user_id', '==', userId));
  }

  static async getUserLearningGoals(userId: string): Promise<UserLearningGoals | null> {
    return this._getDoc<UserLearningGoals>(['user_learning_goals'], userId);
  }

  static async generateStructuredLessonContent(
    categoryId: string,
    skillId: string,
    lessonId: string,
    lessonTitle: string,
    learningObjectives: string[]
  ): Promise<LessonSection[]> {
    try {
      const systemPrompt = `You are an expert educator. Your task is to generate lesson content as a single, valid JSON array.
- The entire response MUST be ONLY the JSON array.
- Do NOT include any text, explanations, or markdown code blocks (e.g., json) around the JSON.
- For 'text' sections, use standard Markdown (e.g., '## Title').
- For 'quiz' sections, the 'type' should be 'quiz', and the 'quiz' field MUST be an array of QuizQuestion objects. Quiz sections MUST NOT have a 'title' field.
- Each QuizQuestion object MUST have 'question', 'options' (an array of strings), and 'correct_answer' (a string that exactly matches one of the options).`;

      const userPrompt = `\n        Generate a JSON array of lesson sections for the lesson titled "${lessonTitle}".\n        Learning Objectives: ${learningObjectives.join(', ')}.\n        Respond with ONLY the JSON array.\n      `;

      logger.info('Attempting to generate structured lesson content.', { skillId, lessonId, lessonTitle, learningObjectives });
      const aiResponse = await GroqService.getCompletion(userPrompt, systemPrompt);
      logger.info('Received AI response for lesson content generation.', { aiResponse });

      let structuredContent: LessonSection[];
      try {
        let jsonString = aiResponse as string;

        // 1. Find JSON within markdown code blocks.
        const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
          jsonString = markdownMatch[1];
          logger.info('Extracted JSON from markdown code block.', { jsonString });
        } else {
          // 2. If no code block, find the first '[' or '{' and the last ']' or '}'.
          const firstBracket = jsonString.indexOf('[');
          const firstBrace = jsonString.indexOf('{');
          const lastBracket = jsonString.lastIndexOf(']');
          const lastBrace = jsonString.lastIndexOf('}');

          let startIndex = -1;
          if (firstBracket > -1 && firstBrace > -1) {
            startIndex = Math.min(firstBracket, firstBrace);
          } else if (firstBracket > -1) {
            startIndex = firstBracket;
          } else {
            startIndex = firstBrace;
          }

          let endIndex = -1;
          if (lastBracket > -1 && lastBrace > -1) {
            endIndex = Math.max(lastBracket, lastBrace);
          } else if (lastBracket > -1) {
            endIndex = lastBracket;
          } else if (lastBrace > -1) {
            endIndex = lastBrace;
          }

          if (startIndex !== -1 && endIndex > startIndex) {
            jsonString = jsonString.substring(startIndex, endIndex + 1);
            logger.info('Extracted JSON by bracket/brace matching.', { jsonString });
          }
        }

        // 3. Clean up common JSON errors before parsing.
        jsonString = jsonString.replace(/,s*([}\]])/g, '$1');
        logger.info('Cleaned JSON string before parsing.', { jsonString });

        structuredContent = JSON.parse(jsonString);
        logger.info('Successfully parsed structured content.', { structuredContent });

      } catch (e) {
        logger.error(new Error("Failed to parse structured lesson content from AI."), {
          component: 'SkillTreeService',
          action: 'generateStructuredLessonContent',
          rawResponse: aiResponse,
          parseError: e,
        });
        throw new Error("The AI returned malformed lesson content. Please try again.");
      }

      const lessonRef = doc(db, 'skill_categories', categoryId, 'skills', skillId, 'lessons', lessonId);
      logger.info('Attempting to update lesson document with structured content.', { lessonRef: lessonRef.path, structuredContent });
      await updateDoc(lessonRef, { content: structuredContent });
      logger.info('Lesson document updated successfully.');

      return structuredContent;

    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: 'generateStructuredLessonContent' });
      throw error;
    }
  }

  static async unlockSkill(userId: string, skillId: string): Promise<UserSkillProgress | null> {
    try {
      const canUnlock = await this.checkSkillPrerequisites(userId, skillId);
      if (!canUnlock) {
        return null;
      }

      const skillProgressRef = doc(db, 'user_skill_progress', `${userId}_${skillId}`);
      const existingProgress = await getDoc(skillProgressRef);

      if (existingProgress.exists()) {
        return existingProgress.data() as UserSkillProgress;
      }

      const newProgress: UserSkillProgress = {
        user_id: userId,
        skill_id: skillId,
        mastery_level: 0,
        is_unlocked: true,
        is_mastered: false,
        total_xp_earned: 0,
        lessons_completed: 0,
        exercises_completed: 0,
        first_unlocked_at: new Date().toISOString(),
      };

      await setDoc(skillProgressRef, newProgress);
      return newProgress;
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: 'unlockSkill' });
      throw error;
    }
  }

  static async checkSkillPrerequisites(
    userId: string, 
    skillId: string,
    newlyMasteredSkillId?: string
  ): Promise<boolean> {
    try {
      const dependencies = await this._getData<{ from_skill_id: string, to_skill_id: string }>(['skill_dependencies'], where('to_skill_id', '==', skillId));

      if (dependencies.length === 0) {
        return true;
      }

      const prerequisiteIds = dependencies.map(d => d.from_skill_id);
      const progress = await this._getData<UserSkillProgress>(['user_skill_progress'], where('user_id', '==', userId), where('skill_id', 'in', prerequisiteIds));
      
      const masteredSkills = new Set(progress
        .filter(p => p.is_mastered)
        .map(p => p.skill_id)
      );

      if (newlyMasteredSkillId) {
        masteredSkills.add(newlyMasteredSkillId);
      }

      return prerequisiteIds.every(id => masteredSkills.has(id));
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: 'checkSkillPrerequisites' });
      return false;
    }
  }

  static async getSkillLessons(categoryId: string, skillId: string): Promise<Lesson[]> {
    return this._getData<Lesson>(['skill_categories', categoryId, 'skills', skillId, 'lessons']);
  }

  static async getLesson(categoryId: string, skillId: string, lessonId: string): Promise<Lesson | null> {
    return this._getDoc<Lesson>(['skill_categories', categoryId, 'skills', skillId, 'lessons'], lessonId);
  }

  static async getUserLessonCompletions(userId: string): Promise<UserLessonCompletion[]> {
    return this._getData<UserLessonCompletion>(['user_lesson_completions'], where('user_id', '==', userId));
  }

  static async getUserExerciseAttempts(userId: string): Promise<ExerciseAttempt[]> {
    return this._getData<ExerciseAttempt>(['user_exercise_attempts'], where('user_id', '==', userId));
  }

  static async getLessonExercises(categoryId: string, skillId: string, lessonId: string): Promise<Exercise[]> {
    return this._getData<Exercise>(['skill_categories', categoryId, 'skills', skillId, 'lessons', lessonId, 'exercises'], where('is_active', '==', true), orderBy('display_order'));
  }

  static async completeLesson(
    userId: string,
    categoryId: string,
    skillId: string,
    lessonId: string,
    timeSpent: number,
    comprehensionScore: number,
    notes?: string
  ): Promise<void> {
    try {
      const completionRef = doc(db, 'user_lesson_completions', `${userId}_${lessonId}`);
      await setDoc(completionRef, {
        user_id: userId,
        lesson_id: lessonId,
        time_spent: timeSpent,
        comprehension_score: comprehensionScore,
        notes: notes || null,
        completed_at: new Date().toISOString()
      }, { merge: true });

      const lesson = await this._getDoc<Lesson>(['skill_categories', categoryId, 'skills', skillId, 'lessons'], lessonId);

      if (lesson && lesson.skill_id && lesson.category_id) {
        const skill = await this._getDoc<Skill>(['skill_categories', lesson.category_id, 'skills'], lesson.skill_id);

        if (skill && skill.xp_reward) {
          await DatabaseService.addXP(userId, skill.xp_reward, `Completed lesson: ${lesson.title}`, 'lesson', lesson.id);
        }
      }

      await this.updateSkillProgress(userId, categoryId, skillId, lessonId, lessonId, 'lesson');
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: 'completeLesson' });
      throw error;
    }
  }

  static async submitExerciseAttempt(
    userId: string,
    categoryId: string,
    skillId: string,
    lessonId: string,
    exerciseId: string,
    userAnswer: ExerciseAttempt['user_answer'],
    timeSpent: number
  ): Promise<{ attempt: ExerciseAttempt; feedback: AIFeedback }> {
    try {
      const exercise = await this._getDoc<Exercise>(['skill_categories', categoryId, 'skills', skillId, 'lessons', lessonId, 'exercises'], exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      const attempts = await this._getData<ExerciseAttempt>(['user_exercise_attempts'], where('user_id', '==', userId), where('exercise_id', '==', exerciseId), orderBy('attempt_number', 'desc'));
      const attemptNumber = (attempts[0]?.attempt_number || 0) + 1;

      const feedback = await this.evaluateExerciseAnswer(exercise, userAnswer);

      const newAttempt: ExerciseAttempt = {
        user_id: userId,
        exercise_id: exerciseId,
        attempt_number: attemptNumber,
        user_answer: userAnswer,
        score: feedback.skill_score,
        is_correct: feedback.verdict === 'correct',
        ai_feedback: feedback,
        time_spent: timeSpent,
        completed_at: new Date().toISOString()
      };

      await setDoc(doc(collection(db, 'user_exercise_attempts')), newAttempt);

      if (feedback.skill_score >= exercise.passing_score) {
        await this.updateSkillProgress(userId, categoryId, skillId, lessonId, exerciseId, 'exercise');
      }

      return { attempt: newAttempt, feedback };
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: 'submitExerciseAttempt' });
      throw error;
    }
  }

  static async evaluateExerciseAnswer(exercise: Exercise, userAnswer: ExerciseAttempt['user_answer']): Promise<AIFeedback> {
    logger.info('Evaluating exercise answer.', { exerciseId: exercise.id, userAnswer });
    try {
      // 1. Handle simple multiple-choice questions without AI
      if (exercise.type === 'mcq') {
        const correctAnswer = (exercise.correct_answer as { selected_option: string })?.selected_option;
        const userAnswerOption = (userAnswer as { selected_option: string })?.selected_option;
        
        if (!correctAnswer) {
          logger.error(new Error(`Correct answer not defined for MCQ exercise: ${exercise.id}`), { component: 'SkillTreeService', action: 'evaluateExerciseAnswer' });
          throw new Error(`Correct answer not defined for MCQ exercise: ${exercise.id}`);
        }

        const isCorrect = correctAnswer === userAnswerOption;

        const feedback: AIFeedback = {
          verdict: isCorrect ? 'correct' : 'incorrect',
          explanation: isCorrect 
            ? `Correct! The answer is indeed "${correctAnswer}".`
            : `Not quite. The correct answer is "${correctAnswer}". You selected "${userAnswerOption}".`,
          improvement_advice: isCorrect ? [] : ['Review the lesson material on this topic to better understand the key concepts.'],
          skill_score: isCorrect ? 100 : 0,
          unlock_next_skill: isCorrect,
        };
        logger.info('MCQ exercise evaluated without AI.', { feedback });
        return feedback;
      }

      // 2. For more complex types, use a structured AI evaluation
      const systemPrompt = `You are an expert debate coach providing feedback on a user's exercise submission.\n        Analyze the user's answer based on the provided exercise details and return a JSON object with the following structure:\n        { \n          "verdict": "correct" | "partial" | "incorrect",\n          "explanation": "A detailed explanation of why the user's answer is correct, partial, or incorrect. Refer to specific parts of their answer.",\n          "improvement_advice": ["A list of 2-3 actionable tips for improvement."],\n          "skill_score": A score from 0 to 100 representing mastery of the targeted skill.\n        }\n        Ensure your response is ONLY the JSON object.`;

      const userPrompt = `\n        Please evaluate the following exercise submission:\n        \n        ## Exercise Details:\n        - **Title:** ${exercise.title}\n        - **Type:** ${exercise.type}\n        - **Instructions:** ${exercise.content.prompt || 'N/A'}\n        - **Evaluation Criteria:** ${exercise.ai_evaluation_prompt}\n\n        ## User's Submission:\n        ${JSON.stringify(userAnswer, null, 2)}\n      `;

      logger.info('Sending exercise evaluation request to GroqService.', { userPrompt, systemPrompt });
      const aiResponse = await GroqService.getCompletion(userPrompt, systemPrompt);
      logger.info('Received AI response for exercise evaluation.', { aiResponse });

      if (typeof aiResponse === 'string') {
        // If the response is a string, it means parsing failed or it's a mock response.
        // We'll try to handle it gracefully, but this indicates an issue.
        logger.warn('AI response for exercise evaluation was a string, not an object.', { exerciseId: exercise.id, response: aiResponse });
        // Attempt to create a partial feedback object
        return {
          verdict: 'partial',
          explanation: aiResponse, // Use the string response as the explanation
          improvement_advice: ['The AI evaluation may not have completed correctly. Please review your answer and try again.'],
          skill_score: 50, // Assign a neutral score
          unlock_next_skill: false,
        };
      }

      // Assuming aiResponse is ExerciseEvaluation
      const feedback = aiResponse as AIFeedback;
      feedback.unlock_next_skill = feedback.verdict === 'correct' && feedback.skill_score >= (exercise.passing_score || 80);
      logger.info('Exercise evaluation feedback generated.', { feedback });
      return feedback;

    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: 'evaluateExerciseAnswer' });
      
      return {
        verdict: 'partial', // Use 'partial' to indicate an error state
        explanation: 'An unexpected error occurred while evaluating your answer. Please try again later.',
        improvement_advice: ['Check your internet connection and try submitting again.'],
        skill_score: 0, // No score on error
        unlock_next_skill: false
      };
    }
  }

  static async getFeedbackTemplate(): Promise<AIFeedback | null> {
    return this._getDoc<AIFeedback>(['ai_feedback_templates'], 'default');
  }

  static async getUserReviewSchedule(userId: string): Promise<UserReviewSchedule[]> {
    const reviewItems = await this._getData<UserReviewSchedule>(['user_review_schedule'], where('user_id', '==', userId), where('review_at', '<=', new Date().toISOString()), orderBy('review_at'));

    // Fetch skill names for each review item
    const itemsWithSkillNames = await Promise.all(reviewItems.map(async (item) => {
      // Determine if it's a lesson or exercise to find the associated skill
      let skillId: string | undefined;
      let categoryId: string | undefined;

      // To correctly fetch the lesson/exercise from the nested structure, 
      // we need their full paths. This means we need to know the skillId and categoryId
      // associated with the lesson/exercise. This information is not directly available
      // in the UserReviewSchedule item. 
      // For now, I will assume a top-level 'lessons' and 'exercises' collection for review items
      // as a temporary measure, but this needs to be addressed if review items are also nested.
      // This is a known limitation given the current data model for review items.
      if (item.item_type === 'lesson') {
        const lesson = await this._getDoc<Lesson>(['lessons'], item.item_id); // TEMPORARY: Assumes top-level lessons
        skillId = lesson?.skill_id;
        categoryId = lesson?.category_id;
      } else if (item.item_type === 'exercise') {
        const exercise = await this._getDoc<Exercise>(['exercises'], item.item_id); // TEMPORARY: Assumes top-level exercises
        if (exercise) {
          const lesson = await this._getDoc<Lesson>(['lessons'], exercise.lesson_id); // TEMPORARY: Assumes top-level lessons
          skillId = lesson?.skill_id;
          categoryId = lesson?.category_id;
        }
      }

      if (skillId) {
        const skillWithCategory = await this.getSkillWithCategory(skillId);
        return { ...item, skill_name: skillWithCategory?.skill.name || 'Unknown Skill' };
      }
      return { ...item, skill_name: 'Unknown Skill' };
    }));

    return itemsWithSkillNames;
  }

  static async updateSkillProgress(userId: string, categoryId: string, skillId: string, lessonId: string, itemId: string, itemType: 'lesson' | 'exercise'): Promise<{ masteryAchieved: boolean }> {
    try {
      let targetSkillId: string | undefined = skillId;

      if (itemType === 'lesson') {
        // For a lesson, the skillId is already provided
      } else if (itemType === 'exercise') {
        // For an exercise, we need to ensure the skillId is correct based on its parent lesson
        const exercise = await this._getDoc<Exercise>(['skill_categories', categoryId, 'skills', skillId, 'lessons', lessonId, 'exercises'], itemId);
        if (!exercise) {
          throw new Error('Exercise not found for skill progress update.');
        }
        // The skillId is already passed as a parameter, so we just confirm it.
      }

      if (!targetSkillId) {
        return { masteryAchieved: false };
      }

      const skillProgressRef = doc(db, 'user_skill_progress', `${userId}_${targetSkillId}`);
      if (!(await getDoc(skillProgressRef)).exists()) {
        await this.unlockSkill(userId, targetSkillId);
      }
      const progress = (await getDoc(skillProgressRef)).data() as UserSkillProgress;

      const allLessons = await this.getSkillLessons(categoryId, targetSkillId);
      const allExercises = (await Promise.all(allLessons.map(l => this.getLessonExercises(categoryId, targetSkillId, l.id)))).flat();
      const totalItems = allLessons.length + allExercises.length;

      const completedLessons = await this._getData<UserLessonCompletion>(['user_lesson_completions'], where('user_id', '==', userId));
      const completedLessonIds = new Set(completedLessons.map(d => d.lesson_id));
      const completedExercises = await this._getData<ExerciseAttempt>(['user_exercise_attempts'], where('user_id', '==', userId), where('is_correct', '==', true));
      const completedExerciseIds = new Set(completedExercises.map(d => d.exercise_id));

      const completedLessonsForSkill = allLessons.filter(l => completedLessonIds.has(l.id)).length;
      const completedExercisesForSkill = allExercises.filter(e => completedExerciseIds.has(e.id)).length;
      const totalCompleted = completedLessonsForSkill + completedExercisesForSkill;
      
      const newMasteryLevel = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

      const updates: Partial<UserSkillProgress> = {
        mastery_level: newMasteryLevel,
        lessons_completed: completedLessonsForSkill,
        exercises_completed: completedExercisesForSkill,
        last_practiced_at: new Date().toISOString(),
      };

      const skillData = await this.getSkillWithCategory(targetSkillId);
      let masteryAchieved = false;
      if (skillData && newMasteryLevel >= skillData.skill.mastery_threshold && !progress.is_mastered) {
        updates.is_mastered = true;
        updates.mastered_at = new Date().toISOString();
        await this.unlockDependentSkills(userId, targetSkillId);
        masteryAchieved = true;
      }

      await updateDoc(skillProgressRef, updates);
      return { masteryAchieved };
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: 'updateSkillProgress' });
      return { masteryAchieved: false };
    }
  }

  static async unlockDependentSkills(userId: string, masteredSkillId: string): Promise<void> {
    try {
      const dependentSkills = await this._getData<{ from_skill_id: string, to_skill_id: string }>(['skill_dependencies'], where('from_skill_id', '==', masteredSkillId));

      for (const dep of dependentSkills) {
        const canUnlock = await this.checkSkillPrerequisites(userId, dep.to_skill_id, masteredSkillId);
        if (canUnlock) {
          await this.unlockSkill(userId, dep.to_skill_id);
        }
      }
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: 'unlockDependentSkills' });
    }
  }

  static async getUserLearningAnalytics(userId: string): Promise<UserLearningAnalytics> {
    try {
      const progress = await this.getUserSkillProgress(userId);
      const completions = await this.getUserLessonCompletions(userId);
      const attempts = await this.getUserExerciseAttempts(userId); 

      const progressWithSkills = await Promise.all(progress.map(async (p) => {
        const skillDetails = await this.getSkillWithCategory(p.skill_id);
        return { ...p, skill: skillDetails?.skill };
      }));

      // Fetch all lessons and exercises to calculate total counts for analytics
      const allCategories = await this._getData<SkillCategory>(['skill_categories']);
      let allLessons: Lesson[] = [];
      let allExercises: Exercise[] = [];

      for (const category of allCategories) {
        const skillsInCategory = await this._getData<Skill>(['skill_categories', category.id, 'skills']);
        for (const skill of skillsInCategory) {
          const lessonsInSkill = await this.getSkillLessons(category.id, skill.id);
          allLessons = allLessons.concat(lessonsInSkill);
          for (const lesson of lessonsInSkill) {
            const exercisesInLesson = await this.getLessonExercises(category.id, skill.id, lesson.id);
            allExercises = allExercises.concat(exercisesInLesson);
          }
        }
      }

      const completedLessons = await this._getData<UserLessonCompletion>(['user_lesson_completions'], where('user_id', '==', userId));
      const completedExercises = await this._getData<ExerciseAttempt>(['user_exercise_attempts'], where('user_id', '==', userId), where('is_correct', '==', true));

      return {
        totalSkillsUnlocked: progress.filter(p => p.is_unlocked).length,
        totalSkillsMastered: progress.filter(p => p.is_mastered).length,
        totalLessonsCompleted: completedLessons.length,
        totalExercisesAttempted: completedExercises.length,
        averageScore: completedExercises.length > 0 
          ? Math.round(completedExercises.reduce((sum, a) => sum + a.score, 0) / completedExercises.length)
          : 0,
        totalXPEarned: progress.reduce((sum, p) => sum + (p.total_xp_earned || 0), 0),
        skillProgress: progressWithSkills,
        recentActivity: [...completedLessons, ...completedExercises]
          .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - 
                         new Date(a.completed_at || a.created_at).getTime())
          .slice(0, 10)
      };
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: 'getUserLearningAnalytics' });
      throw error;
    }
  }
}
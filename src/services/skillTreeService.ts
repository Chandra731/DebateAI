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
  private static async _getData<T>(collectionName: string, ...queryConstraints: QueryConstraint[]): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: '_getData', collection: collectionName });
      throw error;
    }
  }

  private static async _getDoc<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: '_getDoc', collection: collectionName, docId });
      throw error;
    }
  }

  static async getSkillWithCategory(skillId: string): Promise<{ skill: Skill; category: SkillCategory } | null> {
    const categories = await this._getData<SkillCategory>('skill_categories');
    for (const category of categories) {
      const skill = await this._getDoc<Skill>(`skill_categories/${category.id}/skills`, skillId);
      if (skill) {
        return { skill, category };
      }
    }
    return null;
  }

  static async getSkillTree(): Promise<SkillCategory[]> {
    const categories = await this._getData<SkillCategory>('skill_categories', where('is_active', '==', true), orderBy('display_order'));
    for (const category of categories) {
      const skills = await this._getData<Skill>(`skill_categories/${category.id}/skills`, where('is_active', '==', true), orderBy('display_order'));
      for (const skill of skills) {
        skill.prerequisites = await this._getData<Prerequisite>('skill_dependencies', where('skill_id', '==', skill.id));
      }
      category.skills = skills;
    }
    return categories;
  }

  static async getUserSkillProgress(userId: string): Promise<UserSkillProgress[]> {
    return this._getData<UserSkillProgress>('user_skill_progress', where('user_id', '==', userId));
  }

  static async getUserLearningGoals(userId: string): Promise<UserLearningGoals | null> {
    return this._getDoc<UserLearningGoals>('user_learning_goals', userId);
  }

  static async generateStructuredLessonContent(
    lessonId: string,
    lessonTitle: string,
    learningObjectives: string[]
  ): Promise<LessonSection[]> {
    try {
      const systemPrompt = `You are an expert educator and content creator for a debate training platform. Your task is to generate structured lesson content, broken down into digestible sections, including text and multiple-choice quizzes. Ensure the content is clear, concise, and directly addresses the learning objectives.`;

      const userPrompt = `
        Generate structured lesson content for the lesson titled "${lessonTitle}".
        The learning objectives for this lesson are: ${learningObjectives.join(', ')}.

        Provide the content as a JSON array of sections. Each section should have a 'type' ('text' or 'quiz').

        For 'text' sections:
        - 'title': A concise title for the section.
        - 'content': The instructional text for the section. Use standard Markdown for formatting, including headings (##, ###), bullet points (* or -), and numbered lists (1., 2.). Ensure proper newlines for readability. For example:
          \`\`\`markdown
          ## My Heading
          
          This is a paragraph.
          
          * Item 1
          * Item 2
          
          1. First point
          2. Second point
          \`\`\`

        For 'quiz' sections:
        - 'quiz': An array of 5 or more QuizQuestion objects. Each QuizQuestion object should have:
          - 'question': A multiple-choice question to test understanding of the preceding text sections.
          - 'options': An array of 3-4 possible answers.
          - 'correct_answer': The exact text of the correct option. THIS MUST BE A STRING, NOT AN OBJECT.

        Ensure that:
        - The lesson flows logically.
        - Quizzes are placed after relevant instructional content.
        - The content is engaging and appropriate for a debate training platform.
        - The entire response is a single JSON array.

        Example JSON structure:
        [
          {
            "type": "text",
            "title": "Introduction to X",
            "content": "This section introduces X..."
          },
          {
            "type": "quiz",
            "question": "What is X?",
            "options": ["A", "B", "C"],
            "correct_answer": "A"
          },
          {
            "type": "text",
            "title": "Advanced Y",
            "content": "Now let's discuss Y..."
          }
        ]
      `;

      const aiResponse = await GroqService.getCompletion(userPrompt, systemPrompt);

      let structuredContent: LessonSection[];
      try {
        // Enhanced JSON extraction logic
        let jsonString = aiResponse as string;

        // 1. Try to find JSON within markdown code blocks
        const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonString = jsonMatch[1];
        } else {
          // 2. If no code block, find the first '[' or '{' and the last ']' or '}'
          const firstBracket = jsonString.indexOf('[');
          const firstBrace = jsonString.indexOf('{');
          
          let startIndex = -1;
          
          if (firstBracket > -1 && firstBrace > -1) {
            startIndex = Math.min(firstBracket, firstBrace);
          } else if (firstBracket > -1) {
            startIndex = firstBracket;
          } else {
            startIndex = firstBrace;
          }

          if (startIndex !== -1) {
            const lastBracket = jsonString.lastIndexOf(']');
            const lastBrace = jsonString.lastIndexOf('}');
            const endIndex = Math.max(lastBracket, lastBrace);

            if (endIndex > startIndex) {
              jsonString = jsonString.substring(startIndex, endIndex + 1);
            }
          }
        }

        // 3. Clean up the extracted string from control characters
        jsonString = jsonString.replace(/[\000-\037\177-\237]/g, "");
        
        // 4. Attempt to parse
        structuredContent = JSON.parse(jsonString);

      } catch (e) {
        logger.error(new Error("Failed to parse structured lesson content from AI."), {
          component: 'SkillTreeService',
          action: 'generateStructuredLessonContent',
          rawResponse: aiResponse, // Log the raw response for debugging
          parseError: e,
        });
        // Re-throw a more user-friendly error
        throw new Error("The AI's response for lesson content was not in the expected format. Please try again.");
      }

      const lessonRef = doc(db, 'lessons', lessonId);
      await updateDoc(lessonRef, { content: structuredContent });

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
      const dependencies = await this._getData<{ prerequisite_skill_id: string }>('skill_dependencies', where('skill_id', '==', skillId));

      if (dependencies.length === 0) {
        return true;
      }

      const prerequisiteIds = dependencies.map(d => d.prerequisite_skill_id);
      const progress = await this._getData<UserSkillProgress>('user_skill_progress', where('user_id', '==', userId), where('skill_id', 'in', prerequisiteIds));
      
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

  static async getSkillLessons(skillId: string): Promise<Lesson[]> {
    return this._getData<Lesson>('lessons', where('skill_id', '==', skillId), where('is_active', '==', true), orderBy('display_order'));
  }

  static async getLesson(lessonId: string): Promise<Lesson | null> {
    return this._getDoc<Lesson>('lessons', lessonId);
  }

  static async getLessonExercises(lessonId: string): Promise<Exercise[]> {
    return this._getData<Exercise>('exercises', where('lesson_id', '==', lessonId), where('is_active', '==', true), orderBy('display_order'));
  }

  static async getUserLessonCompletions(userId: string): Promise<UserLessonCompletion[]> {
    return this._getData<UserLessonCompletion>('user_lesson_completions', where('user_id', '==', userId));
  }

  static async getUserExerciseAttempts(userId: string): Promise<ExerciseAttempt[]> {
    return this._getData<ExerciseAttempt>('user_exercise_attempts', where('user_id', '==', userId));
  }

  static async completeLesson(
    userId: string,
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

      const lesson = await this._getDoc<Lesson>('lessons', lessonId);

      if (lesson && lesson.skill_id && lesson.category_id) {
        const skill = await this._getDoc<Skill>(`skill_categories/${lesson.category_id}/skills`, lesson.skill_id);

        if (skill && skill.xp_reward) {
          await DatabaseService.addXP(userId, skill.xp_reward, `Completed lesson: ${lesson.title}`, 'lesson', lesson.id);
        }
      }

      await this.updateSkillProgress(userId, lessonId, 'lesson');
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: 'completeLesson' });
      throw error;
    }
  }

  static async submitExerciseAttempt(
    userId: string,
    exerciseId: string,
    userAnswer: ExerciseAttempt['user_answer'],
    timeSpent: number
  ): Promise<{ attempt: ExerciseAttempt; feedback: AIFeedback }> {
    try {
      const exercise = await this._getDoc<Exercise>('exercises', exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      const attempts = await this._getData<ExerciseAttempt>('user_exercise_attempts', where('user_id', '==', userId), where('exercise_id', '==', exerciseId), orderBy('attempt_number', 'desc'));
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
        await this.updateSkillProgress(userId, exerciseId, 'exercise');
      }

      return { attempt: newAttempt, feedback };
    } catch (error) {
      logger.error(error as Error, { component: 'SkillTreeService', action: 'submitExerciseAttempt' });
      throw error;
    }
  }

  static async evaluateExerciseAnswer(exercise: Exercise, userAnswer: ExerciseAttempt['user_answer']): Promise<AIFeedback> {
    try {
      // 1. Handle simple multiple-choice questions without AI
      if (exercise.type === 'mcq') {
        const correctAnswer = (exercise.correct_answer as { selected_option: string })?.selected_option;
        const userAnswerOption = (userAnswer as { selected_option: string })?.selected_option;
        
        if (!correctAnswer) {
          throw new Error(`Correct answer not defined for MCQ exercise: ${exercise.id}`);
        }

        const isCorrect = correctAnswer === userAnswerOption;

        return {
          verdict: isCorrect ? 'correct' : 'incorrect',
          explanation: isCorrect 
            ? `Correct! The answer is indeed "${correctAnswer}".`
            : `Not quite. The correct answer is "${correctAnswer}". You selected "${userAnswerOption}".`,
          improvement_advice: isCorrect ? [] : ['Review the lesson material on this topic to better understand the key concepts.'],
          skill_score: isCorrect ? 100 : 0,
          unlock_next_skill: isCorrect,
        };
      }

      // 2. For more complex types, use a structured AI evaluation
      const systemPrompt = `
        You are an expert debate coach providing feedback on a user's exercise submission.
        Analyze the user's answer based on the provided exercise details and return a JSON object with the following structure:
        { 
          "verdict": "correct" | "partial" | "incorrect",
          "explanation": "A detailed explanation of why the user's answer is correct, partial, or incorrect. Refer to specific parts of their answer.",
          "improvement_advice": ["A list of 2-3 actionable tips for improvement."],
          "skill_score": A score from 0 to 100 representing mastery of the targeted skill.
        }
        Ensure your response is ONLY the JSON object.`;

      const userPrompt = `
        Please evaluate the following exercise submission:
        
        ## Exercise Details:
        - **Title:** ${exercise.title}
        - **Type:** ${exercise.type}
        - **Instructions:** ${exercise.content.prompt || 'N/A'}
        - **Evaluation Criteria:** ${exercise.ai_evaluation_prompt}

        ## User's Submission:
        ${JSON.stringify(userAnswer, null, 2)}
      `;

      const aiResponse = await GroqService.getCompletion(userPrompt, systemPrompt);

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
    return this._getDoc<AIFeedback>('ai_feedback_templates', 'default');
  }

  static async getUserReviewSchedule(userId: string): Promise<UserReviewSchedule[]> {
    const reviewItems = await this._getData<UserReviewSchedule>('user_review_schedule', where('user_id', '==', userId), where('review_at', '<=', new Date().toISOString()), orderBy('review_at'));

    // Fetch skill names for each review item
    const itemsWithSkillNames = await Promise.all(reviewItems.map(async (item) => {
      // Determine if it's a lesson or exercise to find the associated skill
      let skillId: string | undefined;
      if (item.item_type === 'lesson') {
        const lesson = await this._getDoc<Lesson>('lessons', item.item_id);
        skillId = lesson?.skill_id;
      } else if (item.item_type === 'exercise') {
        const exercise = await this._getDoc<Exercise>('exercises', item.item_id);
        if (exercise) {
          const lesson = await this._getDoc<Lesson>('lessons', exercise.lesson_id);
          skillId = lesson?.skill_id;
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

  static async updateSkillProgress(userId: string, itemId: string, itemType: 'lesson' | 'exercise'): Promise<{ masteryAchieved: boolean }> {
    try {
      let skillId: string | undefined;

      if (itemType === 'lesson') {
        const lesson = await this._getDoc<Lesson>('lessons', itemId);
        skillId = lesson?.skill_id;
      } else {
        const exercise = await this._getDoc<Exercise>('exercises', itemId);
        if (exercise) {
          const lesson = await this._getDoc<Lesson>('lessons', exercise.lesson_id);
          skillId = lesson?.skill_id;
        }
      }

      if (!skillId) {
        return { masteryAchieved: false };
      }

      const skillProgressRef = doc(db, 'user_skill_progress', `${userId}_${skillId}`);
      if (!(await getDoc(skillProgressRef)).exists()) {
        await this.unlockSkill(userId, skillId);
      }
      const progress = (await getDoc(skillProgressRef)).data() as UserSkillProgress;

      const allLessons = await this.getSkillLessons(skillId);
      const allExercises = (await Promise.all(allLessons.map(l => this.getLessonExercises(l.id)))).flat();
      const totalItems = allLessons.length + allExercises.length;

      const completedLessons = await this._getData<UserLessonCompletion>('user_lesson_completions', where('user_id', '==', userId));
      const completedLessonIds = new Set(completedLessons.map(d => d.lesson_id));
      const completedExercises = await this._getData<ExerciseAttempt>('user_exercise_attempts', where('user_id', '==', userId), where('is_correct', '==', true));
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

      const skillData = await this.getSkillWithCategory(skillId);
      let masteryAchieved = false;
      if (skillData && newMasteryLevel >= skillData.skill.mastery_threshold && !progress.is_mastered) {
        updates.is_mastered = true;
        updates.mastered_at = new Date().toISOString();
        await this.unlockDependentSkills(userId, skillId);
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
      const dependentSkills = await this._getData<{ prerequisite_skill_id: string }>('skill_dependencies', where('prerequisite_skill_id', '==', masteredSkillId));

      for (const dep of dependentSkills) {
        const canUnlock = await this.checkSkillPrerequisites(userId, dep.skill_id, masteredSkillId);
        if (canUnlock) {
          await this.unlockSkill(userId, dep.skill_id);
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
      const attempts = await this._getData<ExerciseAttempt>('user_exercise_attempts', where('user_id', '==', userId));

      const progressWithSkills = await Promise.all(progress.map(async (p) => {
        const skillDetails = await this.getSkillWithCategory(p.skill_id);
        return { ...p, skill: skillDetails?.skill };
      }));

      return {
        totalSkillsUnlocked: progress.filter(p => p.is_unlocked).length,
        totalSkillsMastered: progress.filter(p => p.is_mastered).length,
        totalLessonsCompleted: completions.length,
        totalExercisesAttempted: attempts.length,
        averageScore: attempts.length > 0 
          ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
          : 0,
        totalXPEarned: progress.reduce((sum, p) => sum + (p.total_xp_earned || 0), 0),
        skillProgress: progressWithSkills,
        recentActivity: [...completions, ...attempts]
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
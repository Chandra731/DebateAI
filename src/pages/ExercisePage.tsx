import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLessonExercises, useSkillTree } from '../hooks/useSkillTree';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { SkillTreeService, AIFeedback } from '../services/skillTreeService';
import * as ExerciseComponents from '../components/SkillTree/ExerciseComponents';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

const ExercisePage: React.FC = () => {
  const { skillId, lessonId, exerciseId } = useParams<{ skillId: string; lessonId: string; exerciseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const { exercise, exercises, loading, error } = useLessonExercises(lessonId!, exerciseId);
  
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const { getRecommendedLesson } = useSkillTree();

  const handleExerciseSubmit = async (answer: Parameters<typeof SkillTreeService.submitExerciseAttempt>[2]) => {
    if (!user || !exercise) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const { feedback: aiFeedback } = await SkillTreeService.submitExerciseAttempt(
        user.uid,
        exercise.id,
        answer,
        0 // timeSpent can be implemented later
      );
      setFeedback(aiFeedback);
      setAttempts(prev => prev + 1);
      if (aiFeedback.unlock_next_skill) {
        showNotification({
          type: 'success',
          title: 'Skill Unlocked!',
          message: 'Congratulations! You have unlocked a new skill.'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      showNotification({
        type: 'error',
        title: 'Submission Failed',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (!feedback) return; // Should not happen if continue button is shown after feedback

    // 1. Check for next exercise in current lesson
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    const nextExercise = exercises[currentIndex + 1];

    if (nextExercise) {
      navigate(`/app/skills/${skillId}/lessons/${lessonId}/exercises/${nextExercise.id}`);
      setFeedback(null);
      setAttempts(0);
      return;
    }

    // 2. Check for next lesson in current skill
    const currentSkillLessons = await SkillTreeService.getSkillLessons(skillId!);
    const currentLessonIndex = currentSkillLessons.findIndex(l => l.id === lessonId);
    const nextLesson = currentSkillLessons[currentLessonIndex + 1];

    if (nextLesson) {
      navigate(`/app/skills/${skillId}/lessons/${nextLesson.id}`);
      setFeedback(null);
      setAttempts(0);
      return;
    }

    // 3. If skill unlocked, find recommended lesson across skill tree
    if (feedback.unlock_next_skill) {
      const recommendedLesson = await getRecommendedLesson();
      if (recommendedLesson) {
        showNotification({
          type: 'info',
          title: 'Next Recommended Lesson',
          message: `You're ready for "${recommendedLesson.title}"!`
        });
        navigate(`/app/skills/${recommendedLesson.skill_id}/lessons/${recommendedLesson.id}`);
        setFeedback(null);
        setAttempts(0);
        return;
      }
    }

    // 4. Fallback: All exercises/lessons in this path completed, go to skill tree overview
    showNotification({
      type: 'success',
      title: 'Path Completed!',
      message: 'You have completed all available content in this path.'
    });
    navigate(`/app/skills`);
    setFeedback(null);
    setAttempts(0);
  };

  const handleRetry = () => {
    setFeedback(null);
  };
  
  const renderExerciseComponent = () => {
    if (!exercise) return null;

    const props: {
      exercise: typeof exercise;
      onSubmit: (answer: ExerciseAttempt['user_answer']) => void;
      disabled: boolean;
    } = {
      exercise,
      onSubmit: handleExerciseSubmit,
      disabled: isSubmitting || !!feedback,
    };

    switch (exercise.type) {
      case 'mcq':
        return <ExerciseComponents.MCQExercise {...props} />;
      case 'text_input':
        return <ExerciseComponents.TextInputExercise {...props} />;
      case 'speech_analysis':
        return <ExerciseComponents.SpeechAnalysisExercise {...props} />;
      case 'drag_and_drop':
        return <ExerciseComponents.DragAndDropExercise {...props} />;
      case 'fallacy_identification':
        return <ExerciseComponents.FallacyIdentificationExercise {...props} />;
      default:
        return <p>Unsupported exercise type: {exercise.type}</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Exercise</h3>
        <p className="text-red-600">{error}</p>
        <Button onClick={() => navigate(`/app/skills/${skillId}/lessons/${lessonId}`)} className="mt-4">
          Back to Lesson
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to={`/app/skills/${skillId}/lessons/${lessonId}`} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="mr-2" />
          Back to Lesson
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2">{exercise?.title}</h1>
          <p className="text-gray-600 mb-6">Complete the exercise below to test your knowledge.</p>
          
          <div className="exercise-container mb-8">
            {isSubmitting ? (
              <div className="text-center py-8">
                <LoadingSpinner />
                <p className="mt-2 text-gray-600">Submitting your answer for evaluation...</p>
              </div>
            ) : (
              renderExerciseComponent()
            )}
          </div>

          {feedback && (
            <div className="feedback-container">
              <h2 className="text-2xl font-semibold mb-4">AI Feedback</h2>
              <ExerciseComponents.ExerciseFeedback
                feedback={feedback}
                onContinue={handleContinue}
                onRetry={handleRetry}
                canRetry={attempts < (exercise?.max_attempts || 3)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExercisePage;

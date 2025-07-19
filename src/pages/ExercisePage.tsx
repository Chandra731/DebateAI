import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLessonExercises } from '../hooks/useSkillTree';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { SkillTreeService, Exercise, AIFeedback } from '../services/skillTreeService';
import * as ExerciseComponents from '../components/SkillTree/ExerciseComponents';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Button from '../components/common/Button';

const ExercisePage: React.FC = () => {
  const { skillId, lessonId, exerciseId } = useParams<{ skillId: string; lessonId: string; exerciseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const { exercise, exercises, loading, error } = useLessonExercises(lessonId!, exerciseId);
  
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isMastered, setIsMastered] = useState(false);

  const handleExerciseSubmit = async (answer: any) => {
    if (!user || !exercise) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const { feedback: aiFeedback, masteryAchieved } = await SkillTreeService.submitExerciseAttempt(
        user.uid,
        exercise.id,
        answer,
        0 // timeSpent can be implemented later
      );
      setFeedback(aiFeedback);
      setUserAnswer(answer);
      setAttempts(prev => prev + 1);
      if (masteryAchieved) {
        setIsMastered(true);
        showNotification({
          type: 'success',
          title: 'Skill Mastered!',
          message: 'Congratulations! You have mastered this skill.'
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

  const handleContinue = () => {
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    const nextExercise = exercises[currentIndex + 1];

    if (nextExercise) {
      navigate(`/app/skills/${skillId}/lessons/${lessonId}/exercises/${nextExercise.id}`);
      setFeedback(null);
      setUserAnswer(null);
      setAttempts(0);
    } else {
      // All exercises completed
      navigate(`/app/skills/${skillId}/lessons/${lessonId}`);
    }
  };

  const handleRetry = () => {
    setFeedback(null);
    setUserAnswer(null);
  };
  
  const renderExerciseComponent = () => {
    if (!exercise) return null;

    const props = {
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

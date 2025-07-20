import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLesson, useLessonExercises, useSkillTree } from '../hooks/useSkillTree';
import { SkillTreeService, QuizQuestion } from '../services/skillTreeService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { ArrowLeft, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import ReactMarkdown from 'react-markdown';

const LessonPage: React.FC = () => {
  const { skillId, lessonId } = useParams<{ skillId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { lesson, loading: lessonLoading, error: lessonError } = useLesson(lessonId || '');
  const { exercises, loading: exercisesLoading, error: exercisesError } = useLessonExercises(lessonId || '');
  const { refetch: refetchSkillTree } = useSkillTree();

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0);
  const [quizFeedbackStatus, setQuizFeedbackStatus] = useState<'unattempted' | 'correct' | 'incorrect'>('unattempted');
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const currentSection = lesson?.content[currentSectionIndex];
  const currentQuizQuestion: QuizQuestion | undefined = 
    currentSection?.type === 'quiz' && currentSection.quiz 
      ? currentSection.quiz[currentQuizQuestionIndex]
      : undefined;

  useEffect(() => {
    // Reset state when lessonId changes
    setCurrentSectionIndex(0);
    setCurrentQuizQuestionIndex(0);
    setQuizFeedbackStatus('unattempted');
    setSelectedQuizOption(null);
    setLessonCompleted(false);
  }, [lessonId]);

  const handleQuizSubmit = () => {
    if (!currentQuizQuestion || !selectedQuizOption) return;

    const trimmedSelectedOption = selectedQuizOption.trim();
    const trimmedCorrectAnswer = currentQuizQuestion.correct_answer.trim();
    const isCorrect = trimmedSelectedOption === trimmedCorrectAnswer;
    setQuizFeedbackStatus(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleCompleteLesson = async () => {
    if (!lesson || !user?.uid) return;
    
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const totalQuizQuestions = lesson.content.reduce((acc, section) => {
      if (section.type === 'quiz' && section.quiz) {
        return acc + section.quiz.length;
      }
      return acc;
    }, 0);
    const comprehensionScore = totalQuizQuestions > 0 ? Math.round((correctAnswers / totalQuizQuestions) * 100) : 100;

    try {
      await SkillTreeService.completeLesson(user.uid, lesson.id, timeSpent, comprehensionScore);
      showNotification({
        type: 'success',
        title: 'Lesson Complete!',
        message: `You&apos;ve earned XP and made progress.`
      });
      refetchSkillTree(); // Refetch skill tree data to update UI
      setLessonCompleted(true);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Could not save lesson completion.'
      });
    }
  };

  const handlePreviousSection = () => {
    if (currentSection?.type === 'quiz' && currentQuizQuestionIndex > 0) {
      setCurrentQuizQuestionIndex(prev => prev - 1);
      setQuizFeedbackStatus('unattempted');
      setSelectedQuizOption(null);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      const previousSection = lesson?.content[currentSectionIndex - 1];
      if (previousSection?.type === 'quiz') {
        setCurrentQuizQuestionIndex((previousSection.quiz?.length || 1) - 1);
      } else {
        setCurrentQuizQuestionIndex(0);
      }
      setQuizFeedbackStatus('unattempted');
      setSelectedQuizOption(null);
    }
  };

  const handleNextSection = () => {
    if (!lesson) return;

    const isLastSection = currentSectionIndex >= lesson.content.length - 1;
    const isQuizSection = currentSection?.type === 'quiz';
    const isQuizFinished = isQuizSection && currentQuizQuestionIndex >= (currentSection.quiz?.length || 0) - 1;

    if (isQuizSection) {
      if (quizFeedbackStatus === 'unattempted') return; // Must attempt quiz before moving on

      if (!isQuizFinished) {
        // Move to next quiz question
        setCurrentQuizQuestionIndex(prev => prev + 1);
        setQuizFeedbackStatus('unattempted');
        setSelectedQuizOption(null);
      } else if (!isLastSection) {
        // Move to next lesson section
        setCurrentSectionIndex(prev => prev + 1);
        setCurrentQuizQuestionIndex(0);
        setQuizFeedbackStatus('unattempted');
        setSelectedQuizOption(null);
      } else {
        // End of all sections
        handleCompleteLesson();
      }
    } else if (!isLastSection) {
      // Move to next lesson section (text type)
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      // End of all sections
      handleCompleteLesson();
    }
  };

  if (lessonLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Lesson</h3>
        <p className="text-red-600">{lessonError || 'Lesson not found.'}</p>
        <Button onClick={() => navigate('/app/skills')} className="mt-4">Back to Skill Tree</Button>
      </div>
    );
  }

  const isLastContent = currentSectionIndex >= lesson.content.length - 1 &&
                        (currentSection?.type !== 'quiz' || currentQuizQuestionIndex >= (currentSection.quiz?.length || 0) - 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/app/skills')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="mr-2" />
          Back to Skill Tree
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>
          <p className="text-gray-600 mb-6">{lesson.description}</p>

          {!lessonCompleted && currentSection ? (
            <div className="lesson-section">
              {currentSection.type === 'text' && (
                <>
                  {currentSection.title && <h2 className="text-2xl font-semibold mb-3">{currentSection.title}</h2>}
                  <div className="prose max-w-none">
                    <ReactMarkdown>{currentSection.content || ''}</ReactMarkdown>
                  </div>
                </>
              )}

              {currentSection.type === 'quiz' && currentSection.quiz && currentQuizQuestion && (
                <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-blue-50">
                  <h2 className="text-2xl font-semibold mb-4 text-blue-800">Quiz Time! (Question {currentQuizQuestionIndex + 1} of {currentSection.quiz.length})</h2>
                  <p className="text-lg font-medium mb-4">{currentQuizQuestion.question}</p>
                  <div className="space-y-3">
                    {currentQuizQuestion.options.map((option, index) => {
                      const isSelected = selectedQuizOption === option;
                      const isCorrectOption = option.trim() === currentQuizQuestion.correct_answer.trim();

                      let buttonVariant: "outline" | "success" | "danger" = "outline";
                      if (quizFeedbackStatus !== 'unattempted') {
                        if (isCorrectOption) {
                          buttonVariant = "success";
                        } else if (isSelected && !isCorrectOption) {
                          buttonVariant = "danger";
                        }
                      } else if (isSelected) {
                        buttonVariant = "primary"; // Highlight selected before submission
                      }

                      return (
                        <Button
                          key={index}
                          variant={buttonVariant}
                          onClick={() => quizFeedbackStatus === 'unattempted' && setSelectedQuizOption(option)}
                          className={`w-full text-left justify-start ${quizFeedbackStatus !== 'unattempted' ? 'cursor-not-allowed' : ''}`}
                          disabled={quizFeedbackStatus !== 'unattempted'}
                        >
                          {option}
                          {quizFeedbackStatus === 'correct' && isCorrectOption && <CheckCircle className="ml-auto text-green-500" />}
                          {quizFeedbackStatus === 'incorrect' && isCorrectOption && <CheckCircle className="ml-auto text-green-500" />}
                          {quizFeedbackStatus === 'incorrect' && isSelected && !isCorrectOption && <XCircle className="ml-auto text-red-500" />}
                        </Button>
                      );
                    })}
                  </div>
                  {quizFeedbackStatus === 'unattempted' && (
                    <Button
                      variant="primary"
                      onClick={handleQuizSubmit}
                      disabled={!selectedQuizOption}
                      className="mt-6 w-full"
                    >
                      Submit Answer
                    </Button>
                  )}
                  {quizFeedbackStatus !== 'unattempted' && (
                    <div className={`mt-4 p-3 rounded-lg text-center ${
                      quizFeedbackStatus === 'correct' ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'
                    }`}>
                      <p className={`font-semibold ${
                        quizFeedbackStatus === 'correct' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {quizFeedbackStatus === 'correct' ? 'Correct!' : 'Incorrect.'}
                      </p>
                      {quizFeedbackStatus === 'incorrect' && (
                        <p className="text-sm text-red-600">The correct answer is highlighted in green.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousSection}
                  disabled={currentSectionIndex === 0 && currentQuizQuestionIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNextSection}
                  disabled={currentSection.type === 'quiz' && quizFeedbackStatus === 'unattempted'}
                >
                  {isLastContent ? 'Finish Lesson' : 'Next'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Lesson Complete!</h2>
              <p className="text-gray-600 mb-8">You&apos;ve finished the lesson. Now, test your knowledge with these exercises.</p>
              
              {exercisesLoading ? (
                <LoadingSpinner />
              ) : exercisesError ? (
                <p className="text-red-600">{exercisesError}</p>
              ) : exercises.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">Practical Exercises</h3>
                  {exercises.map(exercise => (
                    <Link
                      key={exercise.id}
                      to={`/app/skills/${skillId}/lessons/${lessonId}/exercises/${exercise.id}`}
                      className="block w-full"
                    >
                      <Button variant="outline" className="w-full justify-between">
                        <div className="flex items-center">
                          <BrainCircuit className="w-5 h-5 mr-3 text-primary-500" />
                          <span>{exercise.title}</span>
                        </div>
                        <span className="text-sm font-bold text-primary-600">Start</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No exercises available for this lesson yet.</p>
              )}

              <div className="mt-8">
                <Button variant="primary" onClick={() => navigate('/app/skills')}>
                  Back to Skill Tree
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonPage;
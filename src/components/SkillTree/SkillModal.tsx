import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Trophy, BrainCircuit, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSkillLessons } from '../../hooks/useSkillTree';
import { useAuth } from '../../contexts/AuthContext';
import { SkillTreeService, Exercise, Lesson, UserLessonCompletion, ExerciseAttempt } from '../../services/skillTreeService';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

interface SkillModalProps {
  skill: Skill;
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
}

const SkillModal: React.FC<SkillModalProps> = ({ skill, isOpen, onClose, isUnlocked }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lessons, loading: lessonsLoading } = useSkillLessons(skill.category_id, skill.id, isUnlocked);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchInitialData = async () => {
      if (user?.uid && isUnlocked) {
        const [lessonCompletions, exerciseAttempts] = await Promise.all([
          SkillTreeService.getUserLessonCompletions(user.uid),
          SkillTreeService.getUserExerciseAttempts(user.uid),
        ]);
        setCompletedLessons(new Set(lessonCompletions.map(c => c.lesson_id)));
        setCompletedExercises(new Set(exerciseAttempts.filter(a => a.is_correct).map(a => a.exercise_id)));
      }
    };
    fetchInitialData();
  }, [user?.uid, isUnlocked]);

  useEffect(() => {
    const fetchExercises = async () => {
      if (lessons.length > 0) {
        setLoadingExercises(true);
        const allExercises = await Promise.all(
          lessons.map(lesson => SkillTreeService.getLessonExercises(skill.category_id, skill.id, lesson.id))
        );
        setExercises(allExercises.flat());
        setLoadingExercises(false);
      }
    };
    fetchExercises();
  }, [lessons, skill.category_id, skill.id]);

  if (!isOpen) return null;

  const handleStartLesson = (lesson: Lesson) => {
    onClose();
    navigate(`/app/skills/${skill.id}/lessons/${lesson.id}`);
  };
  
  const handleStartExercise = (exercise: Exercise) => {
    onClose();
    navigate(`/app/skills/${skill.id}/lessons/${exercise.lesson_id}/exercises/${exercise.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold">{skill.name}</h2>
                <p className="text-primary-100">{skill.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {lessonsLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Lessons Column */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
                  Lessons
                </h3>
                {lessons.length === 0 ? (
                  <p className="text-gray-500 text-sm">No lessons available.</p>
                ) : (
                  <ul className="space-y-3">
                    {lessons.map((lesson, index) => (
                      <li key={lesson.id}>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-3"
                          onClick={() => handleStartLesson(lesson)}
                          disabled={!isUnlocked}
                        >
                          <div className="flex items-start">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm mr-3 flex-shrink-0">
                              {completedLessons.has(lesson.id) ? <CheckCircle className="w-5 h-5" /> : index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{lesson.title}</p>
                              <p className="text-xs text-gray-500">{lesson.estimated_duration} min</p>
                            </div>
                          </div>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Exercises Column */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BrainCircuit className="w-5 h-5 mr-2 text-secondary-600" />
                  Exercises
                </h3>
                {loadingExercises ? <LoadingSpinner /> : exercises.length === 0 ? (
                  <p className="text-gray-500 text-sm">No exercises available.</p>
                ) : (
                  <ul className="space-y-3">
                    {exercises.map(exercise => (
                      <li key={exercise.id}>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-3"
                          onClick={() => handleStartExercise(exercise)}
                          disabled={!isUnlocked}
                        >
                          <div className="flex items-start">
                            <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-600 font-semibold text-sm mr-3 flex-shrink-0">
                              {completedExercises.has(exercise.id) ? <CheckCircle className="w-5 h-5" /> : <Trophy className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{exercise.title}</p>
                              <p className="text-xs text-gray-500">{exercise.xp_reward} XP</p>
                            </div>
                          </div>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 text-right">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SkillModal;
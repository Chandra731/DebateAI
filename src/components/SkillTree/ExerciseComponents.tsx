import React, { useState } from 'react';
import Button from '../common/Button';

export const MCQExercise = ({ exercise, onSubmit, disabled, categoryId, skillId, lessonId }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSubmit = () => {
    if (selectedOption) {
      onSubmit({ selected_option: selectedOption }, categoryId, skillId, lessonId);
    }
  };

  return (
    <div>
      <p className="mb-4">{exercise.content.question}</p>
      <div className="space-y-2">
        {exercise.content.options.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedOption(option)}
            className={`w-full text-left p-2 border rounded-md ${
              selectedOption === option ? 'bg-blue-100' : ''
            }`}
            disabled={disabled}
          >
            {option}
          </button>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={!selectedOption || disabled} className="mt-4">
        Submit
      </Button>
    </div>
  );
};

export const TextInputExercise = ({ exercise, onSubmit, disabled, categoryId, skillId, lessonId }) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    onSubmit({ text }, categoryId, skillId, lessonId);
  };

  return (
    <div>
      <p className="mb-4">{exercise.content.prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 border rounded-md"
        disabled={disabled}
      />
      <Button onClick={handleSubmit} disabled={!text || disabled} className="mt-4">
        Submit
      </Button>
    </div>
  );
};

export const SpeechAnalysisExercise = ({ exercise, onSubmit, disabled, categoryId, skillId, lessonId }) => {
  // Implement speech analysis logic here
  return <div>Speech Analysis Exercise</div>;
};

export const DragAndDropExercise = ({ exercise, onSubmit, disabled, categoryId, skillId, lessonId }) => {
  // Implement drag and drop logic here
  return <div>Drag and Drop Exercise</div>;
};

export const FallacyIdentificationExercise = ({ exercise, onSubmit, disabled, categoryId, skillId, lessonId }) => {
  // Implement fallacy identification logic here
  return <div>Fallacy Identification Exercise</div>;
};

export const ExerciseFeedback = ({ feedback, onContinue, onRetry, canRetry }) => {
  return (
    <div className={`p-4 rounded-md ${feedback.verdict === 'correct' ? 'bg-green-100' : 'bg-red-100'}`}>
      <h3 className="font-bold">{feedback.verdict}</h3>
      <p>{feedback.explanation}</p>
      {feedback.improvement_advice && (
        <ul className="list-disc list-inside mt-2">
          {feedback.improvement_advice.map((advice, index) => (
            <li key={index}>{advice}</li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <Button onClick={onContinue}>Continue</Button>
        {canRetry && <Button onClick={onRetry} className="ml-2">Retry</Button>}
      </div>
    </div>
  );
};
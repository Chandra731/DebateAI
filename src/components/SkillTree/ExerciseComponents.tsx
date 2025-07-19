import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Mic, MicOff, Play, Pause, RotateCcw, GripVertical } from 'lucide-react';
import Button from '../common/Button';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Multiple Choice Question Component
export const MCQExercise: React.FC<{
  exercise: any;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}> = ({ exercise, onSubmit, disabled = false }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selectedOption !== null) {
      const selectedText = exercise.content.options[selectedOption];
      onSubmit({ selected_option: selectedText });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
      <p className="text-gray-700">{exercise.content.question}</p>
      
      <div className="space-y-3">
        {exercise.content.options.map((option: string, index: number) => (
          <motion.button
            key={index}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={() => !disabled && setSelectedOption(index)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedOption === index
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={disabled}
          >
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                selectedOption === index
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {selectedOption === index && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
              <span className="ml-2">{option}</span>
            </div>
          </motion.button>
        ))}
      </div>

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={selectedOption === null || disabled}
        className="w-full"
      >
        Submit Answer
      </Button>
    </div>
  );
};

// Text Input Exercise Component
export const TextInputExercise: React.FC<{
  exercise: any;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}> = ({ exercise, onSubmit, disabled = false }) => {
  const [text, setText] = useState('');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [text]);

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit({ text: text.trim() });
    }
  };

  const isOverLimit = exercise.content.word_limit && wordCount > exercise.content.word_limit;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
      <p className="text-gray-700">{exercise.content.prompt}</p>
      
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your response here..."
          className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          disabled={disabled}
        />
        
        <div className="flex justify-between text-sm">
          <span className={`${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
            {wordCount} words
            {exercise.content.word_limit && ` / ${exercise.content.word_limit} max`}
          </span>
          {exercise.content.structure_required && (
            <span className="text-gray-500">
              Include: Claim, Evidence, Reasoning
            </span>
          )}
        </div>
      </div>

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!text.trim() || isOverLimit || disabled}
        className="w-full"
      >
        Submit Response
      </Button>
    </div>
  );
};

// Speech Analysis Exercise Component
export const SpeechAnalysisExercise: React.FC<{
  exercise: any;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}> = ({ exercise, onSubmit, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleSubmit = () => {
    if (audioBlob) {
      // In a real implementation, you would upload the audio and get analysis
      onSubmit({
        audio_duration: recordingTime,
        audio_data: 'mock_audio_data', // Would be actual audio data
        practice_text: exercise.content.text
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
      
      {/* Practice Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Practice Text:</h4>
        <p className="text-gray-700 leading-relaxed">{exercise.content.text}</p>
      </div>

      {/* Focus Areas */}
      {exercise.content.focus_areas && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Focus on:</h4>
          <div className="flex flex-wrap gap-2">
            {exercise.content.focus_areas.map((area: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recording Interface */}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        {!audioBlob ? (
          <div className="space-y-4">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-primary-500'
            }`}>
              {isRecording ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {isRecording ? 'Recording...' : 'Ready to Record'}
              </h4>
              <p className="text-gray-600">
                {isRecording 
                  ? `Recording time: ${formatTime(recordingTime)}`
                  : 'Click the button below to start recording your speech'
                }
              </p>
            </div>

            <Button
              variant={isRecording ? "danger" : "primary"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
              size="lg"
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Recording Complete!</h4>
              <p className="text-gray-600">Duration: {formatTime(recordingTime)}</p>
            </div>

            {/* Audio Playback */}
            {audioUrl && (
              <audio controls className="mx-auto">
                <source src={audioUrl} type="audio/wav" />
                Your browser does not support audio playback.
              </audio>
            )}

            <div className="flex justify-center space-x-3">
              <Button
                variant="outline"
                onClick={resetRecording}
                icon={<RotateCcw className="w-4 h-4" />}
                disabled={disabled}
              >
                Record Again
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={disabled}
              >
                Submit Recording
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Drag and Drop Exercise Component
export const DragAndDropExercise: React.FC<{
  exercise: any;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}> = ({ exercise, onSubmit, disabled = false }) => {
  const [items, setItems] = useState(exercise.content.items);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    setItems(reorderedItems);
  };

  const handleSubmit = () => {
    onSubmit({ ordered_items: items.map((item: any) => item.id) });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
      <p className="text-gray-700">{exercise.content.prompt}</p>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              {items.map((item: any, index: number) => (
                <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={disabled}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex items-center p-4 rounded-lg border-2 transition-all
                        ${snapshot.isDragging ? 'border-primary-500 bg-primary-50 shadow-lg' : 'border-gray-300 bg-white'}
                        ${disabled ? 'opacity-60' : ''}`}
                    >
                      <GripVertical className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="flex-1 text-gray-800">{item.text}</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full"
      >
        Submit Order
      </Button>
    </div>
  );
};


// Fallacy Identification Exercise Component
export const FallacyIdentificationExercise: React.FC<{
  exercise: any;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}> = ({ exercise, onSubmit, disabled = false }) => {
  const [identifiedFallacies, setIdentifiedFallacies] = useState<Record<string, string>>({});

  const fallacyOptions = [
    'ad_hominem',
    'straw_man',
    'false_dichotomy',
    'appeal_to_authority',
    'slippery_slope',
    'circular_reasoning',
    'red_herring',
    'no_fallacy'
  ];

  const fallacyLabels: Record<string, string> = {
    ad_hominem: 'Ad Hominem',
    straw_man: 'Straw Man',
    false_dichotomy: 'False Dichotomy',
    appeal_to_authority: 'Appeal to Authority',
    slippery_slope: 'Slippery Slope',
    circular_reasoning: 'Circular Reasoning',
    red_herring: 'Red Herring',
    no_fallacy: 'No Fallacy'
  };

  const handleFallacySelect = (scenarioKey: string, fallacy: string) => {
    setIdentifiedFallacies(prev => ({
      ...prev,
      [scenarioKey]: fallacy
    }));
  };

  const handleSubmit = () => {
    onSubmit({ identified_fallacies: identifiedFallacies });
  };

  const allScenariosAnswered = exercise.content.scenarios.every((_: any, index: number) =>
    identifiedFallacies[`scenario_${index + 1}`]
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
      <p className="text-gray-700">
        Read each scenario and identify the logical fallacy present, or select `&quot;`No Fallacy`&quot;` if the reasoning is sound.
      </p>

      <div className="space-y-6">
        {exercise.content.scenarios.map((scenario: any, index: number) => {
          const scenarioKey = `scenario_${index + 1}`;
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Scenario {index + 1}
              </h4>
              <div className="bg-gray-50 border-l-4 border-primary-500 p-4 mb-4">
                <p className="text-gray-700 italic">"{scenario.text}"</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {fallacyOptions.map((fallacy) => (
                  <button
                    key={fallacy}
                    onClick={() => handleFallacySelect(scenarioKey, fallacy)}
                    className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                      identifiedFallacies[scenarioKey] === fallacy
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={disabled}
                  >
                    {fallacyLabels[fallacy]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!allScenariosAnswered || disabled}
        className="w-full"
      >
        Submit Identifications
      </Button>
    </div>
  );
};

// Exercise Feedback Component
export const ExerciseFeedback: React.FC<{
  feedback: any;
  onContinue: () => void;
  onRetry?: () => void;
  canRetry?: boolean;
  isMastered?: boolean;
}> = ({ feedback, onContinue, onRetry, canRetry = false, isMastered = false }) => {
  const [currentMiniLesson, setCurrentMiniLesson] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(null);

  const handleQuizSubmit = () => {
    if (selectedOption === feedback.mini_lessons[currentMiniLesson].quiz.correct_answer) {
      setQuizResult('correct');
    } else {
      setQuizResult('incorrect');
    }
  };

  const handleFinish = () => {
    onContinue();
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'correct': return 'text-green-700 bg-green-50 border-green-200';
      case 'partial': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'incorrect': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getVerdictIcon = (verdict: 'correct' | 'partial' | 'incorrect') => {
    switch (verdict) {
      case 'correct': return <Check className="w-6 h-6 text-green-600" />;
      case 'partial': return <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">!</div>;
      case 'incorrect': return <X className="w-6 h-6 text-red-600" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 rounded-lg p-6 ${getVerdictColor(feedback.verdict)}`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getVerdictIcon(feedback.verdict)}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            {isMastered ? 'Skill Mastered!' : feedback.verdict === 'correct' ? 'Excellent Work!' : 'Keep Practicing!'}
          </h3>
          
          <p className="mb-4">{feedback.explanation}</p>
          
          {/* ... (rest of the component is the same) ... */}

          <div className="mt-6 flex space-x-3">
            {canRetry && onRetry && !isMastered && (
              <Button variant="outline" onClick={onRetry}>
                Try Again
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleFinish}
            >
              {isMastered ? 'Back to Skill Tree' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
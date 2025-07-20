import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTopics, useProfile } from '../hooks/useDatabase';
import { getAiOpponentProfile } from '../config/aiOpponents';
import { GroqService } from '../services/groqService';
import { DatabaseService } from '../services/database';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Brain,
  AlertCircle
} from 'lucide-react';

const LiveDebatePage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [debateStarted, setDebateStarted] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'ai'>('user');
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes
  const [transcript, setTranscript] = useState<Array<{speaker: string, text: string, timestamp: string}>>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [userSide, setUserSide] = useState<'pro' | 'con' | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const [microphonePermission, setMicrophonePermission] = useState<boolean | null>(null);
  
  const [debateId, setDebateId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const debateFormats = [
    { name: 'Parliamentary', duration: '3 min speeches', description: 'Classic format with PM, LO, DPM, DLO roles' },
    { name: 'Oxford Style', duration: '5 min speeches', description: 'Opening statements followed by rebuttals' },
    { name: 'Quick Practice', duration: '2 min speeches', description: 'Fast-paced practice rounds' }
  ];

  const navigate = useNavigate();
  const { topics, loading: topicsLoading } = useTopics();
  const { profile } = useProfile();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const aiOpponent = profile ? getAiOpponentProfile(profile.level || 1) : getAiOpponentProfile(1);

  useEffect(() => {
    if (!topicsLoading && topics.length > 0 && !selectedTopic) {
      setSelectedTopic(topics[0]);
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || (window as Window & typeof globalThis).webkitSpeechRecognition;
    if (SpeechRecognition) {
      // Request microphone permission
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          setMicrophonePermission(true);
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              } 
            }
            finalTranscriptRef.current = finalTranscript;
          };

          recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            setIsRecording(false);
            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
              setMicrophonePermission(false);
            }
          };

          recognition.onend = () => {
          };

          recognitionRef.current = recognition;
        })
        .catch((error) => {
          setMicrophonePermission(false);
        });
    } else {
      setMicrophonePermission(false); // Treat as not allowed if API not supported
      // Optionally, show a message to the user
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [topics, topicsLoading]);
  const [selectedFormat, setSelectedFormat] = useState(debateFormats[0]);

  useEffect(() => {
    if (debateStarted && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      handleSpeechEnd();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [debateStarted, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const debateRounds = [
    { name: 'Opening Statement', speaker: 'user', duration: 180 },
    { name: 'Opening Statement', speaker: 'ai', duration: 180 },
    { name: 'Rebuttal', speaker: 'user', duration: 120 },
    { name: 'Rebuttal', speaker: 'ai', duration: 120 },
    { name: 'Closing Statement', speaker: 'user', duration: 90 },
    { name: 'Closing Statement', speaker: 'ai', duration: 90 },
  ];

  const startDebate = async () => {
    if (!user?.uid || !selectedTopic || !userSide) return; // Ensure user is logged in and topic/side selected

    const newDebate = await DatabaseService.createDebate({
      user_id: user.uid, 
      topic_id: selectedTopic.id,
      topic_title: selectedTopic.title,
      user_side: userSide,
      format: selectedFormat.name,
      status: 'active',
      transcript: [],
    });
    setDebateId(newDebate.id);
    setDebateStarted(true);
    setCurrentSpeaker(debateRounds[0].speaker);
    setTimeRemaining(debateRounds[0].duration);
    setTranscript([]);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      finalTranscriptRef.current = ''; // Clear previous transcript
      if (recognitionRef.current) {
        recognitionRef.current.start();
        console.log("Speech recognition started.");
      }
    } else {
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        console.log("Speech recognition stopped.");
      }
      const userSpeech = finalTranscriptRef.current.trim();
      if (userSpeech) {
        setTranscript(prev => [...prev, {
          speaker: 'You',
          text: userSpeech,
          timestamp: new Date().toLocaleTimeString()
        }]);
        handleSpeechEnd(userSpeech); // Pass the recognized speech to handleSpeechEnd
      } else {
        console.log("No speech detected.");
        // Optionally, show a message to the user that no speech was detected
      }
    }
  };

  const handleSpeechEnd = async (userSpeech?: string) => {
    setIsRecording(false);
    setAiThinking(true);
    
    const debateContext = transcript.map(entry => `${entry.speaker}: ${entry.text}`).join('\n');

    const aiSide = userSide === 'pro' ? 'con' : 'pro';
    const systemPrompt = `You are an AI debate opponent. Your goal is to engage in a constructive debate on the given topic.\n    - Your assigned side is ${aiSide.toUpperCase()}.\n    - The user's assigned side is ${userSide?.toUpperCase()}.\n    - Respond directly to the user's last point.\n    - Maintain a respectful but firm tone.\n    - Use logical arguments and evidence (even if simulated).\n    - Keep your responses concise and to the point, suitable for a debate round.\n    - Do not introduce new topics unless necessary for rebuttal.\n    - Argue from your assigned side (${aiSide.toUpperCase()}).`;

    const prompt = `Debate Topic: "${selectedTopic?.title || 'General Debate Topic'}"\n    Your Side: ${userSide?.toUpperCase()}\n    AI Opponent Side: ${aiSide.toUpperCase()}\n    Debate History:\n${debateContext}\n    User's last statement: "${userSpeech}"\n\n    Your turn to speak. Respond to the user's last statement from your assigned side.`;

    try {
      const aiResponse = await GroqService.getCompletion(prompt, systemPrompt);
      
      setTranscript(prev => [...prev, {
        speaker: 'AI Opponent',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      setCurrentSpeaker(currentSpeaker === 'user' ? 'ai' : 'user');
      setTimeRemaining(180); // Reset timer for next speaker
    } catch (error) {
      console.error('Error getting AI response:', error);
      setTranscript(prev => [...prev, {
        speaker: 'AI Opponent',
        text: 'I am having trouble generating a response right now. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setAiThinking(false);
    }
  };

  const endDebate = async () => {
    if (debateId) {
      // Determine winner based on some logic (e.g., AI evaluation, user input)
      // For now, let's assume user wins for demonstration purposes
      const finalWinner = 'user'; 

      await DatabaseService.saveDebate(debateId, {
        status: 'completed',
        transcript: transcript,
        winner: finalWinner,
        // Add user_score, ai_score, and feedback here if available from AI evaluation
      });
      navigate(`/app/debate-results/${debateId}`);
    }
    setDebateStarted(false);
    setIsRecording(false);
    setTimeRemaining(180);
    // Navigate to results/scoring page
  };

  if (!debateStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Debate Arena</h1>
              <p className="text-gray-600">Practice with AI opponents in real-time</p>
            </div>
          </div>
        </div>

        {/* Setup */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Topic</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Topic
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    setSelectedTopic({ id: 'custom', title: e.target.value, category: 'Custom', difficulty_level: 'N/A' });
                  }}
                  placeholder="Enter your debate motion..."
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Topics
              </label>
              {topicsLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                topics.map((topic: Topic) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setCustomTopic('');
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTopic?.id === topic.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{topic.title}</div>
                    <div className="text-sm text-gray-500">
                      {topic.category} • Level {topic.difficulty_level}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Debate Format</h2>
            <div className="space-y-3">
              {debateFormats.map((format, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedFormat(format)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedFormat.name === format.name
                      ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{format.name}</div>
                  <div className="text-sm text-gray-500">{format.duration} • {format.description}</div>
                </button>
              ))}
            </div>
          </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Side</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setUserSide('pro')}
                className={`p-4 rounded-lg border text-center transition-colors ${
                  userSide === 'pro'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">Pro/For</div>
                <div className="text-sm text-gray-500">Argue for the motion</div>
              </button>
              <button
                onClick={() => setUserSide('con')}
                className={`p-4 rounded-lg border text-center transition-colors ${
                  userSide === 'con'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">Con/Against</div>
                <div className="text-sm text-gray-500">Argue against the motion</div>
              </button>
            </div>
          </div>
        </div>

        {/* AI Opponent Preview */}
        <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-xl p-6 border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your AI Opponent</h3>
              <p className="text-gray-600">{aiOpponent.level} • Specializes in {aiOpponent.specialization}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>🏆 Win Rate: {aiOpponent.winRate}</span>
                <span>🎯 Argument Strength: {aiOpponent.argumentStrength}</span>
                <span>⚡ Response Speed: {aiOpponent.responseSpeed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={startDebate}
            disabled={!selectedTopic || !userSide || microphonePermission === false || microphonePermission === null}
            className="bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors text-lg font-semibold flex items-center space-x-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6" />
            <span>Start Debate</span>
          </button>
          {microphonePermission === false && (
            <p className="text-red-500 text-sm mt-2">
              Microphone access denied. Please enable it in your browser settings to start the debate.
            </p>
          )}
          {microphonePermission === null && (
            <p className="text-gray-500 text-sm mt-2">
              Awaiting microphone permission...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Debate Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{selectedTopic?.title}</h1>
            <p className="text-gray-600">{selectedFormat.name} Format</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{formatTime(timeRemaining)}</div>
              <div className="text-sm text-gray-500">Time Remaining</div>
            </div>
            <button
              onClick={endDebate}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Square className="w-4 h-4" />
              <span>End Debate</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Debate Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Speaker */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Current Speaker: {currentSpeaker === 'user' ? 'You' : 'AI Opponent'}
              </h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentSpeaker === 'user' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-secondary-100 text-secondary-700'
              }`}>
                {currentSpeaker === 'user' ? 'Your Turn' : 'AI Speaking'}
              </div>
            </div>

            {currentSpeaker === 'user' ? (
              <div className="text-center py-8">
                <button
                  onClick={toggleRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-primary-500 hover:bg-primary-600'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-10 h-10 text-white" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </button>
                <p className="text-gray-600">
                  {isRecording ? 'Recording your speech...' : 'Click to start speaking'}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                {aiThinking ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
                    <span className="text-gray-600">AI is formulating response...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <Volume2 className="w-8 h-8 text-secondary-500" />
                    <span className="text-gray-600">AI is speaking...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transcript */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Debate Transcript</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {transcript.map((entry, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  entry.speaker === 'You' ? 'bg-primary-50 border-l-4 border-primary-500' : 'bg-secondary-50 border-l-4 border-secondary-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{entry.speaker}</span>
                    <span className="text-sm text-gray-500">{entry.timestamp}</span>
                  </div>
                  <p className="text-gray-700">{entry.text}</p>
                </div>
              ))}
              {transcript.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Transcript will appear here as you debate...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Controls</h3>
            <div className="space-y-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                  isMuted ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isMuted ? 'Unmute' : 'Mute'} Audio</span>
              </button>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-xl p-6 border border-accent-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Structure your arguments with clear claim-warrant-impact</span>
              </div>
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Listen carefully to opponent&apos;s arguments for rebuttals</span>
              </div>
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Use examples and evidence to support your points</span>
              </div>
            </div>
          </div>

          {/* Score Preview */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Scoring</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Matter</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Manner</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-secondary-500 h-2 rounded-full" style={{width: '80%'}}></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Method</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-accent-500 h-2 rounded-full" style={{width: '70%'}}></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Scores update after each speech</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDebatePage;

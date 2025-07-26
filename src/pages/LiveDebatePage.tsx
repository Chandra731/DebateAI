import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTopics, useProfile } from '../hooks/useDatabase';
import { useAuth } from '../contexts/AuthContext';
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
import { useNewSpeechRecognition } from "@/hooks/useNewSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { DebateEvaluationResult } from '../types';
import { useQueryClient } from 'react-query';
interface Topic {
  id: string;
  title: string;
  category: string;
  difficulty_level: string;
}

const LiveDebatePage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [debateStarted, setDebateStarted] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'ai'>('user');
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes
  const [transcript, setTranscript] = useState<Array<{ speaker: string, text: string, timestamp: string }>>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [userSide, setUserSide] = useState<'pro' | 'con' | null>(null);
  const [aiOpponent, setAiOpponent] = useState<any>(null);
  const [textInput, setTextInput] = useState(''); // For hybrid input
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  const [debateId, setDebateId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const debateFormats = [
    { name: 'Parliamentary', duration: '3 min speeches', description: 'Classic format with PM, LO, DPM, DLO roles' },
    { name: 'Oxford Style', duration: '5 min speeches', description: 'Opening statements followed by rebuttals' },
    { name: 'Quick Practice', duration: '2 min speeches', description: 'Fast-paced practice rounds' }
  ];
  const { topics = [], loading: topicsLoading } = useTopics();
  const { profile, refetch: refetchProfile } = useProfile(); // Get refetch from useProfile
  const { user } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // New hooks for speech recognition and text-to-speech
  const { transcript: speechTranscript, isListening, error: speechError, start, stop, isSupported } =
    useNewSpeechRecognition({
      onResult: (result) => {
        setTextInput(result); // Update text input with speech transcript
      },
      silenceTimeout: 3000, // Stop listening after 3 seconds of silence
    });
  const { speak, cancel: cancelSpeech, isSpeaking } = useTextToSpeech();

  useEffect(() => {
    if (profile) {
      setAiOpponent(getAiOpponentProfile(profile.level || 1));
    }
  }, [profile]);

  useEffect(() => {
    if (!topicsLoading && topics.length > 0 && !selectedTopic) {
      setSelectedTopic(topics[0]);
    }
  }, [topics, topicsLoading, selectedTopic]);

  const [selectedFormat, setSelectedFormat] = useState(debateFormats[0]);

  const debateRounds = [
    { name: 'Opening Statement', speaker: 'user', duration: 180, maxTokens: 350 },
    { name: 'Opening Statement', speaker: 'ai', duration: 180, maxTokens: 350 },
    { name: 'Rebuttal', speaker: 'user', duration: 120, maxTokens: 300 },
    { name: 'Rebuttal', speaker: 'ai', duration: 120, maxTokens: 300 },
    { name: 'Closing Statement', speaker: 'user', duration: 90, maxTokens: 250 },
    { name: 'Closing Statement', speaker: 'ai', duration: 90, maxTokens: 250 },
  ];

  const endDebate = async () => {
    if (debateId && selectedTopic && userSide) {
      setAiThinking(true);
      cancelSpeech(); // Stop any ongoing AI speech

      const aiSide = userSide === 'pro' ? 'con' : 'pro';
      let evaluation: DebateEvaluationResult | null = null;
      try {
        evaluation = await GroqService.evaluateDebate(
          transcript,
          selectedTopic.title,
          userSide,
          aiSide
        );
        // Add a simple validation check
        if (typeof evaluation?.user_score?.overall !== 'number') {
          throw new Error("Received malformed evaluation from AI service.");
        }
      } catch (evalError) {
        console.error("Error during AI debate evaluation:", evalError);
        // Fallback if evaluation fails
        evaluation = {
          user_score: { matter: 0, manner: 0, method: 0, overall: 0 },
          ai_score: { matter: 0, manner: 0, method: 0, overall: 0 },
          feedback: {
            strengths: "Could not generate detailed feedback.",
            improvements: "The AI evaluation service failed to return a valid analysis. Please try again later.",
            specific_examples: [],
          },
          winner: 'tie',
          explanation: "Evaluation failed due to a server or AI error.",
        };
      }


      await DatabaseService.saveDebate(debateId, {
        status: 'completed',
        transcript: transcript,
        winner: evaluation?.winner || 'tie',
        user_score: evaluation?.user_score || 0,
        ai_score: evaluation?.ai_score || 0,
        feedback: evaluation?.feedback || {},
        winner_side: evaluation?.winner === 'user' ? userSide : (evaluation?.winner === 'ai' ? aiSide : null),
      });
      
      // Invalidate queries to trigger refetching on other pages
      queryClient.invalidateQueries(['profile', user?.uid]);
      queryClient.invalidateQueries(['userDebates', user?.uid]);

      navigate(`/app/debate-results/${debateId}`);
    }
    setDebateStarted(false);
    setIsRecording(false);
    setTimeRemaining(180);
  };

  const handleSpeechEnd = useCallback(async (userSpeech?: string) => {
    setIsRecording(false);
    stop(); // Ensure speech recognition is stopped

    const finalUserSpeech = userSpeech || textInput.trim();

    if (!finalUserSpeech && currentSpeaker === 'user') {
      console.log("No speech or text detected from user.");
      // Advance turn if user says nothing
      const nextRoundIndex = currentRoundIndex + 1;
      if (nextRoundIndex < debateRounds.length) {
        setCurrentRoundIndex(nextRoundIndex);
        setCurrentSpeaker(debateRounds[nextRoundIndex].speaker);
        setTimeRemaining(debateRounds[nextRoundIndex].duration);
      } else {
        await endDebate();
      }
      return;
    }

    const newTranscript = [...transcript, {
      speaker: 'You',
      text: finalUserSpeech,
      timestamp: new Date().toLocaleTimeString()
    }];
    
    if (currentSpeaker === 'user') {
      setTranscript(newTranscript);
      setTextInput('');
    }

    setAiThinking(true);
    cancelSpeech();

    const debateContext = newTranscript.map(entry => `${entry.speaker}: ${entry.text}`).join('\n');
    const aiSide = userSide === 'pro' ? 'con' : 'pro';
    const currentRound = debateRounds[currentRoundIndex + 1] || debateRounds[debateRounds.length - 1];

    const systemPrompt = `You are a skilled AI debate opponent named 'DebateVerse AI'. You must argue strictly from the ${aiSide.toUpperCase()} side of the motion.\nThe debate topic is: "${selectedTopic?.title}".\nMy side is ${userSide?.toUpperCase()}. Your side is ${aiSide.toUpperCase()}.\nThe current round is: ${currentRound.name}.\nYour response must be concise, directly addressing my last point, and stay within the token limit for this round (${currentRound.maxTokens} tokens).\n**Crucially, do NOT repeat your previous arguments. You must introduce new points or build directly on my last statement.** Do not act as an assistant; act as a debater.`

    const prompt = `Here is the debate history so far:\n${debateContext}\n\nMy last statement was: "${finalUserSpeech}"\n\nNow, it is your turn. As the ${aiSide.toUpperCase()} speaker, deliver your response. Do not repeat yourself.`

    // Add a placeholder for the AI's response
    setTranscript(prev => [...prev, { speaker: 'AI Opponent', text: '...', timestamp: new Date().toLocaleTimeString() }]);

    try {
      let fullAiResponse = "";
      await GroqService.streamCompletion(
        prompt,
        (chunk) => {
          fullAiResponse += chunk;
          setTranscript((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.speaker === 'AI Opponent') {
              return [...prev.slice(0, -1), { ...lastMessage, text: fullAiResponse }];
            }
            return prev;
          });
        },
        currentRound.maxTokens,
        systemPrompt
      );

      if (!isMuted) {
        speak(fullAiResponse);
      }

      const nextRoundIndex = currentRoundIndex + 1;
      if (nextRoundIndex < debateRounds.length) {
        setCurrentRoundIndex(nextRoundIndex);
        setCurrentSpeaker(debateRounds[nextRoundIndex].speaker);
        setTimeRemaining(debateRounds[nextRoundIndex].duration);
      } else {
        await endDebate();
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      setTranscript(prev => [...prev.slice(0, -1), {
        speaker: 'AI Opponent',
        text: 'I am having trouble generating a response right now. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setAiThinking(false);
    }
  }, [currentRoundIndex, currentSpeaker, debateRounds, userSide, selectedTopic, transcript, textInput, speak, cancelSpeech, endDebate, stop, isMuted]);

  useEffect(() => {
    if (debateStarted && timeRemaining > 0 && currentSpeaker !== 'ai') { // Only countdown for user's turn
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && currentSpeaker === 'user') { // Only trigger handleSpeechEnd if user's turn ends
      handleSpeechEnd(); // User's time is up
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [debateStarted, timeRemaining, currentSpeaker, handleSpeechEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startDebate = async () => {
    if (!user?.uid || !selectedTopic || !userSide) return;

    const newDebate = await DatabaseService.createDebate({
      user_id: user.uid,
      topic_id: selectedTopic.id,
      topic_title: selectedTopic.title,
      user_side: userSide,
      format: selectedFormat.name,
      status: 'active',
      transcript: [],
    });

    if (!newDebate) {
      // Handle error case where debate creation fails
      console.error("Failed to create debate in the database.");
      return;
    }

    setDebateId(newDebate.id);
    setDebateStarted(true);
    setCurrentRoundIndex(0);
    setCurrentSpeaker(debateRounds[0].speaker);
    setTimeRemaining(debateRounds[0].duration);
    setTranscript([]);
    
    // If user is 'pro', AI is 'con', and vice-versa.
    const aiSide = userSide === 'pro' ? 'con' : 'pro';
    const openingRound = debateRounds[0];

    // The user speaks first in this setup.
    // No initial AI message needed, the flow will be handled by the user's first turn.
    // The UI will prompt the user to begin their opening statement.
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTextInput(''); // Clear text input when starting recording
      start(); // Start speech recognition
    } else {
      setIsRecording(false);
      stop(); // Stop speech recognition
      handleSpeechEnd(speechTranscript); // Pass the recognized speech to handleSpeechEnd
    }
  };

  // Handle text input changes
  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    if (isListening) {
      stop(); // Stop speech recognition if user starts typing
      setIsRecording(false);
    }
  };

  // Handle sending text input on Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSpeechEnd(); // Use handleSpeechEnd for sending text as well
    }
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
              <div className="max-h-[10rem] overflow-y-auto pr-2"> 
                {topicsLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  topics && topics.length > 0 ? (
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
                        } mb-2`}
                      >
                        <div className="font-medium">{topic.title}</div>
                        <div className="text-sm text-gray-500">
                          {topic.category} • Level {String(topic.difficulty_level)}
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">No topics found. Please try again later.</p>
                  )
                )}
              </div>
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
        {user && profile && aiOpponent && (
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
        )}

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={startDebate}
            disabled={!user?.uid || !selectedTopic || !userSide || !isSupported} // Check isSupported for mic
            className="bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors text-lg font-semibold flex items-center space-x-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6" />
            <span>Start Debate</span>
          </button>
          {!isSupported && (
            <p className="text-red-500 text-sm mt-2">
              Speech recognition not supported in your browser. Please use text input.
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
                  disabled={!isSupported || aiThinking} // Disable if not supported or AI is thinking
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
                {speechError && <p className="text-red-500 text-sm mt-2">Microphone Error: {speechError}</p>}
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

            {/* Hybrid Input Textarea */}
            <div className="mt-4">
              <textarea
                value={textInput}
                onChange={handleTextInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your argument here..." 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                rows={4}
                disabled={isRecording || aiThinking} // Disable if recording or AI is thinking
              />
              <button
                onClick={() => handleSpeechEnd()} // Send text input
                disabled={!textInput.trim() || isRecording || aiThinking} // Disable if no text, recording, or AI is thinking
                className="mt-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors float-right"
              >
                Send Argument
              </button>
            </div>

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
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Manner</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-secondary-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Method</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-accent-500 h-2 rounded-full" style={{ width: '70%' }}></div>
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
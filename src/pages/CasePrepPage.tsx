import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Search, BookOpen, Target, Shield, Lightbulb, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { useTopics, useUserCases } from '../hooks/useDatabase';
import { useNotification } from '../contexts/NotificationContext';
import { GroqService } from '../services/groqService';


const CasePrepPage: React.FC = () => {
  const { user } = useAuth();
  const { topics, loading: topicsLoading } = useTopics();
  const { cases: userCases, loading: casesLoading } = useUserCases();
  const { showNotification } = useNotification();
  
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);
  const [customTopic, setCustomTopic] = useState('');

  console.log('Button disabled state check:', {
    selectedTopic,
    position,
    loading,
    isDisabled: !selectedTopic?.title || !position || loading
  });

  const handleTopicSelect = (topic: any) => {
    setSelectedTopic(topic);
    setCustomTopic('');
  };

  const handleCustomTopicChange = (value: string) => {
    setCustomTopic(value);
    setSelectedTopic({ id: '', title: value });
  };

  

  const handleGenerateCase = async () => {
    if (!selectedTopic?.title || !position || !user) return;
    
    setLoading(true);
    
    try {
      // Generate case data (mock for now - would use AI API)
      const prompt = `Generate a debate case for the topic "${selectedTopic.title}" from the "${position}" perspective.
      Provide the output as a JSON object with the following structure:
      {
        "framing": "string",
        "contentions": [
          {
            "title": "string",
            "description": "string",
            "evidence": "string"
          }
        ],
        "rebuttals": ["string"],
        "examples": ["string"],
        "burdenAnalysis": "string",
        "fallacyChecks": ["string"]
      }
      Ensure the contentions array has at least 3 items.
      Make sure the framing, contentions, rebuttals, examples, burdenAnalysis, and fallacyChecks are relevant to the topic and position.
      The language should be formal and suitable for a debate.`;

      const systemPrompt = "You are an expert debate coach AI. Your task is to generate comprehensive and well-structured debate cases based on user-provided topics and positions. Provide clear, concise, and persuasive arguments, rebuttals, and examples. The output must be a valid JSON object as specified by the user.";

      const aiResponse = await GroqService.getCompletion(prompt, systemPrompt);
      const jsonMatch = aiResponse.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in AI response.");
      }
      const jsonString = jsonMatch[0];
      const parsedCaseData = JSON.parse(jsonString);
      setCaseData(parsedCaseData);

      // Save case to database
      const caseToSave = {
        user_id: user.uid, // Use Firebase user ID
        topic_id: selectedTopic.id || null,
        topic_title: selectedTopic.title,
        side: position,
        framing: parsedCaseData.framing,
        contentions: parsedCaseData.contentions,
        rebuttals: parsedCaseData.rebuttals,
        examples: parsedCaseData.examples,
        burden_analysis: parsedCaseData.burdenAnalysis,
        fallacy_checks: parsedCaseData.fallacyChecks,
        created_at: new Date().toISOString() // Add timestamp
      };

      await DatabaseService.saveCase(caseToSave);

      showNotification({
        type: 'success',
        title: 'Case Generated!',
        message: 'Your debate case has been prepared and saved.'
      });

    } catch (error) {
      console.error('Error generating case:', error);
      showNotification({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate case. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewCase = (caseItem: any) => {
    setCaseData({
      framing: caseItem.framing,
      contentions: caseItem.contentions,
      rebuttals: caseItem.rebuttals,
      examples: caseItem.examples,
      burdenAnalysis: caseItem.burden_analysis,
      fallacyChecks: caseItem.fallacy_checks,
    });
    setSelectedTopic({ id: caseItem.topic_id, title: caseItem.topic_title });
    setPosition(caseItem.side);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Case Preparation</h1>
            <p className="text-gray-600">Get structured arguments, rebuttals, and strategic advice</p>
          </div>
        </div>
      </div>

      {/* Topic Selection */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Your Topic</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Topic
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => handleCustomTopicChange(e.target.value)}
                  placeholder="Enter your debate motion..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Topics
              </label>
              {topicsLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {topics.map((topic: any) => (
                    <button
                      key={topic.id}
                      onClick={() => handleTopicSelect(topic)}
                      className={`text-left p-3 rounded-lg border transition-colors ${
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
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Position
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPosition('pro')}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                    position === 'pro'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Pro/For</div>
                  <div className="text-sm text-gray-500">Support the motion</div>
                </button>
                <button
                  onClick={() => setPosition('con')}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                    position === 'con'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Con/Against</div>
                  <div className="text-sm text-gray-500">Oppose the motion</div>
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerateCase}
              disabled={!selectedTopic?.title || !position || loading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Case...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate AI Case</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Case */}
          {caseData && (
            <div className="space-y-6">
              {/* Framing */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-4">
                  <Target className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Framing</h3>
                </div>
                <p className="text-gray-700">{caseData.framing}</p>
              </div>

              {/* Contentions */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="w-5 h-5 text-secondary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Main Arguments</h3>
                </div>
                <div className="space-y-4">
                  {caseData.contentions.map((contention: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {index + 1}. {contention.title}
                      </h4>
                      <p className="text-gray-700 mb-2">{contention.description}</p>
                      <p className="text-sm text-gray-600">
                        <strong>Evidence:</strong> {contention.evidence}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rebuttals */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="w-5 h-5 text-accent-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Rebuttals</h3>
                </div>
                <ul className="space-y-2">
                  {caseData.rebuttals.map((rebuttal: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-accent-100 text-accent-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{rebuttal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Examples & Evidence */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Examples & Evidence</h3>
                </div>
                <ul className="space-y-2">
                  {caseData.examples.map((example: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2"></span>
                      <span className="text-gray-700">{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Cases</h3>
            {casesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {userCases.map((caseItem: any) => (
                  <button
                    key={caseItem.id}
                    onClick={() => handleViewCase(caseItem)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">{caseItem.topic_title}</div>
                    <div className="text-sm text-gray-500">
                      {caseItem.side === 'pro' ? 'For' : 'Against'} • {new Date(caseItem.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
                {userCases.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">You have no saved cases.</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Prep Tips</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Define Key Terms</div>
                  <div className="text-sm text-gray-600">Establish clear definitions for ambiguous words</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Structure Arguments</div>
                  <div className="text-sm text-gray-600">Use claim, warrant, impact format</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Anticipate Opposition</div>
                  <div className="text-sm text-gray-600">Prepare responses to likely counter-arguments</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need More Help?</h3>
            <p className="text-gray-600 text-sm mb-4">
              Join a live practice session with our AI coach for personalized feedback.
            </p>
            <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
              Start Live Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasePrepPage;
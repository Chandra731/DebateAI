import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { DatabaseService } from '../services/database';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { Trophy, Brain, BarChart2 } from 'lucide-react';
import { Debate } from '../types';

const DebateResultsPage: React.FC = () => {
  const { debateId } = useParams<{ debateId: string }>();
  
  const { data: debate, isLoading: loading, error } = useQuery<Debate | null>(
    ['debate', debateId],
    () => {
      if (!debateId) return null;
      return DatabaseService.getDebate(debateId);
    },
    {
      enabled: !!debateId,
    }
  );

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
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Results</h3>
        <p className="text-red-600">{error}</p>
        <Link to="/app/dashboard">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const renderScore = (score: any, title: string, color: 'green' | 'red') => {
    const isDetailed = typeof score === 'object' && score !== null && 'overall' in score;
    const overallScore = isDetailed ? score.overall : score;

    return (
      <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
        <h3 className={`font-semibold text-${color}-800`}>{title}</h3>
        <p className="text-3xl font-bold">{(overallScore || 0).toFixed(1)}</p>
        {isDetailed && (
          <div className="text-xs text-gray-600 mt-2 space-y-1">
            <div>Matter: {score.matter || 0}</div>
            <div>Manner: {score.manner || 0}</div>
            <div>Method: {score.method || 0}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Debate Results</h1>
        <p className="text-gray-600">Topic: {debate.topic_title}</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
          Winner: <span className="capitalize">{debate.winner_side || debate.winner}</span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {renderScore(debate.user_score, 'Your Score', 'green')}
          {renderScore(debate.ai_score, 'AI Score', 'red')}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Feedback</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold flex items-center"><BarChart2 className="mr-2" />Strengths</h3>
            <p className="text-gray-700">{debate.feedback?.strengths || 'No specific strengths were provided.'}</p>
          </div>
          <div>
            <h3 className="font-semibold flex items-center"><Brain className="mr-2" />Areas for Improvement</h3>
            <p className="text-gray-700">{debate.feedback?.improvements || 'No specific areas for improvement were provided.'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Transcript</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {debate.transcript.map((entry: { speaker: string; text: string; timestamp: string }, index: number) => (
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
        </div>
      </div>

      <div className="text-center">
        <Link to="/app/live-debate">
          <Button>Start a New Debate</Button>
        </Link>
      </div>
    </div>
  );
};

export default DebateResultsPage;

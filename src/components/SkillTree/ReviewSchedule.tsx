import React from 'react';
import { useQuery } from 'react-query';
import { SkillTreeService } from '../../services/skillTreeService';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

const ReviewSchedule: React.FC = () => {
  const { user } = useAuth();
  const { data: reviewItems, isLoading, error } = useQuery(
    ['reviewSchedule', user?.uid],
    () => SkillTreeService.getUserReviewSchedule(user!.uid),
    {
      enabled: !!user?.uid,
    }
  );

  if (isLoading) {
    return <div>Loading review schedule...</div>;
  }

  if (error) {
    return <div>Error loading review schedule.</div>;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mt-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
        <Clock className="w-6 h-6 mr-2 text-primary-500" />
        Review Schedule
      </h3>
      {reviewItems && reviewItems.length > 0 ? (
        <ul className="space-y-4">
          {reviewItems.map((item) => (
            <li key={item.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Link to={`/app/skills/${item.skill_id}`} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg text-gray-800">{item.skill_name}</p>
                  <p className="text-sm text-gray-500">Due for review</p>
                </div>
                <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                  Review Now
                </button>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No items due for review. Great job!</p>
      )}
    </div>
  );
};

export default ReviewSchedule;

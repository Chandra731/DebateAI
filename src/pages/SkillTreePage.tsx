import React from 'react';
import SkillTreeView from '../components/SkillTree/SkillTreeView';
import ReviewSchedule from '../components/SkillTree/ReviewSchedule';
import SEO from '../components/common/SEO';

import { TreePine } from 'lucide-react';

const SkillTreePage: React.FC = () => {
  return (
    <>
      <SEO
        title="Skill Tree - Progressive Learning"
        description="Master debate skills step by step with our interactive skill tree. Unlock new abilities as you progress through structured lessons and exercises."
        keywords="skill tree, progressive learning, debate skills, interactive lessons, gamified learning"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <TreePine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Learning Path</h1>
              <p className="text-gray-600">Unlock new skills and master the art of debate.</p>
            </div>
          </div>
        </div>

        <SkillTreeView />
        <ReviewSchedule />
      </div>
    </>
  );
};

export default SkillTreePage;
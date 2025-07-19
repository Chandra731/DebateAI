import React from 'react';
import { Helmet } from 'react-helmet-async';
import SkillTreeView from '../components/SkillTree/SkillTreeView';
import ReviewSchedule from '../components/SkillTree/ReviewSchedule';
import SEO from '../components/common/SEO';

const SkillTreePage: React.FC = () => {
  return (
    <>
      <SEO
        title="Skill Tree - Progressive Learning"
        description="Master debate skills step by step with our interactive skill tree. Unlock new abilities as you progress through structured lessons and exercises."
        keywords="skill tree, progressive learning, debate skills, interactive lessons, gamified learning"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkillTreeView />
          <ReviewSchedule />
        </div>
      </div>
    </>
  );
};

export default SkillTreePage;
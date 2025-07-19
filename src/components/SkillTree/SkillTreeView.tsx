import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkillTree } from '../../hooks/useSkillTree';
import { Lock, CheckCircle, Star, Trophy, BookOpen } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import SkillModal from './SkillModal';

// Duolingo-style colors
const colors = {
  unlocked: 'bg-primary-500 border-primary-600',
  locked: 'bg-gray-300 border-gray-400',
  mastered: 'bg-yellow-400 border-yellow-500',
  connector: 'border-gray-300',
};

const SkillNode: React.FC<{
  skill: any;
  onClick: () => void;
  isUnlocked: boolean;
  isMastered: boolean;
  masteryLevel: number;
}> = ({ skill, onClick, isUnlocked, isMastered, masteryLevel }) => {
  const status = isMastered ? 'mastered' : isUnlocked ? 'unlocked' : 'locked';

  const statusColors = {
    mastered: 'from-yellow-400 to-amber-500 text-white',
    unlocked: 'from-primary-500 to-primary-600 text-white',
    locked: 'from-gray-200 to-gray-300 text-gray-500',
  };

  const progressRingColor = isMastered ? 'stroke-yellow-400' : 'stroke-primary-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isUnlocked ? 1.1 : 1, y: isUnlocked ? -5 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative flex flex-col items-center text-center cursor-pointer group"
      onClick={isUnlocked ? onClick : undefined}
    >
      {/* Progress Ring */}
      {isUnlocked && !isMastered && (
        <svg className="absolute w-24 h-24" viewBox="0 0 100 100">
          <circle
            className="stroke-gray-200"
            strokeWidth="8"
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
          />
          <motion.circle
            className={progressRingColor}
            strokeWidth="8"
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * masteryLevel) / 100}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            initial={{ strokeDashoffset: 264 }}
            animate={{ strokeDashoffset: 264 - (264 * masteryLevel) / 100 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
      )}

      {/* Main Node */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl
                    bg-gradient-to-br shadow-lg transition-all duration-300
                    ${statusColors[status]} ${!isUnlocked && 'opacity-70'}`}
      >
        {isMastered ? <Trophy /> : isUnlocked ? skill.icon : <Lock />}
      </div>

      {/* Skill Name */}
      <div
        className={`mt-2 text-xs font-bold transition-colors duration-300
                    ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}
      >
        {skill.name}
      </div>

      {/* Tooltip on Hover */}
      <div
        className="absolute bottom-full mb-2 w-48 p-3 bg-gray-800 text-white text-xs rounded-lg
                   opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                   shadow-xl z-10"
      >
        <h4 className="font-bold mb-1">{skill.name}</h4>
        <p className="mb-2">{skill.description}</p>
        <div className="flex items-center justify-between">
          <span className="flex items-center">
            <Star className="w-3 h-3 mr-1 text-yellow-400" /> {skill.xp_reward} XP
          </span>
          <span className="font-semibold">
            {isMastered ? 'Mastered' : isUnlocked ? `${masteryLevel}%` : 'Locked'}
          </span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0
                        border-l-8 border-l-transparent
                        border-r-8 border-r-transparent
                        border-t-8 border-t-gray-800" />
      </div>
    </motion.div>
  );
};

const Connector: React.FC<{ isUnlocked: boolean }> = ({ isUnlocked }) => (
  <div className="flex-1 flex items-center justify-center">
    <div
      className={`w-full h-1.5 rounded-full transition-colors duration-500
                  ${isUnlocked ? 'bg-primary-400' : 'bg-gray-300'}`}
    />
  </div>
);

const SkillTreeView: React.FC = () => {
  const { skillTree, loading, error, isSkillUnlocked, isSkillMastered, getSkillMasteryLevel } = useSkillTree();
  const [selectedSkill, setSelectedSkill] = useState<any>(null);

  const tiers = useMemo(() => {
    if (!skillTree.length) return [];
    const allSkills = skillTree.flatMap(cat => cat.skills || []);
    const skillMap = new Map(allSkills.map(s => [s.id, s]));
    const tiers: any[][] = [];

    // This is a simplified tier calculation. A real implementation would need a proper graph traversal (e.g., topological sort).
    let currentTier = allSkills.filter(s => !s.prerequisites || s.prerequisites.length === 0);
    let remainingSkills = allSkills.filter(s => s.prerequisites && s.prerequisites.length > 0);

    while (currentTier.length > 0) {
      tiers.push(currentTier);
      const currentTierIds = new Set(currentTier.map(s => s.id));
      const nextTier = remainingSkills.filter(s =>
        s.prerequisites?.every(p => currentTierIds.has(p.prerequisite_skill_id))
      );
      currentTier = nextTier;
      remainingSkills = remainingSkills.filter(s => !nextTier.includes(s));
    }
    // Add any remaining skills (potential cycles or missing prereqs)
    if (remainingSkills.length > 0) tiers.push(remainingSkills);

    return tiers;
  }, [skillTree]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Skill Tree</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Your Learning Path</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Master debate skills step-by-step. Complete lessons to unlock new challenges and level up your abilities.
        </p>
      </div>

      {/* Skill Tree Path */}
      <div className="flex flex-col items-center space-y-8">
        {tiers.map((tier, tierIndex) => (
          <React.Fragment key={tierIndex}>
            {/* Tier Row */}
            <div className="flex justify-center items-start w-full max-w-4xl">
              {tier.map((skill, skillIndex) => (
                <React.Fragment key={skill.id}>
                  <SkillNode
                    skill={skill}
                    onClick={() => setSelectedSkill(skill)}
                    isUnlocked={isSkillUnlocked(skill.id)}
                    isMastered={isSkillMastered(skill.id)}
                    masteryLevel={getSkillMasteryLevel(skill.id)}
                  />
                  {skillIndex < tier.length - 1 && (
                    <Connector isUnlocked={isSkillUnlocked(skill.id) && isSkillUnlocked(tier[skillIndex + 1].id)} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Vertical Connector */}
            {tierIndex < tiers.length - 1 && (
              <div className="w-1.5 h-16 bg-gray-300 rounded-full" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Skill Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <SkillModal
            skill={selectedSkill}
            isOpen={!!selectedSkill}
            onClose={() => setSelectedSkill(null)}
            isUnlocked={isSkillUnlocked(selectedSkill.id)}
          />
        )}
      </AnimatePresence>

      {/* Empty State */}
      {skillTree.length === 0 && !loading && (
        <div className="text-center py-16">
          <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">The Skill Tree is Growing!</h3>
          <p className="text-gray-600">New skills and lessons are being cultivated. Check back soon.</p>
        </div>
      )}
    </div>
  );
};

export default SkillTreeView;

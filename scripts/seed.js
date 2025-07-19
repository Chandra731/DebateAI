import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import process from 'process';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Your web app's Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const skillCategories = [
  {
    id: 'foundations',
    name: 'The Foundations of Argumentation',
    description: 'Master the core building blocks of a strong argument.',
    icon: '🏛️',
    color: '#4A90E2',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'rebuttal',
    name: 'Advanced Rebuttal & Refutation',
    description: 'Learn to deconstruct and counter opposing arguments effectively.',
    icon: '⚔️',
    color: '#F5A623',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'strategy',
    name: 'Case Construction & Strategy',
    description: 'Build a winning case and manage your time effectively.',
    icon: '🗺️',
    color: '#50E3C2',
    display_order: 3,
    is_active: true,
  },
  {
    id: 'delivery',
    name: 'Delivery & Persuasion',
    description: 'Enhance your public speaking and persuasive abilities.',
    icon: '🎤',
    color: '#BD10E0',
    display_order: 4,
    is_active: true,
  },
];

const skills = {
  'foundations': [
    {
      id: 'what-is-an-argument',
      name: 'What is an Argument?',
      description: 'Learn the three core components of any argument: Claim, Evidence, and Warrant.',
      icon: '❓',
      difficulty_level: 'beginner',
      xp_reward: 10,
      mastery_threshold: 90,
      display_order: 1,
      is_active: true,
    },
    {
      id: 'types-of-evidence',
      name: 'Types of Evidence',
      description: 'Explore the different kinds of evidence you can use to support your claims.',
      icon: '📊',
      difficulty_level: 'beginner',
      xp_reward: 15,
      mastery_threshold: 90,
      display_order: 2,
      is_active: true,
    },
    {
      id: 'logical-reasoning',
      name: 'Logical Reasoning',
      description: 'Understand the difference between inductive and deductive reasoning.',
      icon: '🧠',
      difficulty_level: 'intermediate',
      xp_reward: 20,
      mastery_threshold: 90,
      display_order: 3,
      is_active: true,
    },
    {
      id: 'identifying-assumptions',
      name: 'Identifying Assumptions',
      description: 'Learn to spot the hidden assumptions in an argument.',
      icon: '🧐',
      difficulty_level: 'intermediate',
      xp_reward: 20,
      mastery_threshold: 90,
      display_order: 4,
      is_active: true,
    },
  ],
  'rebuttal': [
    {
      id: 'four-step-refutation',
      name: 'The Four-Step Refutation',
      description: 'A structured method for responding to an opponent\'s argument.',
      icon: '🔢',
      difficulty_level: 'beginner',
      xp_reward: 20,
      mastery_threshold: 90,
      display_order: 1,
      is_active: true,
    },
    {
      id: 'attacking-evidence',
      name: 'Attacking Evidence',
      description: 'Learn how to question the validity and relevance of your opponent\'s evidence.',
      icon: '💥',
      difficulty_level: 'intermediate',
      xp_reward: 25,
      mastery_threshold: 90,
      display_order: 2,
      is_active: true,
    },
    {
      id: 'attacking-reasoning',
      name: 'Attacking Reasoning',
      description: 'Identify and expose logical fallacies in your opponent\'s arguments.',
      icon: '🤯',
      difficulty_level: 'intermediate',
      xp_reward: 25,
      mastery_threshold: 90,
      display_order: 3,
      is_active: true,
    },
    {
      id: 'weighing-and-comparison',
      name: 'Weighing and Comparison',
      description: 'Learn to explain why your arguments are more important than your opponent\'s.',
      icon: '⚖️',
      difficulty_level: 'advanced',
      xp_reward: 30,
      mastery_threshold: 90,
      display_order: 4,
      is_active: true,
    },
  ],
  'strategy': [
    {
      id: 'brainstorming',
      name: 'Brainstorming & Topic Analysis',
      description: 'How to generate ideas and analyze a debate topic effectively.',
      icon: '💡',
      difficulty_level: 'beginner',
      xp_reward: 15,
      mastery_threshold: 90,
      display_order: 1,
      is_active: true,
    },
    {
      id: 'case-structure',
      name: 'Structuring a Case',
      description: 'Learn the classic Problem, Cause, Solution framework for building a case.',
      icon: '🏗️',
      difficulty_level: 'intermediate',
      xp_reward: 20,
      mastery_threshold: 90,
      display_order: 2,
      is_active: true,
    },
    {
      id: 'signposting',
      name: 'Signposting & Roadmapping',
      description: 'Guide the judges and audience through your arguments with clear signposting.',
      icon: '📍',
      difficulty_level: 'intermediate',
      xp_reward: 20,
      mastery_threshold: 90,
      display_order: 3,
      is_active: true,
    },
    {
      id: 'time-management',
      name: 'Time Management',
      description: 'Learn to allocate your time effectively during a debate.',
      icon: '⏱️',
      difficulty_level: 'advanced',
      xp_reward: 25,
      mastery_threshold: 90,
      display_order: 4,
      is_active: true,
    },
  ],
  'delivery': [
    {
      id: 'vocal-variety',
      name: 'Vocal Variety',
      description: 'Master the use of tone, pace, and volume to be a more persuasive speaker.',
      icon: '🗣️',
      difficulty_level: 'beginner',
      xp_reward: 15,
      mastery_threshold: 90,
      display_order: 1,
      is_active: true,
    },
    {
      id: 'body-language',
      name: 'Body Language & Gestures',
      description: 'Learn how to use non-verbal cues to enhance your message.',
      icon: '🕺',
      difficulty_level: 'intermediate',
      xp_reward: 20,
      mastery_threshold: 90,
      display_order: 2,
      is_active: true,
    },
    {
      id: 'rhetorical-devices',
      name: 'Rhetorical Devices',
      description: 'Learn to use rhetorical questions, analogies, and other devices to persuade.',
      icon: '✨',
      difficulty_level: 'advanced',
      xp_reward: 25,
      mastery_threshold: 90,
      display_order: 3,
      is_active: true,
    },
    {
      id: 'audience-adaptation',
      name: 'Audience Adaptation',
      description: 'Learn to tailor your message to different audiences.',
      icon: '👨‍👩‍👧‍👦',
      difficulty_level: 'advanced',
      xp_reward: 25,
      mastery_threshold: 90,
      display_order: 4,
      is_active: true,
    },
  ],
};

const lessons = {
  'what-is-an-argument': [
    {
      id: 'lesson-what-is-an-argument-1',
      skill_id: 'what-is-an-argument',
      title: 'The Three Pillars of Argument',
      description: 'Learn about Claim, Evidence, and Warrant.',
      content: '', // AI-generated
      learning_objectives: ['Define Claim, Evidence, and Warrant.', 'Explain the role of each component.'],
      estimated_duration: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'types-of-evidence': [
    {
      id: 'lesson-types-of-evidence-1',
      skill_id: 'types-of-evidence',
      title: 'Evidence Types',
      description: 'Explore the different kinds of evidence.',
      content: '', // AI-generated
      learning_objectives: ['Identify different types of evidence.', 'Understand the strengths and weaknesses of each type.'],
      estimated_duration: 7,
      display_order: 1,
      is_active: true,
    },
  ],
  'logical-reasoning': [
    {
      id: 'lesson-logical-reasoning-1',
      skill_id: 'logical-reasoning',
      title: 'Deductive vs. Inductive Reasoning',
      description: 'Learn the fundamental differences between top-down and bottom-up logic.',
      content: '',
      learning_objectives: ['Define deductive reasoning.', 'Define inductive reasoning.', 'Provide an example of each.'],
      estimated_duration: 8,
      display_order: 1,
      is_active: true,
    },
  ],
  'identifying-assumptions': [
    {
      id: 'lesson-identifying-assumptions-1',
      skill_id: 'identifying-assumptions',
      title: 'Spotting Hidden Assumptions',
      description: 'Learn how to find the unstated premises that arguments rely on.',
      content: '',
      learning_objectives: ['Define an assumption in the context of an argument.', 'Develop a method for identifying hidden assumptions.'],
      estimated_duration: 10,
      display_order: 1,
      is_active: true,
    },
  ],
  'four-step-refutation': [
    {
      id: 'lesson-four-step-refutation-1',
      skill_id: 'four-step-refutation',
      title: 'The Four-Step Refutation Method',
      description: 'Master a structured approach to responding to any argument.',
      content: '',
      learning_objectives: ['List the four steps of refutation.', 'Explain the purpose of each step.'],
      estimated_duration: 7,
      display_order: 1,
      is_active: true,
    },
  ],
  'attacking-evidence': [
    {
      id: 'lesson-attacking-evidence-1',
      skill_id: 'attacking-evidence',
      title: 'How to Challenge Evidence',
      description: 'Learn techniques to question the validity and relevance of evidence.',
      content: '',
      learning_objectives: ['Identify three ways to attack evidence.', 'Apply these techniques to an example.'],
      estimated_duration: 9,
      display_order: 1,
      is_active: true,
    },
  ],
  'brainstorming': [
    {
      id: 'lesson-brainstorming-1',
      skill_id: 'brainstorming',
      title: 'Brainstorming Techniques',
      description: 'Learn how to generate a wide range of arguments for any topic.',
      content: '',
      learning_objectives: ['Use the "clustering" method for brainstorming.', 'Generate at least 10 potential arguments for a sample topic.'],
      estimated_duration: 10,
      display_order: 1,
      is_active: true,
    },
  ],
  'case-structure': [
    {
      id: 'lesson-case-structure-1',
      skill_id: 'case-structure',
      title: 'The Problem-Cause-Solution Framework',
      description: 'Structure a compelling case that is easy for judges to follow.',
      content: '',
      learning_objectives: ['Explain the three parts of the Problem-Cause-Solution framework.', 'Outline a case using this structure.'],
      estimated_duration: 12,
      display_order: 1,
      is_active: true,
    },
  ],
  'signposting': [
    {
      id: 'lesson-signposting-1',
      skill_id: 'signposting',
      title: 'Guiding Your Audience',
      description: 'Use verbal cues to keep your judges and audience on track.',
      content: '',
      learning_objectives: ['Define signposting.', 'Provide examples of signposts for transitions, introductions, and conclusions.'],
      estimated_duration: 8,
      display_order: 1,
      is_active: true,
    },
  ],
  'time-management': [
    {
      id: 'lesson-time-management-1',
      skill_id: 'time-management',
      title: 'Winning the Clock',
      description: 'Learn to allocate your speech time effectively to cover all your key points.',
      content: '',
      learning_objectives: ['Create a time allocation plan for a speech.', 'Identify when to move on from an argument.'],
      estimated_duration: 7,
      display_order: 1,
      is_active: true,
    },
  ],
  'vocal-variety': [
    {
      id: 'lesson-vocal-variety-1',
      skill_id: 'vocal-variety',
      title: 'The Music of Your Voice',
      description: 'Use pace, pitch, and volume to make your speeches more engaging.',
      content: '',
      learning_objectives: ['Define pace, pitch, and volume.', 'Practice exercises to improve vocal variety.'],
      estimated_duration: 10,
      display_order: 1,
      is_active: true,
    },
  ],
  'body-language': [
    {
      id: 'lesson-body-language-1',
      skill_id: 'body-language',
      title: 'Speaking Without Words',
      description: 'Learn how posture, gestures, and eye contact impact your persuasiveness.',
      content: '',
      learning_objectives: ['Identify three key elements of effective body language.', 'Practice using gestures to emphasize points.'],
      estimated_duration: 9,
      display_order: 1,
      is_active: true,
    },
  ],
  'rhetorical-devices': [
    {
      id: 'lesson-rhetorical-devices-1',
      skill_id: 'rhetorical-devices',
      title: 'The Art of Persuasion',
      description: 'Learn to use literary devices to make your arguments more memorable.',
      content: '',
      learning_objectives: ['Define three rhetorical devices (e.g., analogy, rule of three, rhetorical question).', 'Write examples of each device.'],
      estimated_duration: 12,
      display_order: 1,
      is_active: true,
    },
  ],
  'audience-adaptation': [
    {
      id: 'lesson-audience-adaptation-1',
      skill_id: 'audience-adaptation',
      title: 'Connecting with Your Listeners',
      description: 'Tailor your language, examples, and appeals to your specific audience.',
      content: '',
      learning_objectives: ['Explain the importance of audience adaptation.', 'Analyze a sample audience and suggest adaptation strategies.'],
      estimated_duration: 10,
      display_order: 1,
      is_active: true,
    },
  ],
};

const exercises = {
  'lesson-what-is-an-argument-1': [
    {
      id: 'exercise-what-is-an-argument-1-mcq',
      lesson_id: 'lesson-what-is-an-argument-1',
      title: 'Quiz: The Three Pillars',
      type: 'mcq',
      content: {
        question: 'Which component of an argument is the logical connection between the evidence and the claim?',
        options: [
          'Claim',
          'Evidence',
          'Warrant',
          'Impact'
        ]
      },
      correct_answer: { selected_option: 'Warrant' },
      ai_evaluation_prompt: 'Evaluate if the user correctly identified the Warrant.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-types-of-evidence-1': [
    {
      id: 'exercise-types-of-evidence-1-mcq',
      lesson_id: 'lesson-types-of-evidence-1',
      title: 'Quiz: Evidence Types',
      type: 'mcq',
      content: {
        question: 'Which of the following is an example of expert testimony?',
        options: [
          'A story about your personal experience.',
          'A quote from a leading scientist in the field.',
          'A statistic from a government report.',
          'A common sense explanation.'
        ]
      },
      correct_answer: { selected_option: 'A quote from a leading scientist in the field.' },
      ai_evaluation_prompt: 'Evaluate if the user correctly identified expert testimony.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-logical-reasoning-1': [
    {
      id: 'exercise-logical-reasoning-1-mcq',
      lesson_id: 'lesson-logical-reasoning-1',
      title: 'Quiz: Deductive vs. Inductive',
      type: 'mcq',
      content: {
        question: 'Which type of reasoning starts with a general principle and moves to a specific conclusion?',
        options: [
          'Inductive',
          'Deductive',
          'Abductive',
          'Analogical'
        ]
      },
      correct_answer: { selected_option: 'Deductive' },
      ai_evaluation_prompt: 'Evaluate if the user correctly identified Deductive reasoning.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-identifying-assumptions-1': [
    {
      id: 'exercise-identifying-assumptions-1-mcq',
      lesson_id: 'lesson-identifying-assumptions-1',
      title: 'Quiz: Spotting Assumptions',
      type: 'mcq',
      content: {
        question: 'In the argument "This car is expensive, so it must be high quality," what is the hidden assumption?',
        options: [
          'All cars are expensive.',
          'Expensive things are always high quality.',
          'High-quality cars are never cheap.',
          'This car was made in Germany.'
        ]
      },
      correct_answer: { selected_option: 'Expensive things are always high quality.' },
      ai_evaluation_prompt: 'Evaluate if the user correctly identified the hidden assumption.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-four-step-refutation-1': [
    {
      id: 'exercise-four-step-refutation-1-mcq',
      lesson_id: 'lesson-four-step-refutation-1',
      title: 'Quiz: Four-Step Refutation',
      type: 'mcq',
      content: {
        question: 'What is the first step in the four-step refutation method?',
        options: [
          '"Therefore..." (Explain your argument)',
          '"But..." (State your counter-argument)',
          '"They say..." (Summarize the opponent\'s argument)',
          '"Because..." (Provide evidence)'
        ]
      },
      correct_answer: { selected_option: '"They say..." (Summarize the opponent\'s argument)' },
      ai_evaluation_prompt: 'Evaluate if the user correctly identified the first step of refutation.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-attacking-evidence-1': [
    {
      id: 'exercise-attacking-evidence-1-mcq',
      lesson_id: 'lesson-attacking-evidence-1',
      title: 'Quiz: Challenging Evidence',
      type: 'mcq',
      content: {
        question: 'If an opponent uses a statistic from 1995 to argue about modern internet usage, what is the best way to attack this evidence?',
        options: [
          'Question the source of the statistic.',
          'Question the relevance of the statistic due to its age.',
          'Question the accuracy of the number itself.',
          'Provide a different statistic about a different topic.'
        ]
      },
      correct_answer: { selected_option: 'Question the relevance of the statistic due to its age.' },
      ai_evaluation_prompt: 'Evaluate if the user understands how to attack outdated evidence.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-brainstorming-1': [
    {
      id: 'exercise-brainstorming-1-mcq',
      lesson_id: 'lesson-brainstorming-1',
      title: 'Quiz: Brainstorming',
      type: 'mcq',
      content: {
        question: 'Which brainstorming technique involves starting with a central idea and branching out with related concepts?',
        options: [
          'Freewriting',
          'Clustering',
          'Outlining',
          'Questioning'
        ]
      },
      correct_answer: { selected_option: 'Clustering' },
      ai_evaluation_prompt: 'Evaluate if the user can identify the clustering brainstorming technique.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-case-structure-1': [
    {
      id: 'exercise-case-structure-1-mcq',
      lesson_id: 'lesson-case-structure-1',
      title: 'Quiz: Case Structure',
      type: 'mcq',
      content: {
        question: 'In the Problem-Cause-Solution framework, what is the primary purpose of the \"Cause\" section?',
        options: [
          'To describe the negative effects of the problem.',
          'To explain the mechanism that creates the problem.',
          'To propose a solution to the problem.',
          'To show why the problem is significant.'
        ]
      },
      correct_answer: { selected_option: 'To explain the mechanism that creates the problem.' },
      ai_evaluation_prompt: 'Evaluate if the user understands the purpose of the \"Cause\" section.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-signposting-1': [
    {
      id: 'exercise-signposting-1-mcq',
      lesson_id: 'lesson-signposting-1',
      title: 'Quiz: Signposting',
      type: 'mcq',
      content: {
        question: 'Which of the following is the best example of a signpost?',
        options: [
          '\"This is a very important point.\"',
          '\"Now that we\'ve examined the problem, let\'s turn to the cause.\"',
          '\"I completely agree with my opponent.\"',
          '\"To conclude, I have shown that...\"'
        ]
      },
      correct_answer: { selected_option: '\"Now that we\'ve examined the problem, let\'s turn to the cause.\"' },
      ai_evaluation_prompt: 'Evaluate if the user can identify a clear signpost.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-time-management-1': [
    {
      id: 'exercise-time-management-1-mcq',
      lesson_id: 'lesson-time-management-1',
      title: 'Quiz: Time Management',
      type: 'mcq',
      content: {
        question: 'In a 5-minute speech, approximately how much time should be spent on your introduction?',
        options: [
          '30 seconds',
          '1 minute',
          '2 minutes',
          'As long as it takes'
        ]
      },
      correct_answer: { selected_option: '30 seconds' },
      ai_evaluation_prompt: 'Evaluate if the user has a reasonable sense of time allocation for an introduction.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-vocal-variety-1': [
    {
      id: 'exercise-vocal-variety-1-mcq',
      lesson_id: 'lesson-vocal-variety-1',
      title: 'Quiz: Vocal Variety',
      type: 'mcq',
      content: {
        question: 'What does \"pace\" refer to in public speaking?',
        options: [
          'The loudness of your voice.',
          'The highness or lowness of your voice.',
          'The speed at which you speak.',
          'The clarity of your pronunciation.'
        ]
      },
      correct_answer: { selected_option: 'The speed at which you speak.' },
      ai_evaluation_prompt: 'Evaluate if the user can define \"pace\".',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-body-language-1': [
    {
      id: 'exercise-body-language-1-mcq',
      lesson_id: 'lesson-body-language-1',
      title: 'Quiz: Body Language',
      type: 'mcq',
      content: {
        question: 'Which of these is generally considered a positive form of body language for a debater?',
        options: [
          'Crossing your arms.',
          'Avoiding eye contact.',
          'Using purposeful gestures.',
          'Standing perfectly still.'
        ]
      },
      correct_answer: { selected_option: 'Using purposeful gestures.' },
      ai_evaluation_prompt: 'Evaluate if the user can identify positive body language.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-rhetorical-devices-1': [
    {
      id: 'exercise-rhetorical-devices-1-mcq',
      lesson_id: 'lesson-rhetorical-devices-1',
      title: 'Quiz: Rhetorical Devices',
      type: 'mcq',
      content: {
        question: 'What is it called when you ask a question not for an answer, but for effect?',
        options: [
          'Analogy',
          'Metaphor',
          'Rhetorical Question',
          'Simile'
        ]
      },
      correct_answer: { selected_option: 'Rhetorical Question' },
      ai_evaluation_prompt: 'Evaluate if the user can identify a rhetorical question.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
  'lesson-audience-adaptation-1': [
    {
      id: 'exercise-audience-adaptation-1-mcq',
      lesson_id: 'lesson-audience-adaptation-1',
      title: 'Quiz: Audience Adaptation',
      type: 'mcq',
      content: {
        question: 'If you are debating in front of a panel of expert judges, you should generally...', 
        options: [
          'Use simpler language and avoid jargon.',
          'Use more technical language and in-depth analysis.',
          'Focus more on emotional appeals.',
          'Speak louder than usual.'
        ]
      },
      correct_answer: { selected_option: 'Use more technical language and in-depth analysis.' },
      ai_evaluation_prompt: 'Evaluate if the user understands how to adapt to an expert audience.',
      max_attempts: 3,
      passing_score: 100,
      xp_reward: 5,
      display_order: 1,
      is_active: true,
    },
  ],
};

const skillDependencies = [
  { skill_id: 'types-of-evidence', prerequisite_skill_id: 'what-is-an-argument' },
  { skill_id: 'logical-reasoning', prerequisite_skill_id: 'types-of-evidence' },
  { skill_id: 'identifying-assumptions', prerequisite_skill_id: 'logical-reasoning' },
  { skill_id: 'four-step-refutation', prerequisite_skill_id: 'identifying-assumptions' },
  { skill_id: 'attacking-evidence', prerequisite_skill_id: 'four-step-refutation' },
  { skill_id: 'attacking-reasoning', prerequisite_skill_id: 'attacking-evidence' },
  { skill_id: 'weighing-and-comparison', prerequisite_skill_id: 'attacking-reasoning' },
  { skill_id: 'brainstorming', prerequisite_skill_id: 'weighing-and-comparison' },
  { skill_id: 'case-structure', prerequisite_skill_id: 'brainstorming' },
  { skill_id: 'signposting', prerequisite_skill_id: 'case-structure' },
  { skill_id: 'time-management', prerequisite_skill_id: 'signposting' },
  { skill_id: 'vocal-variety', prerequisite_skill_id: 'time-management' },
  { skill_id: 'body-language', prerequisite_skill_id: 'vocal-variety' },
  { skill_id: 'rhetorical-devices', prerequisite_skill_id: 'body-language' },
  { skill_id: 'audience-adaptation', prerequisite_skill_id: 'rhetorical-devices' },
];

const topics = [
  {
    id: 'social-media-mental-health',
    title: 'Social media is detrimental to mental health.',
    description: 'This debate will explore the impact of social media platforms on the psychological well-being of individuals, particularly adolescents.',
    category: 'Technology & Society',
    difficulty_level: 'beginner',
    is_active: true,
  },
  {
    id: 'universal-basic-income',
    title: 'Governments should implement a universal basic income (UBI).',
    description: 'This debate will cover the economic and social implications of providing a regular, unconditional sum of money to all citizens.',
    category: 'Economics',
    difficulty_level: 'intermediate',
    is_active: true,
  },
  {
    id: 'ai-in-art',
    title: 'The use of AI in creating art undermines human creativity.',
    description: 'This debate will explore whether AI-generated art is a valid form of creative expression or a threat to human artists.',
    category: 'Arts & Culture',
    difficulty_level: 'intermediate',
    is_active: true,
  },
  {
    id: 'space-exploration-funding',
    title: 'Governments should prioritize funding for space exploration.',
    description: 'This debate will weigh the benefits of space exploration against other pressing domestic and global needs.',
    category: 'Science & Technology',
    difficulty_level: 'advanced',
    is_active: true,
  },
];

async function seedDatabase() {
  console.log('Starting database seeding...');

  // Seed Topics
  for (const topic of topics) {
    const topicRef = doc(db, 'topics', topic.id);
    await setSetDoc(topicRef, topic);
    console.log(`Seeded topic: ${topic.title}`);
  }

  // Seed Skill Categories
  for (const category of skillCategories) {
    const categoryRef = doc(db, 'skill_categories', category.id);
    await setSetDoc(categoryRef, category);
    console.log(`Seeded skill category: ${category.name}`);

    // Seed Skills within each category
    if (skills[category.id]) {
      for (const skill of skills[category.id]) {
        const skillRef = doc(db, `skill_categories/${category.id}/skills`, skill.id);
        await setSetDoc(skillRef, skill);
        console.log(`  Seeded skill: ${skill.name} in ${category.name}`);

        // Seed Lessons for each skill
        if (lessons[skill.id]) {
          for (const lesson of lessons[skill.id]) {
            const lessonRef = doc(db, 'lessons', lesson.id); // Lessons are top-level collection
            await setSetDoc(lessonRef, { ...lesson, category_id: category.id });
            console.log(`    Seeded lesson: ${lesson.title} for ${skill.name}`);

            // Seed Exercises for each lesson
            if (exercises[lesson.id]) {
              for (const exercise of exercises[lesson.id]) {
                const exerciseRef = doc(db, 'exercises', exercise.id); // Exercises are top-level collection
                await setSetDoc(exerciseRef, exercise);
                console.log(`      Seeded exercise: ${exercise.title} for ${lesson.title}`);
              }
            }
          }
        }
      }
    }
  }

  // Seed Skill Dependencies
  for (const dep of skillDependencies) {
    const depRef = doc(db, 'skill_dependencies', `${dep.skill_id}-${dep.prerequisite_skill_id}`);
    await setSetDoc(depRef, dep);
    console.log(`Seeded skill dependency: ${dep.skill_id} depends on ${dep.prerequisite_skill_id}`);
  }

  console.log('Database seeding completed successfully!');
}

// Helper to avoid overwriting if doc exists, but still set if it's new
async function setSetDoc(docRef, data) {
  await setDoc(docRef, data, { merge: true });
}

seedDatabase();

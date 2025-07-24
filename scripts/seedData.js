

export const skillCategories = [
  {
    id: 'argument-fundamentals',
    name: 'Argument Fundamentals',
    description: 'The basic building blocks of debate.',
    icon: 'book-open',
    color: 'blue',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'refutation-and-rebuttal',
    name: 'Refutation & Rebuttal',
    description: 'How to effectively respond to your opponent.',
    icon: 'shield',
    color: 'red',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'case-construction',
    name: 'Case Construction',
    description: 'Building a strong and persuasive case.',
    icon: 'clipboard-list',
    color: 'green',
    display_order: 3,
    is_active: true,
  },
  {
    id: 'delivery-and-style',
    name: 'Delivery & Style',
    description: 'Mastering the art of persuasive speaking.',
    icon: 'mic',
    color: 'purple',
    display_order: 4,
    is_active: true,
  },
  {
    id: 'advanced-persuasion',
    name: 'Advanced Persuasion',
    description: 'Techniques for winning over any audience.',
    icon: 'sparkles',
    color: 'yellow',
    display_order: 5,
    is_active: true,
  },
];

export const skills = [
  // Argument Fundamentals
  {
    id: 'what-is-an-argument',
    category_id: 'argument-fundamentals',
    name: 'What is an Argument?',
    description: 'Learn the three core components of any argument: Claim, Evidence, and Warrant.',
    icon: 'puzzle',
    difficulty_level: 'beginner',
    xp_reward: 10,
    mastery_threshold: 90,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'types-of-evidence',
    category_id: 'argument-fundamentals',
    name: 'Types of Evidence',
    description: 'Explore the different kinds of evidence you can use to support your claims.',
    icon: 'library',
    difficulty_level: 'beginner',
    xp_reward: 15,
    mastery_threshold: 90,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'logical-reasoning',
    category_id: 'argument-fundamentals',
    name: 'Logical Reasoning',
    description: 'Understand the difference between inductive and deductive reasoning.',
    icon: 'brain-circuit',
    difficulty_level: 'beginner',
    xp_reward: 20,
    mastery_threshold: 90,
    display_order: 3,
    is_active: true,
  },
  {
    id: 'identifying-assumptions',
    category_id: 'argument-fundamentals',
    name: 'Identifying Assumptions',
    description: 'Learn to spot the hidden assumptions in an argument.',
    icon: 'search',
    difficulty_level: 'intermediate',
    xp_reward: 20,
    mastery_threshold: 90,
    display_order: 4,
    is_active: true,
  },
  // Refutation & Rebuttal
  {
    id: 'four-step-refutation',
    category_id: 'refutation-and-rebuttal',
    name: 'The Four-Step Refutation',
    description: 'A structured method for responding to an opponent\'s argument.',
    icon: 'list-steps',
    difficulty_level: 'intermediate',
    xp_reward: 20,
    mastery_threshold: 90,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'attacking-evidence',
    category_id: 'refutation-and-rebuttal',
    name: 'Attacking Evidence',
    description: 'Learn how to question the validity and relevance of your opponent\'s evidence.',
    icon: 'microscope',
    difficulty_level: 'intermediate',
    xp_reward: 25,
    mastery_threshold: 90,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'attacking-reasoning',
    category_id: 'refutation-and-rebuttal',
    name: 'Attacking Reasoning',
    description: 'Identify and expose logical fallacies in your opponent\'s arguments.',
    icon: 'brain-cog',
    difficulty_level: 'advanced',
    xp_reward: 25,
    mastery_threshold: 90,
    display_order: 3,
    is_active: true,
  },
  {
    id: 'weighing-and-comparison',
    category_id: 'refutation-and-rebuttal',
    name: 'Weighing and Comparison',
    description: 'Learn to explain why your arguments are more important than your opponent\'s.',
    icon: 'scale',
    difficulty_level: 'advanced',
    xp_reward: 30,
    mastery_threshold: 90,
    display_order: 4,
    is_active: true,
  },
  // Case Construction
  {
    id: 'brainstorming-topic-analysis',
    category_id: 'case-construction',
    name: 'Brainstorming & Topic Analysis',
    description: 'How to generate ideas and analyze a debate topic effectively.',
    icon: 'lightbulb',
    difficulty_level: 'beginner',
    xp_reward: 15,
    mastery_threshold: 90,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'structuring-a-case',
    category_id: 'case-construction',
    name: 'Structuring a Case',
    description: 'Learn the classic Problem, Cause, Solution framework for building a case.',
    icon: 'file-signature',
    difficulty_level: 'intermediate',
    xp_reward: 20,
    mastery_threshold: 90,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'signposting-roadmapping',
    category_id: 'case-construction',
    name: 'Signposting & Roadmapping',
    description: 'Guide the judges and audience through your arguments with clear signposting.',
    icon: 'map',
    difficulty_level: 'intermediate',
    xp_reward: 20,
    mastery_threshold: 90,
    display_order: 3,
    is_active: true,
  },
  // Delivery & Style
  {
    id: 'time-management',
    category_id: 'delivery-and-style',
    name: 'Time Management',
    description: 'Learn to allocate your time effectively during a debate.',
    icon: 'timer',
    difficulty_level: 'intermediate',
    xp_reward: 25,
    mastery_threshold: 90,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'vocal-variety',
    category_id: 'delivery-and-style',
    name: 'Vocal Variety',
    description: 'Master the use of tone, pace, and volume to be a more persuasive speaker.',
    icon: 'volume-2',
    difficulty_level: 'beginner',
    xp_reward: 15,
    mastery_threshold: 90,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'body-language-gestures',
    category_id: 'delivery-and-style',
    name: 'Body Language & Gestures',
    description: 'Learn how to use non-verbal cues to enhance your message.',
    icon: 'hand',
    difficulty_level: 'intermediate',
    xp_reward: 20,
    mastery_threshold: 90,
    display_order: 3,
    is_active: true,
  },
  // Advanced Persuasion
  {
    id: 'rhetorical-devices',
    category_id: 'advanced-persuasion',
    name: 'Rhetorical Devices',
    description: 'Learn to use rhetorical questions, analogies, and other devices to persuade.',
    icon: 'quote',
    difficulty_level: 'advanced',
    xp_reward: 25,
    mastery_threshold: 90,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'audience-adaptation',
    category_id: 'advanced-persuasion',
    name: 'Audience Adaptation',
    description: 'Learn to tailor your message to different audiences.',
    icon: 'users',
    difficulty_level: 'advanced',
    xp_reward: 25,
    mastery_threshold: 90,
    display_order: 2,
    is_active: true,
  },
];

export const lessons = [
  // Lesson for the first skill with defined content
  {
    id: 'lesson-what-is-an-argument',
    skill_id: 'what-is-an-argument',
    category_id: 'argument-fundamentals',
    title: 'The Three Pillars of an Argument',
    description: 'Learn to identify and use the three essential components of any persuasive argument.',
    content: [
      {
        type: 'text',
        title: 'Introduction: More Than Just Disagreeing',
        content: 'In debate, an argument isn\'t just about stating your opinion. It\'s about presenting a structured point designed to persuade an audience. To do this effectively, every argument you make needs three core components: a Claim, Evidence (or Data), and a Warrant.'
      },
      {
        type: 'text',
        title: 'Pillar 1: The Claim',
        content: 'The **Claim** is the main point you are trying to prove. It\'s the concise summary of your argument. Think of it as the headline. For example, "Schools should adopt a year-round calendar."'
      },
      {
        type: 'text',
        title: 'Pillar 2: The Evidence',
        content: 'The **Evidence** (also called Data or Grounds) is the proof you offer for your claim. It\'s the "because" part of your argument. Evidence can be statistics, expert testimony, historical examples, or logical reasoning. For our example, evidence might be: "A study by the National Association for Year-Round Education found that students in year-round schools have higher retention rates."'
      },
      {
        type: 'text',
        title: 'Pillar 3: The Warrant',
        content: 'The **Warrant** is the most crucial, and often unstated, part of an argument. It\'s the logical connection that explains *why* the evidence proves the claim. It links the evidence and the claim together. For our example, the warrant would be: "Higher retention rates are a key indicator of a successful educational environment, and therefore, the evidence that year-round schools improve retention is a strong reason to adopt them."'
      },
      {
        type: 'quiz',
        quiz: [
          {
            question: 'What is the primary role of the "Warrant" in an argument?',
            options: [
              'To state the main point.',
              'To provide supporting facts and data.',
              'To explain how the evidence proves the claim.',
              'To make the argument sound more emotional.'
            ],
            correct_answer: 'To explain how the evidence proves the claim.'
          }
        ]
      }
    ],
    learning_objectives: [
      'Define Claim, Evidence, and Warrant.',
      'Differentiate between the three components in a given example.',
      'Understand the importance of the warrant in connecting evidence to a claim.'
    ],
    estimated_duration: 10,
    is_active: true,
  },
  // Add skeleton lessons for all other skills
  ...skills.filter(s => s.id !== 'what-is-an-argument').map((skill, index) => ({
    id: `lesson-${skill.id}`,
    skill_id: skill.id,
    category_id: skill.category_id,
    title: `Introduction to ${skill.name}`,
    description: `Learn the basics of ${skill.name}.`,
    content: [], // Leave empty for dynamic generation
    learning_objectives: [`Understand the core concepts of ${skill.name}.`],
    estimated_duration: 10,
    display_order: index + 2,
    is_active: true,
  }))
];

export const exercises = [
  // Exercise for the first lesson with defined content
  {
    id: 'exercise-what-is-an-argument-1-mcq',
    lesson_id: 'lesson-what-is-an-argument',
    title: 'Identifying the Claim',
    type: 'mcq',
    content: {
      question: 'In the statement, "The city should invest in more bike lanes because it would reduce traffic congestion and improve air quality," what is the Claim?',
      options: [
        'It would reduce traffic congestion.',
        'The city should invest in more bike lanes.',
        'It would improve air quality.',
        'Bike lanes are good for the environment.'
      ],
    },
    correct_answer: { selected_option: 'The city should invest in more bike lanes.' },
    ai_evaluation_prompt: 'The user needs to identify the main assertion or point being argued for, which is the core proposal for action.',
    max_attempts: 3,
    passing_score: 100,
    xp_reward: 10,
    display_order: 1,
    is_active: true,
  },
  // Add skeleton exercises for all other lessons
  ...lessons.filter(l => l.id !== 'lesson-what-is-an-argument').map((lesson, index) => ({
    id: `exercise-${lesson.id}-1`,
    lesson_id: lesson.id,
    title: `Practice: ${lesson.title}`,
    type: 'text_input', // Default to text_input, can be changed
    content: {
      prompt: `Explain the core concept of ${lesson.title.replace('Introduction to ', '')} in your own words.`
    },
    correct_answer: null, // AI will evaluate
    ai_evaluation_prompt: `Evaluate the user's understanding of the core concepts of ${lesson.title.replace('Introduction to ', '')}. The user should demonstrate a clear and accurate grasp of the topic.`,
    max_attempts: 3,
    passing_score: 80,
    xp_reward: 15,
    display_order: index + 2,
    is_active: true,
  }))
];

export const skillDependencies = [
  // Argument Fundamentals
  { from: 'what-is-an-argument', to: 'types-of-evidence' },
  { from: 'what-is-an-argument', to: 'logical-reasoning' },
  { from: 'logical-reasoning', to: 'identifying-assumptions' },
  // Refutation
  { from: 'identifying-assumptions', to: 'four-step-refutation' },
  { from: 'types-of-evidence', to: 'attacking-evidence' },
  { from: 'logical-reasoning', to: 'attacking-reasoning' },
  { from: 'attacking-reasoning', to: 'weighing-and-comparison' },
  // Case Construction
  { from: 'what-is-an-argument', to: 'brainstorming-topic-analysis' },
  { from: 'brainstorming-topic-analysis', to: 'structuring-a-case' },
  { from: 'structuring-a-case', to: 'signposting-roadmapping' },
  // Delivery
  { from: 'signposting-roadmapping', to: 'time-management' },
  // Advanced
  { from: 'weighing-and-comparison', to: 'rhetorical-devices' },
  { from: 'weighing-and-comparison', to: 'audience-adaptation' },
];

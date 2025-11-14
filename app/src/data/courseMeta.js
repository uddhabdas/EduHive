const byId = {};

const bySlug = {
  'python-basics-demo': {
    about: 'Start coding with confidence. You will build the foundations of programming in Python through short, hands-on lessons that mirror real projects.',
    highlights: [
      'Write clean, readable Python scripts from day one',
      'Understand data structures, loops, and functions through practice',
      'Apply problem-solving patterns used by working engineers',
    ],
    audience: 'Absolute beginners or self-taught coders who want a structured, professional starting point.',
    prerequisites: 'Curiosity and a laptop—no prior coding needed.',
    level: 'Beginner',
  },
  'programming-in-java': {
    about: 'Turn Java fundamentals into professional-grade skills. The course takes you from object-oriented basics to building resilient applications.',
    highlights: [
      'Internalize OOP patterns and SOLID design principles',
      'Master collections, generics, streams, and concurrency',
      'Follow best practices for testing and deployment-ready code',
    ],
    audience: 'Developers who know basic syntax and want to write production-level Java.',
    prerequisites: 'Comfortable with any programming language fundamentals.',
    level: 'Intermediate',
  },
  'dsa-using-python': {
    about: 'Crack technical interviews and solve complex problems with data structures and algorithms implemented in Python.',
    highlights: [
      'Ace recursion, sorting, and searching with visual explanations',
      'Implement trees, graphs, heaps, and dynamic programming patterns',
      'Learn problem-solving frameworks tailored for interviews',
    ],
    audience: 'Students and engineers preparing for coding interviews or competitive programming.',
    prerequisites: 'Strong Python fundamentals and comfort with loops/functions.',
    level: 'Intermediate',
  },
  'introduction-to-r': {
    about: 'Use R to analyze data, visualize trends, and communicate insights with statistical confidence.',
    highlights: [
      'Wrangle data frames and tidy datasets using dplyr',
      'Produce publication-ready charts in ggplot2',
      'Run statistical tests and interpret results responsibly',
    ],
    audience: 'Aspiring data analysts and researchers entering the R ecosystem.',
    prerequisites: 'Basic statistics knowledge is helpful but not required.',
    level: 'Beginner',
  },
  'engineering-mathematics': {
    about: 'Bridge theory and engineering practice with the math toolkit used in controls, signal processing, and simulations.',
    highlights: [
      'Revisit calculus, differential equations, and linear algebra with real applications',
      'Translate mathematical models into simulation-ready workflows',
      'Solve numerical problems using MATLAB/Python templates',
    ],
    audience: 'Engineering students and professionals refreshing their math foundations.',
    prerequisites: 'Comfort with high-school calculus and algebra.',
    level: 'Intermediate',
  },
  'introduction-to-cybersecurity': {
    about: 'Build a hacker mindset to defend modern systems. Learn how attacks work and how to design layered defenses.',
    highlights: [
      'Understand threat modelling and the cyber kill chain',
      'Hands-on labs covering network scanning, exploits, and hardening',
      'Secure coding, incident response, and compliance fundamentals',
    ],
    audience: 'IT professionals and developers transitioning into security roles.',
    prerequisites: 'Basic networking and operating system knowledge.',
    level: 'Beginner to Intermediate',
  },
};

const slugify = (t = '') =>
  t
    .toLowerCase()
    .trim()
    .replace(/\bNPTEL\b\s*:*/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const courseMeta = new Proxy(byId, {
  get(target, prop) {
    if (prop in target) return target[prop];
    if (typeof prop === 'string' && bySlug[prop]) return bySlug[prop];
    return undefined;
  },
});

export function getCourseMeta({ id, title }) {
  if (id && byId[id]) return byId[id];
  const slug = slugify(title);
  if (slug && bySlug[slug]) return bySlug[slug];
  return null;
}




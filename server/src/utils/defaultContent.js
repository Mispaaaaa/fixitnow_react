export const LANDING_SECTION_LABELS = {
  hero: 'Hero',
  how_it_works: 'How it works',
  categories: 'Popular categories',
  featured: 'Featured technicians',
  stats: 'Live stats',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  contact: 'Contact and footer',
};

const landingSections = [
  {
    key: 'hero',
    visible: true,
    data: {
      eyebrow: 'Appliance repairs, minus the stress',
      headline: 'Broken appliance?',
      headlineAccent: 'Fixed right, fixed fast.',
      subtext:
        'Book verified appliance technicians across Oriental Mindoro. Track every step, chat in real time, and only pay when the job is done.',
      image: '/images/hero.svg',
      primaryCta: { label: 'Book a repair', to: '/register' },
      secondaryCta: { label: 'Browse technicians', to: '/technicians' },
      badges: ['Verified technicians', 'Upfront scheduling', 'Live job tracking'],
    },
  },
  {
    key: 'how_it_works',
    visible: true,
    data: {
      title: 'How FixitNow works',
      subtitle: 'From report to repair in four simple steps.',
      steps: [
        {
          title: 'Describe the problem',
          text: 'Pick your appliance, add photos and choose a visit window.',
          icon: 'clipboard',
        },
        {
          title: 'Choose a technician',
          text: 'Pick a verified pro or let any available expert accept your job.',
          icon: 'wrench',
        },
        {
          title: 'Track in real time',
          text: 'Chat, follow the status timeline and see live arrival updates.',
          icon: 'route',
        },
        {
          title: 'Rate the work',
          text: 'Review the completed repair and help your neighbours hire well.',
          icon: 'star',
        },
      ],
    },
  },
  {
    key: 'categories',
    visible: true,
    data: {
      title: 'Popular appliance services',
      subtitle: 'Specialists for the machines your home depends on.',
      limit: 6,
      categoryIds: [],
    },
  },
  {
    key: 'featured',
    visible: true,
    data: {
      title: 'Featured technicians',
      subtitle: 'Top-rated, admin-verified professionals.',
      limit: 4,
    },
  },
  {
    key: 'stats',
    visible: true,
    data: {
      title: 'Trusted across Oriental Mindoro',
      subtitle: 'Numbers that update themselves as jobs are completed.',
    },
  },
  {
    key: 'testimonials',
    visible: true,
    data: {
      title: 'What customers say',
      subtitle: 'Real reviews from completed FixitNow jobs.',
      limit: 3,
      reviewIds: [],
    },
  },
  {
    key: 'faq',
    visible: true,
    data: {
      title: 'Frequently asked questions',
      items: [
        {
          q: 'How are technicians verified?',
          a: 'Every technician submits a government ID, a selfie with that ID, a skill certificate and a clearance. An admin reviews all four documents before the verified badge appears.',
        },
        {
          q: 'When do I pay?',
          a: 'You pay the technician directly after the repair is completed. FixitNow shows the final cost in the job details.',
        },
        {
          q: 'Can I reschedule?',
          a: 'Yes. Customers can reschedule or cancel in the app any time before the technician is on the way.',
        },
      ],
    },
  },
  {
    key: 'contact',
    visible: true,
    data: {
      title: 'Need a hand?',
      text: 'Our support desk is around for scheduling questions and service concerns.',
      email: 'fixitnow@gmail.com',
      phone: 'Phone number pending',
      address: 'MinSU Main Campus, Minas Road, Victoria, Oriental Mindoro',
      hours: 'Mon-Sat, 8:00 AM - 7:00 PM',
    },
  },
];

export const DEFAULT_CONTENT = {
  landing: { sections: landingSections },
  dashboard_customer: {
    welcome: {
      title: 'Welcome back, {name}',
      text: 'Track your repairs, chat with your technician, and book your next visit in seconds.',
    },
    widgets: [
      { key: 'activeRequests', label: 'Active requests', visible: true, order: 0 },
      { key: 'recentRequests', label: 'Recent requests', visible: true, order: 1 },
      { key: 'recommendedTechs', label: 'Recommended technicians', visible: true, order: 2 },
      { key: 'savedAddresses', label: 'Saved addresses', visible: true, order: 3 },
    ],
  },
  dashboard_technician: {
    welcome: {
      title: 'Good day, {name}',
      text: 'Here is what is happening with your jobs, availability and ratings today.',
    },
    widgets: [
      { key: 'jobBoard', label: 'Job board', visible: true, order: 0 },
      { key: 'activeJobs', label: 'Active jobs', visible: true, order: 1 },
      { key: 'performance', label: 'Performance', visible: true, order: 2 },
      { key: 'availability', label: 'Availability', visible: true, order: 3 },
    ],
  },
  dashboard_admin: {
    welcome: {
      title: 'Operations overview',
      text: 'A live pulse on requests, technicians and service quality.',
    },
    defaultRangeDays: 30,
    widgets: [
      { key: 'stats', label: 'Key metrics', visible: true, order: 0 },
      { key: 'requestsByStatus', label: 'Requests by status', visible: true, order: 1 },
      { key: 'technicianVerification', label: 'Verification mix', visible: true, order: 2 },
      { key: 'activity', label: 'Requests over time', visible: true, order: 3 },
      { key: 'recentActivity', label: 'Recent activity', visible: true, order: 4 },
    ],
  },
};

/** Deep clone so seed/reset never mutate the shared constant. */
export function defaultContentFor(key) {
  const value = DEFAULT_CONTENT[key];
  return value ? JSON.parse(JSON.stringify(value)) : null;
}

export const SITE_CONTENT_KEYS = Object.keys(DEFAULT_CONTENT);
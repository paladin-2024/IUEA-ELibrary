export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const ROUTES = {
  HOME:         '/',
  LOGIN:        '/login',
  REGISTER:     '/register',
  LIBRARY:      '/library',
  BOOK:         '/books/:id',
  READER:       '/reader/:id',
  SEARCH:       '/search',
  PODCASTS:     '/podcasts',
  PODCAST:      '/podcasts/:id',
  PROFILE:      '/profile',
  ADMIN:        '/admin',
};

export const LANGUAGES = [
  { name: 'English',     code: 'en', ttsLang: 'en-US' },
  { name: 'Swahili',     code: 'sw', ttsLang: 'sw-KE' },
  { name: 'French',      code: 'fr', ttsLang: 'fr-FR' },
  { name: 'Arabic',      code: 'ar', ttsLang: 'ar-SA' },
  { name: 'Luganda',     code: 'lg', ttsLang: 'lg'    },
  { name: 'Kinyarwanda', code: 'rw', ttsLang: 'rw'    },
  { name: 'Somali',      code: 'so', ttsLang: 'so'    },
  { name: 'Amharic',     code: 'am', ttsLang: 'am-ET' },
];

export const CATEGORIES = [
  { id: 'fiction',     label: 'Fiction'     },
  { id: 'non-fiction', label: 'Non-Fiction'  },
  { id: 'science',     label: 'Science'     },
  { id: 'technology',  label: 'Technology'  },
  { id: 'history',     label: 'History'     },
  { id: 'biography',   label: 'Biography'   },
  { id: 'religion',    label: 'Religion'    },
  { id: 'law',         label: 'Law'         },
  { id: 'medicine',    label: 'Medicine'    },
  { id: 'education',   label: 'Education'   },
  { id: 'business',    label: 'Business'    },
  { id: 'arts',        label: 'Arts & Culture' },
];

export const READER_THEMES = {
  light: { bg: '#FFFFFF', text: '#1A1A1A', name: 'Light' },
  sepia: { bg: '#F4E4C1', text: '#3D2B1F', name: 'Sepia' },
  dark:  { bg: '#1A1A2E', text: '#E0E0E0', name: 'Dark'  },
};

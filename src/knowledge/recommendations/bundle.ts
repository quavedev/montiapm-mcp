/**
 * Bundle and first load optimization recommendations.
 * Based on https://blog.meteor.com/first-load-optimization-with-meteor-7cd896fa217d
 */

import type { Recommendation } from '../types.js';

const METEOR_BLOG =
  'https://blog.meteor.com/first-load-optimization-with-meteor-7cd896fa217d';

export const BUNDLE_RECOMMENDATIONS: Recommendation[] = [
  // Library Import Optimization
  {
    id: 'reduce-library-imports',
    bottleneckType: 'large_bundle',
    category: 'bundle',
    severity: 'high',
    title: 'Import Only Needed Library Functions',
    description:
      'Importing entire libraries like lodash adds significant bundle size. Import only the specific functions you need.',
    actions: [
      'Use bundle analyzer to identify large dependencies',
      'Replace full library imports with specific function imports',
      'Consider alternative lighter libraries',
      'Use lodash-es for tree-shakeable lodash',
    ],
    codeExample: `// Bad: Imports entire lodash (69.9kB minified)
import _ from 'lodash';
const grouped = _.groupBy(items, 'category');

// Good: Import only what you need
import groupBy from 'lodash/groupBy';
const grouped = groupBy(items, 'category');

// Better: Use lodash-es for tree shaking
import { groupBy } from 'lodash-es';

// Best: Consider if you need lodash at all
const grouped = Object.groupBy(items, item => item.category);
// (Object.groupBy is now available in modern browsers)

// For date handling:
// Bad: moment.js is huge
import moment from 'moment';

// Good: Use date-fns (tree-shakeable)
import { format, addDays } from 'date-fns';

// Or: Use native Intl API
new Intl.DateTimeFormat('en-US').format(date);`,
    docUrl: METEOR_BLOG,
    applicableWhen: (metrics) => metrics.bundleSize > 2 * 1024 * 1024,
  },

  // Component Import Optimization
  {
    id: 'component-imports',
    bottleneckType: 'large_bundle',
    category: 'bundle',
    severity: 'high',
    title: 'Avoid Full UI Library Imports',
    description:
      'Importing from UI library index files can include all components. Import directly from component paths.',
    actions: [
      'Import components from their specific paths',
      'Configure babel-plugin-import for automatic optimization',
      'Check library documentation for tree-shaking support',
    ],
    codeExample: `// Bad: Imports ALL Material-UI components
import { Button, TextField } from '@material-ui/core';
// This bundles every MUI component even if unused!

// Good: Import from specific paths
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

// For Ant Design:
// Bad
import { Button, Table } from 'antd';

// Good
import Button from 'antd/es/button';
import Table from 'antd/es/table';

// Configure babel-plugin-import for automatic transformation:
// .babelrc
{
  "plugins": [
    ["import", {
      "libraryName": "antd",
      "libraryDirectory": "es",
      "style": true
    }]
  ]
}`,
    docUrl: METEOR_BLOG,
    applicableWhen: (metrics) => metrics.bundleSize > 3 * 1024 * 1024,
  },

  // Lazy Loading Routes
  {
    id: 'lazy-load-routes',
    bottleneckType: 'large_bundle',
    category: 'bundle',
    severity: 'high',
    title: 'Lazy Load Routes with React.lazy()',
    description:
      'Split your bundle by routes using React.lazy() to load code only when needed.',
    actions: [
      'Identify routes that are not needed on initial load',
      'Wrap route components with React.lazy()',
      'Add Suspense boundaries with loading fallbacks',
      'Prioritize admin pages, settings, and infrequently visited routes',
    ],
    codeExample: `import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Eager load - always in main bundle
import Home from './pages/Home';
import Login from './pages/Login';

// Lazy load - separate chunks loaded on demand
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard')
);
const Settings = lazy(() =>
  import('./pages/Settings')
);
const Reports = lazy(() =>
  import('./pages/Reports')
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Eagerly loaded routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Lazily loaded routes */}
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}`,
    docUrl: METEOR_BLOG,
    applicableWhen: (metrics) => metrics.bundleSize > 1.5 * 1024 * 1024,
  },

  // Dynamic Imports for Heavy Libraries
  {
    id: 'dynamic-imports',
    bottleneckType: 'large_bundle',
    category: 'bundle',
    severity: 'medium',
    title: 'Use Dynamic Imports for Heavy Libraries',
    description:
      'Load heavy libraries only when they are actually needed using dynamic import().',
    actions: [
      'Identify heavy libraries used in specific features',
      'Replace static imports with dynamic import()',
      'Load libraries on user action or feature access',
      'Show loading state while library loads',
    ],
    codeExample: `// Bad: Chart library loaded on every page
import Chart from 'chart.js/auto';

function Dashboard() {
  useEffect(() => {
    new Chart(canvasRef.current, config);
  }, []);
}

// Good: Load chart library only when needed
function Dashboard() {
  const [ChartJS, setChartJS] = useState(null);

  useEffect(() => {
    // Load only when dashboard mounts
    import('chart.js/auto').then(module => {
      setChartJS(() => module.default);
    });
  }, []);

  useEffect(() => {
    if (ChartJS && canvasRef.current) {
      new ChartJS(canvasRef.current, config);
    }
  }, [ChartJS]);
}

// For PDF generation:
async function generatePDF() {
  // Load PDF library only when user clicks "Export PDF"
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  doc.text('Hello world!', 10, 10);
  doc.save('document.pdf');
}

// For rich text editors:
const RichEditor = lazy(() => import('./components/RichEditor'));

function CommentForm({ useRichText }) {
  return useRichText ? (
    <Suspense fallback={<textarea />}>
      <RichEditor />
    </Suspense>
  ) : (
    <textarea />
  );
}`,
    docUrl: METEOR_BLOG,
    applicableWhen: (metrics) => metrics.bundleSize > 2 * 1024 * 1024,
  },

  // CDN for Static Assets
  {
    id: 'use-cdn',
    bottleneckType: 'large_bundle',
    category: 'bundle',
    severity: 'medium',
    title: 'Use CDN for Static Assets',
    description:
      'Distribute static assets globally using a CDN for faster loading from user locations.',
    actions: [
      'Configure CDN (CloudFront, Cloudflare, etc.)',
      'Set appropriate cache headers',
      'Enable compression (gzip/brotli)',
      'Consider CDN for images and other media',
    ],
    codeExample: `// Meteor settings.json for CDN
{
  "galaxy.meteor.com": {
    "cdn": {
      "url": "https://d1234567890.cloudfront.net"
    }
  }
}

// Or configure in ROOT_URL for self-hosted:
// CDN_URL=https://cdn.example.com meteor

// CloudFront recommended settings:
// - Origin: Your Meteor app
// - Cache behavior:
//   - TTL: 31536000 (1 year) for hashed assets
//   - Compress: Yes (gzip & brotli)
//   - Query string forwarding: None

// For images, use responsive loading:
<img
  src="https://cdn.example.com/images/photo.jpg"
  srcset="
    https://cdn.example.com/images/photo-320w.jpg 320w,
    https://cdn.example.com/images/photo-640w.jpg 640w,
    https://cdn.example.com/images/photo-1280w.jpg 1280w
  "
  sizes="(max-width: 320px) 280px, (max-width: 640px) 600px, 1200px"
  loading="lazy"
/>`,
    docUrl: METEOR_BLOG,
    applicableWhen: () => true, // Always applicable as best practice
  },

  // Bundle Analysis
  {
    id: 'analyze-bundle',
    bottleneckType: 'large_bundle',
    category: 'bundle',
    severity: 'low',
    title: 'Analyze Bundle Composition',
    description:
      'Use bundle visualization tools to understand what is contributing to bundle size.',
    actions: [
      'Run meteor --extra-packages bundle-visualizer --production',
      'Identify unexpectedly large dependencies',
      'Look for duplicate packages',
      'Check for development-only code in production bundle',
    ],
    codeExample: `# Analyze bundle with Meteor Bundle Visualizer
meteor --extra-packages bundle-visualizer --production

# Open in browser and examine:
# 1. Largest packages (hover for sizes)
# 2. Duplicate packages (same library multiple versions)
# 3. Unexpected inclusions (dev tools in prod)

# Alternative: Use source-map-explorer
npm install -g source-map-explorer
meteor build --directory ../build
source-map-explorer ../build/bundle/programs/web.browser/*.js

# Common findings to address:
# - moment.js with all locales (use moment-locales-webpack-plugin)
# - Multiple versions of same package (dedupe in package.json)
# - Entire icon libraries (import specific icons)
# - Polyfills for browsers you don't support`,
    docUrl: METEOR_BLOG,
    applicableWhen: () => true, // Always useful for optimization
  },

  // Server-Side Rendering
  {
    id: 'ssr-initial-data',
    bottleneckType: 'large_bundle',
    category: 'bundle',
    severity: 'low',
    title: 'Preload Initial Data with SSR',
    description:
      'Use server-side rendering or Fast Methods to include initial data in HTML, reducing time to first meaningful paint.',
    actions: [
      'Identify critical above-the-fold data',
      'Implement SSR or use Meteor Fast Methods',
      'Inline critical CSS',
      'Consider static generation for public pages',
    ],
    codeExample: `// Using Meteor Fast Render package
// meteor add staringatlights:fast-render

import { FastRender } from 'meteor/staringatlights:fast-render';

// Pre-fetch data for route
FastRender.onAllRoutes(function(path) {
  // This data will be included in initial HTML
  this.subscribe('publicPosts');
  this.subscribe('categories');
});

FastRender.route('/post/:id', function(params) {
  this.subscribe('postDetail', params.id);
});

// Client-side:
// Data is immediately available, no loading state needed
// for initial render

// For React SSR with meteor-desktop or similar:
// Use renderToString on server, hydrate on client
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';`,
    docUrl: METEOR_BLOG,
    applicableWhen: (metrics) => metrics.firstLoadTime > 3000,
  },
];

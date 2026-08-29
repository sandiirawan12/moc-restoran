import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import AppDashboard from './AppDashboard';

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<AppDashboard />);
}

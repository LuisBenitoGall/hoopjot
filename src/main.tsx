import React from 'react';
import ReactDOM from 'react-dom/client';

import { AppRouter } from './app/router/AppRouter';
import './i18n/config';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);


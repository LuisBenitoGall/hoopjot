import { createContext, useContext } from 'react';

import type { LocalRepositories } from '../../persistence/local';
import { createBrowserLocalRepositories } from './browserLocalServices';

export const LocalRepositoriesContext = createContext<LocalRepositories | null>(null);

export function useLocalRepositories(): LocalRepositories {
  const value = useContext(LocalRepositoriesContext);

  if (!value) {
    throw new Error('useLocalRepositories must be used inside LocalRepositoriesProvider');
  }

  return value;
}

export { createBrowserLocalRepositories };

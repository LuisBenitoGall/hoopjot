import { useMemo, type ReactNode } from 'react';

import type { LocalRepositories } from '../../persistence/local';
import {
  createBrowserLocalRepositories,
  LocalRepositoriesContext
} from './localRepositoriesContext';

interface LocalRepositoriesProviderProps {
  children: ReactNode;
  repositories?: LocalRepositories;
}

export function LocalRepositoriesProvider({
  children,
  repositories
}: LocalRepositoriesProviderProps) {
  const value = useMemo(
    () => repositories ?? createBrowserLocalRepositories(),
    [repositories],
  );

  return (
    <LocalRepositoriesContext.Provider value={value}>
      {children}
    </LocalRepositoriesContext.Provider>
  );
}

import { createContext } from 'react';
import { SubAccountBrandingContextValue } from './constants';

export const SubAccountBrandingContext = createContext<SubAccountBrandingContextValue | undefined>(undefined);
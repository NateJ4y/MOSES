'use client';

import { createContext, useContext } from 'react';

export interface AccessInfo { isPlatformAdmin: boolean; email?: string }

export const AccessContext = createContext<AccessInfo>({ isPlatformAdmin: false });
export const useAccess = () => useContext(AccessContext);

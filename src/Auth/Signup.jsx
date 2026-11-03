import React, { memo } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { FiUser } from 'react-icons/fi';
import { SignupPage, f, EMAIL_F, PHONE_F } from '../components/auth/SignupKit';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, gcTime: 10 * 60 * 1000 } },
});

const CONFIG = {
  role: 'user',
  endpoint: '/api/auth/register/user',
  ctaKey: 'ctaUser',
  fields: [
    f('first_name', 'firstName', FiUser, 'firstName', { autoComplete: 'given-name' }),
    f('last_name', 'lastName', FiUser, 'lastName', { autoComplete: 'family-name' }),
    EMAIL_F,
    PHONE_F,
  ],
};

const Signup = ({ darkMode = false }) => <SignupPage config={CONFIG} darkMode={darkMode} />;

export { queryClient };
export default memo(Signup);
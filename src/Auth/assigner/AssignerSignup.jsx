import React, { memo } from 'react';
import { FiBriefcase } from 'react-icons/fi';
import { SignupPage, f, NAME_F, EMAIL_F, PHONE_F } from '../../components/auth/SignupKit';

const CONFIG = {
  role: 'assigner',
  endpoint: '/api/auth/register/assigner',
  ctaKey: 'ctaAssigner',
  fields: [
    NAME_F('name'),
    f('department', 'department', FiBriefcase, 'department', { autoComplete: 'organization-title' }),
    EMAIL_F,
    PHONE_F,
  ],
};

const AssignerSignup = ({ darkMode = false }) => <SignupPage config={CONFIG} darkMode={darkMode} />;

export default memo(AssignerSignup);
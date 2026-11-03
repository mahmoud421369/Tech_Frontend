import React, { memo } from 'react';
import { FiHome } from 'react-icons/fi';
import { SignupPage, f, NAME_F, EMAIL_F, PHONE_F } from '../../components/auth/SignupKit';

const CONFIG = {
  role: 'delivery',
  endpoint: '/api/auth/register/delivery',
  ctaKey: 'ctaDelivery',
  fields: [
    NAME_F('name'),
    EMAIL_F,
    PHONE_F,
    f('address', 'address', FiHome, 'address', { autoComplete: 'street-address' }),
  ],
};

const DeliverySignup = ({ darkMode = false }) => <SignupPage config={CONFIG} darkMode={darkMode} />;

export default memo(DeliverySignup);
import React, { memo } from 'react';
import { FiShoppingBag, FiFileText, FiMapPin } from 'react-icons/fi';
import { SignupPage, f, EMAIL_F, PHONE_F } from '../../components/auth/SignupKit';

const SHOP_TYPE_OPTIONS = [
  { value: 'REPAIRER', labelKey: 'shopTypeRepairer' },
  { value: 'SELLER', labelKey: 'shopTypeSeller' },
  { value: 'BOTH', labelKey: 'shopTypeBoth' },
];

const toPayload = (v, logoFile) => {
  const fd = new FormData();
  fd.append('name', v.name);
  fd.append('email', v.email);
  fd.append('phone', v.phone);
  fd.append('description', v.description);
  fd.append('shopType', v.shopType);
  fd.append('password', v.password);
  fd.append('shopAddress.state', v.state);
  fd.append('shopAddress.city', v.city);
  fd.append('shopAddress.street', v.street);
  fd.append('shopAddress.building', v.building);
  fd.append('shopAddress.isDefault', 'true');
  if (logoFile) fd.append('logo', logoFile, logoFile.name);
  return fd;
};

const CONFIG = {
  role: 'shop',
  endpoint: '/api/auth/register/shop',
  ctaKey: 'ctaShop',
  withLogo: true,
  toPayload,
  fields: [
    f('name', 'shopName', FiShoppingBag, 'shopName', { autoComplete: 'organization' }),
    EMAIL_F,
    PHONE_F,
    f('description', 'description', FiFileText, 'phDescription', { autoComplete: 'off' }),
    f('shopType', 'shopType', FiShoppingBag, 'phSelectType', { type: 'select', options: SHOP_TYPE_OPTIONS }),
    f('state', 'state', FiMapPin, 'phState', { autoComplete: 'address-level1' }),
    f('city', 'city', FiMapPin, 'phCity', { autoComplete: 'address-level2' }),
    f('street', 'street', FiMapPin, 'phStreet', { autoComplete: 'address-line1' }),
    f('building', 'building', FiMapPin, 'phBuilding', { autoComplete: 'address-line2' }),
  ],
};

const ShopSignup = ({ darkMode = false }) => <SignupPage config={CONFIG} darkMode={darkMode} />;

export default memo(ShopSignup);
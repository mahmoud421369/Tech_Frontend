import React, { memo } from 'react';
import { FiTool } from 'react-icons/fi';
import AssignmentQueue from './OrdersForAssignment';

const REPAIRS_CONFIG = {
  kind: 'repair',
  icon: FiTool,
  eyebrowKey: 'eyebrow.logistics',
  titleKey: 'repairs.assign.title',
  subtitleKey: 'repairs.assign.subtitle',
  docTitleKey: 'repairs.assign.doc',
  pendingUrl: '/api/assigner/repairs-for-assignment',
  assignUrl: '/api/assigner/assign-repair',
  assignKey: 'repairRequestId',
  logType: 'REPAIR',
  logIdField: 'repairRequestId',
  priceField: 'price',
  priceLabelKey: 'price.est',
  valueLabelKey: 'value.estRevenue',
  stopKeys: { pickup: 'stop.shop', dropoff: 'stop.customerAddress' },
};

const RepairsForAssignment = () => <AssignmentQueue config={REPAIRS_CONFIG} />;

export default memo(RepairsForAssignment);
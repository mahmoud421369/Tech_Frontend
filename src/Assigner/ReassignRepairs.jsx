import React, { memo } from 'react';
import { FiTool } from 'react-icons/fi';
import { ReassignQueue } from './ReassignOrders';

const REPAIRS_REASSIGN_CONFIG = {
  kind: 'repair',
  icon: FiTool,
  eyebrowKey: 'eyebrow.reassign',
  titleKey: 'repairs.reassign.title',
  subtitleKey: 'repairs.reassign.subtitle',
  docTitleKey: 'repairs.reassign.doc',
  pendingUrl: '/api/assigner/repairs-for-assignment',
  reassignUrl: '/api/assigner/reassign-repair',
  logType: 'REPAIR',
  logIdField: 'repairRequestId',
  priceField: 'price',
  priceLabelKey: 'price.est',
  valueLabelKey: 'value.estRevenue',
  stopKeys: { pickup: 'stop.shop', dropoff: 'stop.customerAddress' },
};

const ReassignRepairs = () => <ReassignQueue config={REPAIRS_REASSIGN_CONFIG} />;

export default memo(ReassignRepairs);
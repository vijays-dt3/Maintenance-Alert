import React from 'react';
import {
  AlertPriority,
  AlertStatus,
  EquipmentCriticality,
  EquipmentStatus,
  PartAvailability,
  WorkOrderStatus,
} from '@maintenance/shared';

export const PriorityBadge: React.FC<{ priority: AlertPriority }> = ({ priority }) => {
  const styles = {
    CRITICAL: 'bg-red-950/80 text-red-400 border-red-800/60 shadow-sm shadow-red-900/30 ring-1 ring-red-500/20',
    HIGH: 'bg-amber-950/80 text-amber-400 border-amber-800/60 ring-1 ring-amber-500/20',
    MEDIUM: 'bg-purple-950/80 text-purple-300 border-purple-800/60 ring-1 ring-purple-500/20',
  };

  const dots = {
    CRITICAL: 'bg-red-400 animate-pulse',
    HIGH: 'bg-amber-400',
    MEDIUM: 'bg-purple-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[priority]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[priority]}`} />
      {priority}
    </span>
  );
};

export const EquipmentStatusBadge: React.FC<{ status: EquipmentStatus }> = ({ status }) => {
  const styles: Record<EquipmentStatus, { bg: string; dot: string; label: string }> = {
    HEALTHY: {
      bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60 ring-1 ring-emerald-500/20',
      dot: 'bg-emerald-400',
      label: 'Healthy',
    },
    AT_RISK: {
      bg: 'bg-amber-950/80 text-amber-400 border-amber-800/60 ring-1 ring-amber-500/20',
      dot: 'bg-amber-400 animate-pulse',
      label: 'At Risk',
    },
    CRITICAL: {
      bg: 'bg-red-950/80 text-red-400 border-red-800/60 shadow-sm shadow-red-900/30 ring-1 ring-red-500/20',
      dot: 'bg-red-400 animate-ping',
      label: 'Critical',
    },
    UNDER_MAINTENANCE: {
      bg: 'bg-blue-950/80 text-blue-400 border-blue-800/60 ring-1 ring-blue-500/20',
      dot: 'bg-blue-400 animate-spin',
      label: 'In Maintenance',
    },
  };

  const conf = styles[status] || styles.HEALTHY;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${conf.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      {conf.label}
    </span>
  );
};

export const AlertStatusBadge: React.FC<{ status: AlertStatus }> = ({ status }) => {
  const styles: Record<AlertStatus, { bg: string; label: string }> = {
    OPEN: {
      bg: 'bg-red-950/70 text-red-400 border-red-800/60',
      label: 'Open',
    },
    ACKNOWLEDGED: {
      bg: 'bg-blue-950/70 text-blue-300 border-blue-800/60',
      label: 'Acknowledged',
    },
    CONVERTED_TO_WORK_ORDER: {
      bg: 'bg-purple-950/70 text-purple-300 border-purple-800/60',
      label: 'Converted to WO',
    },
    RESOLVED: {
      bg: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60',
      label: 'Resolved',
    },
  };

  const conf = styles[status] || styles.OPEN;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${conf.bg}`}>
      {conf.label}
    </span>
  );
};

export const WorkOrderStatusBadge: React.FC<{ status: WorkOrderStatus }> = ({ status }) => {
  const styles: Record<WorkOrderStatus, { bg: string; label: string }> = {
    OPEN: { bg: 'bg-slate-800 text-slate-300 border-slate-700', label: 'Open' },
    ASSIGNED: { bg: 'bg-blue-950/80 text-blue-300 border-blue-800/60', label: 'Assigned' },
    IN_PROGRESS: { bg: 'bg-amber-950/80 text-amber-300 border-amber-800/60', label: 'In Progress' },
    WAITING_FOR_PARTS: {
      bg: 'bg-orange-950/80 text-orange-300 border-orange-800/60',
      label: 'Waiting for Parts',
    },
    COMPLETED: { bg: 'bg-teal-950/80 text-teal-300 border-teal-800/60', label: 'Completed' },
    CLOSED: { bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60', label: 'Closed' },
    CANCELLED: { bg: 'bg-rose-950/80 text-rose-300 border-rose-800/60', label: 'Cancelled' },
  };

  const conf = styles[status] || styles.OPEN;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${conf.bg}`}>
      {conf.label}
    </span>
  );
};

export const PartAvailabilityBadge: React.FC<{ status: PartAvailability }> = ({ status }) => {
  const styles: Record<PartAvailability, { bg: string; label: string }> = {
    IN_STOCK: { bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60', label: 'In Stock' },
    ORDERED: { bg: 'bg-amber-950/80 text-amber-400 border-amber-800/60', label: 'Ordered' },
    NOT_IN_STOCK: { bg: 'bg-red-950/80 text-red-400 border-red-800/60', label: 'Out of Stock' },
  };

  const conf = styles[status] || styles.NOT_IN_STOCK;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${conf.bg}`}>
      {conf.label}
    </span>
  );
};

export const CriticalityBadge: React.FC<{ criticality: EquipmentCriticality }> = ({ criticality }) => {
  const styles: Record<EquipmentCriticality, string> = {
    CRITICAL: 'bg-red-950/70 text-red-400 border-red-800/50',
    HIGH: 'bg-amber-950/70 text-amber-400 border-amber-800/50',
    MEDIUM: 'bg-blue-950/70 text-blue-400 border-blue-800/50',
    LOW: 'bg-slate-800/80 text-slate-400 border-slate-700/50',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${styles[criticality]}`}>
      {criticality}
    </span>
  );
};

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`card-glass rounded-xl p-5 ${
        hoverEffect ? 'card-glass-hover' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, icon, className = '' }) => (
  <div className={`flex items-start justify-between mb-4 pb-3 border-b border-industrial-800 ${className}`}>
    <div className="flex items-center gap-3">
      {icon && (
        <div className="p-2 rounded-lg bg-industrial-800/80 text-blue-400 border border-industrial-700/50">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

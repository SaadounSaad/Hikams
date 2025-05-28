// src/components/ui/card.tsx
import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <div className={`p-6 pb-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <h3 className={`text-lg font-semibold ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <div className={`p-6 pt-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <div className={`p-6 pt-3 ${className}`} {...props}>
    {children}
  </div>
);


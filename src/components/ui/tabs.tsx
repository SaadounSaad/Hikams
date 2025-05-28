// src/components/ui/tabs.tsx
import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const Tabs: React.FC<{
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}> = ({ children, defaultValue = '', value, onValueChange, className = '' }) => {
  const [internalValue, setInternalValue] = useState(value || defaultValue);
  
  const currentValue = value || internalValue;
  const handleValueChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <div className={`flex space-x-1 bg-gray-100 p-1 rounded-lg ${className}`} {...props}>
    {children}
  </div>
);

export const TabsTrigger: React.FC<{
  children: React.ReactNode;
  value: string;
  className?: string;
}> = ({ children, value, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{
  children: React.ReactNode;
  value: string;
  className?: string;
}> = ({ children, value, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
};
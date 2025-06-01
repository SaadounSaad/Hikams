// /home/ubuntu/src/contexts/AnalyticsContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { AnalyticsService } from "../services/analytics/AnalyticsService";
// Assuming an AuthContext exists and provides user info and the Supabase client
// Adjust the import path and hook name as per your project structure
import { useAuth } from "./AuthContext"; 

interface AnalyticsContextProps {
  analytics: AnalyticsService | null;
  trackEvent: (type: string, payload?: Record<string, any>) => Promise<void>;
  setSyncEnabled: (enabled: boolean) => void;
  isSyncEnabled: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextProps | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
  // Pass Supabase client explicitly if not available via AuthContext
  // supabaseClient: SupabaseClient;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  // Get user and Supabase client from AuthContext
  // Adjust this based on your actual AuthContext implementation
  const { user, supabaseClient } = useAuth(); 
  const [analyticsService, setAnalyticsService] = useState<AnalyticsService | null>(null);
  const [isSyncEnabledState, setIsSyncEnabledState] = useState<boolean>(true); // Default to enabled

  // Initialize AnalyticsService once Supabase client is available
  useEffect(() => {
    if (supabaseClient && !analyticsService) {
      console.log("Initializing Analytics Service...");
      const service = new AnalyticsService(supabaseClient, user?.id);
      setAnalyticsService(service);

      // Start periodic sync
      service.startPeriodicSync();

      // Set initial sync enabled state (could be loaded from user settings)
      // For now, just set it based on the default state
      service.setSyncEnabled(isSyncEnabledState);

      // Cleanup function
      return () => {
        console.log("Cleaning up Analytics Service in Provider...");
        service.cleanup();
        setAnalyticsService(null); // Clear service on unmount
      };
    }
    // Add dependency on supabaseClient to re-init if it changes (unlikely but safe)
  }, [supabaseClient, user?.id]); // Re-run if supabaseClient or initial user changes

  // Update userId in AnalyticsService when auth state changes
  useEffect(() => {
    if (analyticsService) {
      analyticsService.setUserId(user?.id);
    }
  }, [user, analyticsService]);

  // Memoized trackEvent function to provide a stable reference
  const trackEvent = useCallback(async (type: string, payload?: Record<string, any>) => {
    if (analyticsService) {
      await analyticsService.trackEvent(type, payload);
    } else {
      console.warn("Analytics service not ready, event not tracked:", type, payload);
      // Optionally queue events here if needed before service is ready
    }
  }, [analyticsService]);

  // Function to control sync preference
  const setSyncEnabled = useCallback((enabled: boolean) => {
    if (analyticsService) {
      analyticsService.setSyncEnabled(enabled);
      setIsSyncEnabledState(enabled);
      // Persist this setting (e.g., in localStorage or user profile)
    }
  }, [analyticsService]);

  // Context value
  const value = useMemo(() => ({
    analytics: analyticsService,
    trackEvent,
    setSyncEnabled,
    isSyncEnabled: isSyncEnabledState,
  }), [analyticsService, trackEvent, setSyncEnabled, isSyncEnabledState]);

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Custom hook to use the AnalyticsContext
export const useAnalytics = (): AnalyticsContextProps => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  // Return a default/mock object if service isn't ready? Or let consumers handle null?
  // Current approach returns the context as is, consumers check for analytics !== null
  // Or use the provided trackEvent function which handles the null check.
  return context;
};

// Example of how to wrap your app:
//
// <AuthProvider>
//   <AnalyticsProvider>
//     <App />
//   </AnalyticsProvider>
// </AuthProvider>
//
// Example usage in a component:
//
// import { useAnalytics } from "../contexts/AnalyticsContext";
//
// function MyComponent() {
//   const { trackEvent } = useAnalytics();
//
//   const handleButtonClick = () => {
//     trackEvent("button_click", { buttonName: "submit" });
//   };
//
//   return <button onClick={handleButtonClick}>Submit</button>;
// }


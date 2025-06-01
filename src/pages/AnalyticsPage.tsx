// /home/ubuntu/src/pages/AnalyticsPage.tsx
import React from "react";
import { AnalyticsDashboard } from "../components/analytics/AnalyticsDashboard";
// Import layout components if needed (e.g., PageWrapper, Header)
// import PageWrapper from "../components/layout/PageWrapper";

const AnalyticsPage: React.FC = () => {
  return (
    // Wrap with layout components if your app uses them
    // <PageWrapper title="Statistiques">
    <div className="container mx-auto px-0"> {/* Adjust container/padding as needed */}
      <AnalyticsDashboard />
    </div>
    // </PageWrapper>
  );
};

export default AnalyticsPage;


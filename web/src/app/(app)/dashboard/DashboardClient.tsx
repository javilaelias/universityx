'use client';

import IntelligentDashboard from '@/components/dashboard/IntelligentDashboard';

export default function DashboardClient({ userId }: { userId: string }) {
  return <IntelligentDashboard userId={userId} />;
}

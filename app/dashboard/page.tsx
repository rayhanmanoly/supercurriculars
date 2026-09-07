'use client'

import React, { useContext } from 'react';
import { ProfileContext } from '@/app/client-layout';
import { DashboardContent } from './DashboardContent';
import DashboardSkeleton from '@/components/DashboardSkeleton';

const StudentDashboard = () => {
  const profile = useContext(ProfileContext);

  if (!profile) return <DashboardSkeleton />;

  return (
    <div className="flex w-full h-screen bg-white">
      <DashboardContent profile={profile} />
    </div>
  );
};

export default StudentDashboard;

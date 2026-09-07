'use client'

import React, { useContext } from 'react';
import { ProfileContext } from '@/app/client-layout';
import { PortfolioContent } from './PortfolioContent';
import PortfolioSkeleton from './PortfolioSkeleton';

const PortfolioPage = () => {
  const profile = useContext(ProfileContext);

  if (!profile) return <PortfolioSkeleton />;

  return (
    <div className="h-screen bg-white w-full">
      <PortfolioContent profile={profile} />
    </div>
  );
};

export default PortfolioPage;

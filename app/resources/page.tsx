"use client"

import { useContext } from 'react';
import { ProfileContext } from '@/app/client-layout';
import { ResourceContent } from './ResourceContent';

const ResourceHub = () => {
  const profile = useContext(ProfileContext);

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="h-screen bg-white w-full">
      <ResourceContent profile={profile} />
    </div>
  );
};

export default ResourceHub;

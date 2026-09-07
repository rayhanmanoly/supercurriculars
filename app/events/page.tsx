'use client'

import React, { useContext } from 'react';
import { ProfileContext } from '@/app/client-layout';
import { EventsContent } from './EventsContent';
import EventsSkeleton from './EventsSkeleton';

const Events = () => {
  const profile = useContext(ProfileContext);

  if (!profile) return <EventsSkeleton />;

  return (
    <div className="h-screen bg-white w-full">
      <EventsContent profile={profile} />
    </div>
  );
};

export default Events;

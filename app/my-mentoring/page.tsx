'use client'

import React, { useContext } from 'react';
import { ProfileContext, IsMentorContext } from '@/app/client-layout';
import { MyMentoringContent } from './MyMentoringContent';
import MyMentoringSkeleton from './MyMentoringSkeleton';

const MyMentoringPage = () => {
  const profile = useContext(ProfileContext);
  const isMentor = useContext(IsMentorContext);

  if (!profile) return <MyMentoringSkeleton />;

  if (!isMentor) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4 p-8 text-center">
      <h2 className="text-2xl font-semibold">Access Restricted</h2>
      <p className="text-gray-600 max-w-md">
        This page is only available to registered mentors. If you'd like to become a mentor, please{' '}
        <a
          href="mailto:supercurricularadmin@britishschool.sch.ae"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          contact support
        </a>.
      </p>
    </div>
  );

  return (
    <div className="flex h-screen bg-white w-full">
      <MyMentoringContent profile={profile} />
    </div>
  );
};

export default MyMentoringPage;

'use client'

import React, { useContext } from 'react';
import { useParams } from 'next/navigation';
import { ProfileContext } from '@/app/client-layout';
import { MentoringSubjectContent } from './MentoringSubjectContent';
import MentoringSubjectSkeleton from './MentoringSubjectSkeleton';

const SubjectPage = () => {
  const profile = useContext(ProfileContext);
  const params = useParams();
  const subjectUrl = params.subject as string;

  if (!profile) return <MentoringSubjectSkeleton />;

  return (
    <div className="h-screen bg-white w-full">
      <MentoringSubjectContent profile={profile} subjectUrl={subjectUrl} />
    </div>
  );
};

export default SubjectPage;

"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { CalendarX, ChevronRight } from 'lucide-react';
import MeetingCardWithDialog from './MeetingCard';
import { Skeleton } from "@/components/ui/skeleton";
import { getUpcomingMentoringMeetings } from '@/lib/actions';
import type { Meeting } from '@/lib/types';

const SessionsCardSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
        <div className="flex justify-end">
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};

const SessionsCard = ({ isMentor = false }) => {
  const router = useRouter();
  const [activeView, setActiveView] = useState('learning');
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  React.useEffect(() => {
    const loadMeetings = async () => {
      try {
        setIsLoading(true);
        const sessions = await getUpcomingMentoringMeetings();
        setMeetings(sessions);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load meetings'));
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetings();
  }, []);

  if (isLoading) {
    return <SessionsCardSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Sessions</CardTitle>
          <p className="text-sm text-gray-500">Error loading meetings</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-4">
            <p className="text-red-500">Failed to load meetings. Please try again later.</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredMeetings = meetings?.filter(meet => 
    isMentor 
      ? (activeView === 'teaching' ? meet.type === 'teaching' : meet.type === 'mentoring')
      : meet.type === 'mentoring'
  );

  const getNavigationText = () => {
    if (!filteredMeetings?.length) return "Explore Mentors";
    if (filteredMeetings.length > 3) return "See More";
    return "Go to Mentoring";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Sessions</CardTitle>
        <p className="text-sm text-gray-500">Upcoming Mentor Meetings</p>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {isMentor && (
          <div className="flex space-x-1 rounded-md p-1">
            <Toggle
              variant={activeView === 'teaching' ? 'default' : 'outline'}
              pressed={activeView === 'teaching'}
              onPressedChange={() => setActiveView('teaching')}
            >
              Teaching
            </Toggle>
            <Toggle
              variant={activeView === 'learning' ? 'default' : 'outline'}
              pressed={activeView === 'learning'}
              onPressedChange={() => setActiveView('learning')}
            >
              Learning
            </Toggle>
          </div>
        )}

        <div>
          {filteredMeetings?.length ? (
            filteredMeetings.slice(0, 3).map((meet, index) => (
              <MeetingCardWithDialog 
                key={`${meet.meetName}-${meet.date}-${index}`} 
                meeting={meet} 
              />
            ))
          ) : (
            <div className="w-full flex flex-col items-center justify-center text-center rounded-lg py-6">
              <CalendarX className="h-10 w-10 text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No upcoming meetings
              </h4>
              <p className="text-sm text-gray-500 max-w-xs">
                Your schedule is clear. Book a session when you're ready.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end mt-4">
            <Button 
              variant="link" 
              className="p-0" 
              onClick={() => router.push("/mentoring")}
            >
              {getNavigationText()}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionsCard;
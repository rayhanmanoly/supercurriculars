import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X, ChevronRight, BookOpenCheckIcon, UserPlusIcon, BookOpenIcon, TrophyIcon, UsersIcon, BookIcon, HeadphonesIcon, FolderIcon, HeartHandshakeIcon, CalendarX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import EventCardWithDialog from './EventCard';
import ActivityCardWithDialogs from './ActivityWithDialogs';
import { useToast } from "@/components/ui/use-toast";
import { getUserActivities, getUserEvents, uploadPortfolioSubmission } from '@/lib/actions';
import MeetingCardWithDialog from './MeetingCard';
import { Toggle } from './ui/toggle';
import { Meeting, Event, Opportunity } from '@/lib/types';


// Activity Card
export const ActivitiesCard =  ({
  activities,
  onComplete
}: {
  activities: Opportunity[], 
  onComplete: (formData: FormData) => Promise<void>
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const [error, setError] = useState(null);

  const iconMap = {
    'Course': BookOpenIcon,
    'Competition': TrophyIcon,
    'Club': UsersIcon,
    'Reading': BookIcon,
    'Podcast': HeadphonesIcon,
    'Project': FolderIcon,
    'Volunteering': HeartHandshakeIcon
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Activities</CardTitle>
        <p className="text-sm text-gray-500">Current Supercurricular Activities</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities?.length ? (
          activities.slice(0, 3).map(activity => (
            <ActivityCardWithDialogs
              key={activity.opportunity_id}
              activity={activity}
              iconMap={iconMap}
              onActivityComplete={onComplete}
            />
          ))
        ) : (
          <div className="w-full flex flex-col items-center justify-center text-center rounded-lg py-6">
            <X className="h-10 w-10 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No ongoing activities
            </h4>
            <p className="text-sm text-gray-500 max-w-xs">
              You don't have any current activities. Explore the resource hub to begin!
            </p>
          </div>
        )}

        <div className="flex items-center justify-end">
          <Button
            variant="link"
            className="p-0"
            onClick={() => router.push(activities?.length ? "/portfolio" : "/resources")}
          >
            {activities?.length ? (activities.length > 3 ? 'See More' : 'Go to Portfolio') : 'Explore Activities'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Events Card
export const EventsCard = ({events}: {events: Event[]}) => {
  const router = useRouter();
  const [error, setError] = useState(null);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>My Events</CardTitle>
        <p className="text-sm text-gray-500">Upcoming Events</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {events?.length > 0 ? (
          events.slice(0, 3).map(event => (
            <EventCardWithDialog key={event.event_id} event={event} />
          ))
        ) : (
          <div className="w-full flex flex-col items-center justify-center text-center rounded-lg py-6">
            <X className="h-10 w-10 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No upcoming events
            </h4>
            <p className="text-sm text-gray-500 max-w-xs">
              You don't have any upcoming events. Explore the events page to see what's on!
            </p>
          </div>
        )}

        <div className="flex items-center justify-end">
          <Button
            variant="link"
            className="p-0"
            onClick={() => router.push("/events")}
          >
            {events?.length ? (events.length > 3 ? 'See More' : 'Go to Events') : 'Explore Events'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Navigation Buttons
export const NavigationButtons = () => {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => router.push("/resources")}
      >
        <div className="flex items-center">
          <BookOpenCheckIcon className="mr-2 h-4 w-4" />
          Explore Opportunities
        </div>
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => router.push("/mentoring")}
      >
        <div className="flex items-center">
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Book Mentor Sessions
        </div>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};



export const SessionsCard = ({ isMentor = false, meetings}: {isMentor: boolean, meetings: Meeting[]}) => {
  const router = useRouter();
  const [activeView, setActiveView] = useState('teaching');
  const [error, setError] = useState(null);

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
                {(isMentor && activeView === 'teaching')? "You don't have any upcoming meetings to teach." : "Your schedule is clear. Book a session when you're ready."}
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


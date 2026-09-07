'use client'

import { useContext } from 'react';
import { IsMentorContext } from '@/app/client-layout';
import { useDashboardData } from './useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import { ActivitiesCard, EventsCard, SessionsCard, NavigationButtons } from '@/components/DashboardComponents';
import { ProfileData } from '@/lib/types';

interface DashboardContentProps {
  profile: ProfileData;
}

function formatDate(dateString: string): { boldPart: string; year: string } {
  const date = new Date(dateString);
  const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
  const month = date.toLocaleString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return {
    boldPart: `${dayOfWeek}, ${month} ${ordinal(day)}`,
    year: year.toString(),
  };
}

const StatCard = ({ title, value }: { title: string; value: number | string }) => (
  <Card className="flex flex-col items-center justify-center pt-2">
    <CardTitle className="text-2xl font-bold">{value}</CardTitle>
    <CardContent className="text-sm text-gray-500 pb-3">{title}</CardContent>
  </Card>
);

const ProgressCard = ({ completed, ongoing, stars }: { completed: number; ongoing: number; stars: number }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex justify-center">Supercurricular Progress</CardTitle>
    </CardHeader>
    <CardContent className="flex justify-around">
      <StatCard title="Activities Completed" value={completed} />
      <StatCard title="Activities Ongoing" value={ongoing} />
      <StatCard title="Stars Collected" value={stars} />
    </CardContent>
  </Card>
);

export const DashboardContent = ({ profile }: DashboardContentProps) => {
  const { data, isLoading, error, completeActivity } = useDashboardData();
  const isMentor = useContext(IsMentorContext);
  const { toast } = useToast();
  const formattedDate = formatDate(new Date().toISOString());

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

  const { activities, meetings, events, stats } = data;

  const handleActivityComplete = async (formData: FormData) => {
    try {
      await completeActivity(formData);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to complete activity. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex-1 p-4">
      <div className="p-8 flex flex-1">
        <div className="flex-1 pr-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-3xl flex justify-center">
                Welcome Back, {profile.first_name}!
              </CardTitle>
              <p className="text-gray-500 flex justify-center">
                <strong>{formattedDate.boldPart}</strong>, {formattedDate.year}
              </p>
            </CardHeader>
          </Card>

          <ProgressCard completed={stats.completed} ongoing={stats.ongoing} stars={stats.stars} />

          <div className="grid grid-cols-2 gap-6">
            <ActivitiesCard activities={activities} onComplete={handleActivityComplete} />
            <SessionsCard meetings={meetings} isMentor={isMentor} />
          </div>
        </div>

        <div className="w-60">
          <EventsCard events={events} />
          <NavigationButtons />
        </div>
      </div>
    </div>
  );
};

import useSWR from 'swr';
import {
  getUserActivities,
  getUpcomingMentoringMeetings,
  getUserEvents,
  uploadPortfolioSubmission,
} from '@/lib/actions';
import { Opportunity, Meeting, Event } from '@/lib/types';

interface DashboardData {
  activities: Opportunity[];
  meetings: Meeting[];
  events: Event[];
  stats: {
    completed: number;
    ongoing: number;
    stars: number;
  };
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  const [allActivities, meetings, events] = await Promise.all([
    getUserActivities(),
    getUpcomingMentoringMeetings(),
    getUserEvents(),
  ]);

  const completed = allActivities.filter(a => a.status === 'Completed');
  const ongoing = allActivities.filter(a => a.status === 'In Progress');

  return {
    activities: ongoing,
    meetings,
    events,
    stats: {
      completed: completed.length,
      ongoing: ongoing.length,
      stars: completed.reduce((sum, a) => sum + a.weightage, 0),
    },
  };
};

export function useDashboardData() {
  const { data, error, mutate } = useSWR<DashboardData>('dashboardData', fetchDashboardData, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 1000 * 60 * 5,
  });

  const completeActivity = async (formData: FormData) => {
    await uploadPortfolioSubmission(formData);
    await mutate();
  };

  return {
    data,
    error,
    isLoading: !error && !data,
    completeActivity,
    mutate,
  };
}

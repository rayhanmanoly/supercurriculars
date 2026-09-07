import useSWR from 'swr';
import { getUserActivitiesIDs, addToMyCourses, } from '@/lib/actions';
import { Opportunity } from '@/lib/types';

interface ActivitiesData {
  activityIds: string[];
}

const fetchActivities = async (): Promise<ActivitiesData> => {
  const activityIds = await getUserActivitiesIDs();
  return {
   activityIds
  };
};

export function useActivities() {
  const { data, error, mutate } = useSWR<ActivitiesData>(
    'userActivityIds',
    fetchActivities,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 1000 * 60 * 10, // Cache for 5 minutes
    }
  );

  const addActivity = async (opportunityId: string) => {
    try {
      // Optimistically update the cache
      mutate(
        currentData => ({
          activityIds: [...currentData!.activityIds, opportunityId]
        }),
        { revalidate: false }
      );

      // Make the API call
      await addToMyCourses(opportunityId);

      // Revalidate to ensure consistency
      mutate();

      return true;
    } catch (error) {
      // Revalidate to reset to correct state
      mutate();
      throw error;
    }
  };


  const isActivityAdded = (opportunityId: string) => {
    return data?.activityIds.includes(opportunityId) ?? false;
  };

  return {
    activityIds: data?.activityIds ?? [],
    isLoading: !error && !data,
    error,
    addActivity,
    isActivityAdded,
    refresh: () => mutate()
  };
}
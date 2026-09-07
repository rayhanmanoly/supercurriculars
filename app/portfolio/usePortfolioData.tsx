import useSWR from 'swr';
import {
  getUserActivities,
  uploadPortfolioSubmission,
  updatePortfolioSubmission,
  addCustomActivity,
  deleteFile,
} from '@/lib/actions';
import { Opportunity } from '@/lib/types';

interface PortfolioData {
  activities: Opportunity[];
}

const fetchPortfolioData = async (): Promise<PortfolioData> => {
  const activities = await getUserActivities();
  return { activities };
};

export function usePortfolioData() {
  const { data, error, mutate } = useSWR<PortfolioData>('portfolioData', fetchPortfolioData, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 1000 * 60 * 5,
  });

  const completeActivity = async (formData: FormData) => {
    await uploadPortfolioSubmission(formData);
    await mutate();
  };

  const editActivity = async (params: {
    opportunityId: string;
    description: string;
    projectFiles: string[];
    filesToDelete: string[];
  }) => {
    if (params.filesToDelete.length > 0) {
      await Promise.all(params.filesToDelete.map(f => deleteFile(f, 'portfolio')));
    }
    await updatePortfolioSubmission({
      opportunity_id: params.opportunityId,
      description: params.description,
      project_files: params.projectFiles,
    });
    await mutate();
  };

  const addActivity = async (activityData: Partial<Opportunity>) => {
    await addCustomActivity(activityData);
    await mutate();
  };

  return {
    data,
    error,
    isLoading: !error && !data,
    completeActivity,
    editActivity,
    addActivity,
    mutate,
  };
}

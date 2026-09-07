import useSWR from 'swr';
import {
  getUpcomingMentoringMeetings,
  getMentoringData,
  updateMentoringProfile,
} from '@/lib/actions';
import { Meeting } from '@/lib/types';

interface MyMentoringData {
  meetings: Meeting[];
  mentoringProfile: any;
}

const fetchMyMentoringData = async (): Promise<MyMentoringData> => {
  const [sessions, mentoringProfile] = await Promise.all([
    getUpcomingMentoringMeetings(),
    getMentoringData(),
  ]);
  return {
    meetings: sessions.filter((s: any) => s.type === 'teaching'),
    mentoringProfile,
  };
};

export function useMyMentoringData() {
  const { data, error, mutate } = useSWR<MyMentoringData>('myMentoringData', fetchMyMentoringData, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 1000 * 60,
  });

  const updateProfile = async (changes: Record<string, any>) => {
    if (Object.keys(changes).length === 0) return;
    mutate(
      current =>
        current
          ? { ...current, mentoringProfile: { ...current.mentoringProfile, ...changes } }
          : current,
      { revalidate: false }
    );
    try {
      await updateMentoringProfile(changes);
    } catch (err) {
      mutate();
      throw err;
    }
  };

  return {
    meetings: data?.meetings ?? [],
    mentoringProfile: data?.mentoringProfile ?? {},
    isLoading: !error && !data,
    error,
    updateProfile,
    mutate,
  };
}

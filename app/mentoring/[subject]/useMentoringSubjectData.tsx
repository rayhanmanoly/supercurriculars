import useSWR from 'swr';
import { getMentors, getGroupSessions, getUserGroupSessions } from '@/lib/actions';
import { addCalendarEvent } from '@/lib/event_actions';
import { removeEvent } from '@/lib/actions';

interface MentoringSubjectData {
  mentors: any[];
  groupSessions: any[];
  userSessionIds: number[];
}

const fetchSubjectData = async (subject: string): Promise<MentoringSubjectData> => {
  const [mentors, groupSessions, userGroupSessions] = await Promise.all([
    getMentors(subject),
    getGroupSessions(subject),
    getUserGroupSessions(),
  ]);
  return {
    mentors: mentors ?? [],
    groupSessions: groupSessions ?? [],
    userSessionIds: (userGroupSessions ?? []).map((s: any) => s.group_session_id ?? s),
  };
};

export function useMentoringSubjectData(subject: string) {
  const { data, error, mutate } = useSWR<MentoringSubjectData>(
    ['mentoringSubject', subject],
    ([, s]) => fetchSubjectData(s as string),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 1000 * 60 * 5,
    }
  );

  const joinSession = async (event: any) => {
    mutate(
      current =>
        current
          ? { ...current, userSessionIds: [...current.userSessionIds, event.group_session_id] }
          : current,
      { revalidate: false }
    );
    try {
      await addCalendarEvent(event);
    } catch (err) {
      mutate();
      throw err;
    }
  };

  const leaveSession = async (event: any) => {
    mutate(
      current =>
        current
          ? { ...current, userSessionIds: current.userSessionIds.filter(id => id !== event.group_session_id) }
          : current,
      { revalidate: false }
    );
    try {
      await removeEvent(event, 'group_session');
    } catch (err) {
      mutate();
      throw err;
    }
  };

  return {
    mentors: data?.mentors ?? [],
    groupSessions: data?.groupSessions ?? [],
    userSessionIds: data?.userSessionIds ?? [],
    isLoading: !error && !data,
    error,
    joinSession,
    leaveSession,
  };
}

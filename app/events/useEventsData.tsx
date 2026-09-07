import useSWR from 'swr';
import {
  getEvents,
  getUserEventsIDs,
  addToMyEvents,
  removeEvent as removeEventAction,
} from '@/lib/actions';
import { Event } from '@/lib/types';

interface EventsData {
  events: Event[];
  userEventIds: number[];
}

const fetchEventsData = async (): Promise<EventsData> => {
  const [events, userEventIds] = await Promise.all([getEvents(), getUserEventsIDs()]);
  return { events, userEventIds: userEventIds || [] };
};

export function useEventsData() {
  const { data, error, mutate } = useSWR<EventsData>('eventsData', fetchEventsData, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 1000 * 60 * 5,
  });

  const addEvent = async (event: Event) => {
    mutate(
      current =>
        current
          ? { ...current, userEventIds: [...current.userEventIds, event.event_id] }
          : current,
      { revalidate: false }
    );
    try {
      await addToMyEvents(event, 'event', '');
    } catch (err) {
      mutate();
      throw err;
    }
  };

  const removeEvent = async (event: Event) => {
    mutate(
      current =>
        current
          ? { ...current, userEventIds: current.userEventIds.filter(id => id !== event.event_id) }
          : current,
      { revalidate: false }
    );
    try {
      await removeEventAction(event, 'event');
    } catch (err) {
      mutate();
      throw err;
    }
  };

  return {
    events: data?.events ?? [],
    userEventIds: data?.userEventIds ?? [],
    isLoading: !error && !data,
    error,
    addEvent,
    removeEvent,
  };
}

'use client'

import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { SafeImage } from '@/components/SafeImage';
import { Calendar, ChevronRight, Clock, Mail, CalendarPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePickerDemo } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { useEventsData } from './useEventsData';
import EventsSkeleton from './EventsSkeleton';
import { ProfileData, Event } from '@/lib/types';

interface EventsContentProps {
  profile: ProfileData;
}

interface FilterState {
  category: string;
  sub_category: string;
  after_date: Date | null;
  before_date: Date | null;
  onlyUserEvents: boolean;
}

const defaultFilters = (): FilterState => ({
  category: '',
  sub_category: '',
  after_date: null,
  before_date: null,
  onlyUserEvents: false,
});

function formatTime(timeString: string) {
  const [time, offset] = timeString.split('+');
  const [hours, minutes] = time.split(':');
  const date = new Date(Date.UTC(2000, 0, 1, Number(hours), Number(minutes)));
  date.setHours(date.getHours() - parseInt(offset));
  return new Intl.DateTimeFormat('default', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(date);
}

function formatDate(inputDate: any): string {
  try {
    return inputDate.toDateString();
  } catch {
    if (typeof inputDate === 'string') {
      const d = new Date(inputDate);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear().toString().slice(-2);
      return `${day}/${month}/${year}`;
    }
    return '';
  }
}

function compareDateStringToDate(dateString: string, date: Date): number {
  return new Date(dateString).getTime() - date.getTime();
}

function isEventPast(event: Event): boolean {
  if (!event.date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(event.date) < today;
}

function sortWithPastLast(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const aPast = isEventPast(a);
    const bPast = isEventPast(b);
    if (aPast === bPast) return 0;
    return aPast ? 1 : -1;
  });
}

function getUpcomingEventsView(
  events: Event[],
  profile: ProfileData,
  userEventIds: number[]
): { [key: string]: Event[] } {
  const upcoming: { [key: string]: Event[] } = {};
  events.forEach(event => {
    if (!upcoming[event.category]) upcoming[event.category] = [];
    const yearMatch =
      Array.isArray(event.year_groups) && event.year_groups.includes(profile.current_year!);
    if (yearMatch) upcoming[event.category].push(event);
  });
  Object.keys(upcoming).forEach(key => {
    upcoming[key] = sortWithPastLast(upcoming[key]);
  });
  return upcoming;
}

export const EventsContent = ({ profile }: EventsContentProps) => {
  const { events, userEventIds, isLoading, error, addEvent, removeEvent } = useEventsData();
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>(defaultFilters());
  const [tempFilters, setTempFilters] = useState<FilterState>(defaultFilters());
  const [openEventId, setOpenEventId] = useState<number | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const isSearching = useMemo(() => {
    const hasActiveFilters = Object.entries(filters).some(([, value]) => {
      if (value === null) return false;
      if (typeof value === 'boolean') return value;
      return value !== '';
    });
    return searchTerm !== '' || hasActiveFilters;
  }, [searchTerm, filters]);

  const filteredEvents = useMemo(() => {
    if (!isSearching) return sortWithPastLast(events);
    const filtered = events.filter(event => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.sub_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        searchTerm === '';
      const matchesCategory = !filters.category || event.category === filters.category;
      const matchesSubCategory =
        filters.sub_category === '' ||
        event.sub_category.toLowerCase().includes(filters.sub_category.toLowerCase());
      const matchesDate =
        (!filters.before_date && !filters.after_date) ||
        !event.date ||
        ((!filters.before_date || compareDateStringToDate(event.date, filters.before_date) <= 0) &&
          (!filters.after_date || compareDateStringToDate(event.date, filters.after_date) >= 0));
      const matchesUserEvents = !filters.onlyUserEvents || userEventIds.includes(event.event_id);
      return matchesSearch && matchesCategory && matchesSubCategory && matchesDate && matchesUserEvents;
    });
    return sortWithPastLast(filtered);
  }, [events, searchTerm, filters, userEventIds, isSearching]);

  const upcomingEventsView = useMemo(
    () => getUpcomingEventsView(events, profile, userEventIds),
    [events, profile, userEventIds]
  );

  const handleTempFilterChange = (filterName: string, value: any) => {
    setTempFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleSaveFilters = () => {
    setFilters({ ...tempFilters });
    setIsFilterSheetOpen(false);
  };

  const handleResetFilters = () => {
    const reset = defaultFilters();
    setTempFilters(reset);
    setFilters(reset);
    setIsFilterSheetOpen(false);
  };

  const handleAddToEvents = async (event: Event) => {
    try {
      await addEvent(event);
      toast({ title: 'Event Added', description: `${event.title} has been added to your Calendar.` });
      setOpenEventId(null);
    } catch (err: any) {
      if (err?.message === 'RE_AUTHENTICATION_REQUIRED') {
        toast({
          title: 'Session Expired',
          description: 'Your session is expired. Please sign in again.',
          variant: 'destructive',
          action: (
            <ToastAction onClick={() => router.push('/login')} altText="Log In">
              Log In
            </ToastAction>
          ),
        });
      } else {
        toast({ title: 'Error', description: 'Failed to add event. Please try again.', variant: 'destructive' });
      }
    }
  };

  const handleRemoveEvent = async (event: Event) => {
    try {
      await removeEvent(event);
      toast({ title: 'Event Removed', description: `${event.title} has been removed from your Calendar.` });
      setOpenEventId(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to remove event. Please try again.', variant: 'destructive' });
    }
  };

  const renderEventCard = (event: Event) => {
    const past = isEventPast(event);
    return (
    <Sheet
      key={event.event_id}
      open={openEventId === event.event_id}
      onOpenChange={isOpen => setOpenEventId(isOpen ? event.event_id : null)}
    >
      <SheetTrigger asChild>
        <Card className={`flex flex-col items-center justify-center text-center w-full${past ? ' opacity-60' : ''}`}>
          <CardContent className="flex flex-col flex-grow pt-6 items-center justify-center">
            <div className="flex w-full gap-2 mb-1 empty:hidden">
              {past && <Badge variant="secondary">Past</Badge>}
              {userEventIds.includes(event.event_id) && (
                <Badge variant="outline">Added to Calendar</Badge>
              )}
            </div>
            {event.poster && (
              <SafeImage src={event.poster} alt={event.title} width={180} height={180} className="mb-4" />
            )}
            <h3 className="text-xl font-semibold h-16">{event.title}</h3>
            <p className="text-sm text-muted-foreground h-10 line-clamp-2">{event.sub_category}</p>
          </CardContent>
          <CardFooter className="bg-gray-100 w-full p-4">
            <div className="flex flex-row items-center w-full">
              <div className="flex items-center text-sm text-gray-500 flex-grow">
                <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                <span>{formatDate(event.date)}</span>
              </div>
              <Button variant="outline" size="sm">
                Details <ChevronRight className="w-4 h-4 ml-1 text-gray-400" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">{event.title}</SheetTitle>
          <SheetDescription>
            <Badge variant="default" className="mr-2">{event.category}</Badge>
            <Badge variant="secondary" className="mr-2">{event.sub_category}</Badge>
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {event.poster && (
            <div className="flex justify-center pb-2">
              <SafeImage src={event.poster} width={140} height={140} alt={event.title} />
            </div>
          )}
          <p className="text-gray-700 mb-4">{event.description}</p>
          <div className="flex flex-col items-left space-y-2 w-full">
            <h4 className="font-semibold mb-2">Details</h4>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>
                {formatTime(event.start_time as string)} - {formatTime(event.end_time as string)}
              </span>
            </div>
            {event.contact_name && event.contact_email && (
              <Button variant="outline" className="w-hug justify-start mb-2" asChild>
                <a href={`mailto:${event.contact_email}`} target="_blank" rel="noopener noreferrer">
                  <Mail className="mr-2 h-4 w-4" /> {event.contact_name}
                </a>
              </Button>
            )}
          </div>
        </div>
        <SheetFooter className="mt-6">
          {!userEventIds.includes(event.event_id) ? (
            <Button onClick={() => handleAddToEvents(event)} className="w-full">
              <CalendarPlus className="w-5 h-5 mr-2" />
              Add to Google Calendar
            </Button>
          ) : (
            <Button onClick={() => handleRemoveEvent(event)} className="w-full" variant="destructive">
              Remove from Google Calendar
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
    );
  };

  const renderFilters = () => (
    <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="ml-2">Filters</Button>
      </SheetTrigger>
      <SheetContent className="w-max">
        <ScrollArea className="h-full w-full rounded-md">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block mb-2">Event Category</label>
              <select
                value={tempFilters.category}
                onChange={e => handleTempFilterChange('category', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Types</option>
                <option value="House Competition">House Competitions</option>
                <option value="Talk">Talks</option>
                <option value="External Event">External Events</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Sub Category</label>
              <Input
                value={tempFilters.sub_category}
                onChange={e => handleTempFilterChange('sub_category', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-3">Event After</label>
              <DatePickerDemo
                date={tempFilters.after_date}
                setDate={date => handleTempFilterChange('after_date', date)}
              />
            </div>
            <div>
              <label className="block mb-3">Event Before</label>
              <DatePickerDemo
                date={tempFilters.before_date}
                setDate={date => handleTempFilterChange('before_date', date)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlyUserEvents"
                checked={tempFilters.onlyUserEvents}
                onCheckedChange={checked => handleTempFilterChange('onlyUserEvents', checked)}
              />
              <label htmlFor="onlyUserEvents">Only Show My Events</label>
            </div>
          </div>
          <SheetFooter className="mt-4">
            <Button onClick={handleResetFilters} variant="outline">Reset</Button>
            <Button onClick={handleSaveFilters}>Save Filters</Button>
          </SheetFooter>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );

  const renderUpcomingEvents = () => (
    <div className="space-y-8 w-full">
      <h1 className="text-2xl font-semibold mb-4">Upcoming Events</h1>
      {Object.entries(upcomingEventsView).map(([type, typeEvents]) =>
        typeEvents.length > 0 ? (
          <div key={type} className="w-[90%] space-x-10">
            <h2 className="text-xl font-semibold mb-4">{type}s</h2>
            <Carousel opts={{ loop: true }} className="w-full">
              <CarouselContent className="-ml-2">
                {typeEvents.map(event => (
                  <CarouselItem key={event.event_id} className="md:basis-1/2 lg:basis-1/3 pl-2">
                    {renderEventCard(event)}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        ) : null
      )}
    </div>
  );

  const renderSearchResults = () => (
    <div>
      <h1 className="text-xl font-semibold mb-6">Search Results</h1>
      {filteredEvents.length === 0 ? (
        <p className="text-gray-500">No events match your search.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map(renderEventCard)}
        </div>
      )}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Calendar className="w-12 h-12 text-gray-300 mb-4" />
      <h2 className="text-lg font-semibold text-gray-600 mb-2">No upcoming events for your year group</h2>
      <p className="text-sm text-gray-400">Check back later, or use the search bar to browse all events.</p>
    </div>
  );

  const hasYearGroupEvents = Object.values(upcomingEventsView).some(arr => arr.length > 0);

  if (isLoading) return <EventsSkeleton />;
  if (error) return <div>Error loading events. Please try again.</div>;

  return (
    <div className="h-screen bg-white w-full p-8">
      <h1 className="text-2xl font-semibold mb-6">Events</h1>
        <div className="flex mb-6 items-center">
          <div className="relative flex-grow mr-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search Events"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
          {renderFilters()}
        </div>
        {isSearching
          ? renderSearchResults()
          : hasYearGroupEvents
            ? renderUpcomingEvents()
            : renderEmptyState()}
    </div>
  );
};

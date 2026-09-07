'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileData } from '@/lib/types';
import { useMentoringSubjectData } from './useMentoringSubjectData';
import MentoringSubjectSkeleton from './MentoringSubjectSkeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Calendar, CalendarIcon, CalendarPlus, ChevronRight, Clock, Clock1, ExternalLink, Loader2, Mail, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetTrigger, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import MultiSelectWithReactSelect from '@/components/MultiSelectWithReact';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { filteredSubjects, yearGroups } from '@/lib/globals';

interface MentoringSubjectContentProps {
  profile: ProfileData;
  subjectUrl: string;
}

interface FilterState {
  year_groups: number[];
  subjects: string[];
  degree: string;
  type: string;
}

const defaultFilters = (): FilterState => ({
  year_groups: [],
  subjects: [],
  degree: '',
  type: '',
});

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timeString: string) {
  const [time, offset] = timeString.split('+');
  const [hours, minutes] = time.split(':');
  const date = new Date(Date.UTC(2000, 0, 1, Number(hours), Number(minutes)));
  date.setHours(date.getHours() - parseInt(offset));
  return new Intl.DateTimeFormat('default', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(date);
}

function formatShortDate(dateString: string) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

function formatPossessiveName(firstName: string) {
  return firstName.endsWith('s') || firstName.endsWith('z')
    ? `${firstName}' Subjects`
    : `${firstName}'s Subjects`;
}

// Phase 2 reference: in-app Google Appointment Schedule iframe.
// Disabled because Google sets X-Frame-Options: SAMEORIGIN on calendar.app.google
// (and the sign-in redirect students hit), so the iframe cannot render on our origin.
// Kept here so the native Calendar-API booking flow can replace it without re-wiring.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const GoogleAppointmentScheduler = ({ mentorScheduleLink }: { mentorScheduleLink: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="relative w-full sm:h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      <iframe
        src={mentorScheduleLink}
        style={{ border: 0, width: '100%', height: '100%' }}
        allow="storage-access"
        frameBorder="0"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

export const MentoringSubjectContent = ({ profile, subjectUrl }: MentoringSubjectContentProps) => {
  const subject = filteredSubjects.find(s => s.url === subjectUrl);
  const { toast } = useToast();
  const router = useRouter();

  const { mentors, groupSessions, userSessionIds, isLoading, error, joinSession, leaveSession } =
    useMentoringSubjectData(subject?.value ?? '');

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>(defaultFilters());
  const [tempFilters, setTempFilters] = useState<FilterState>(defaultFilters());
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any | null>(null);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  const handleOpenMentor = (mentor: any) => {
    setIsSchedulerOpen(false);
    setSelectedMentor(mentor);
  };

  const handleCloseMentor = () => {
    setIsSchedulerOpen(false);
    setSelectedMentor(null);
  };

  const isSearching = useMemo(() => {
    const hasActiveFilters = Object.entries(filters).some(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== '' && value !== 0;
    });
    return searchTerm !== '' || hasActiveFilters;
  }, [searchTerm, filters]);

  const filteredMentors = useMemo(() => {
    if (!isSearching) return mentors;
    return mentors.filter(mentor => {
      const matchesSearch =
        mentor.profiles.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.profiles.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        searchTerm === '';
      const matchesYearGroups =
        filters.year_groups.length === 0 ||
        (Array.isArray(mentor.profiles.year_groups) &&
          filters.year_groups.some((y: number) => mentor.profiles.year_groups.includes(y)));
      const matchesSubjects =
        filters.subjects.length === 0 ||
        filters.subjects.some((s: string) => (mentor.profiles.subjects || []).includes(s));
      return matchesSearch && matchesYearGroups && matchesSubjects;
    });
  }, [mentors, searchTerm, filters, isSearching]);

  const handleTempFilterChange = (filterName: string, value: any) => {
    setTempFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleSubjectChange = (selected: any) => handleTempFilterChange('subjects', selected.map((o: any) => o.value));
  const handleYearGroupChange = (selected: any) => handleTempFilterChange('year_groups', selected.map((o: any) => parseInt(o.value)));

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

  const handleAddToEvents = async (event: any) => {
    try {
      await joinSession(event);
      toast({ title: 'Event Added', description: `${event.title} has been added to your Calendar.` });
      setOpenSessionId(null);
    } catch (err: any) {
      if (err?.message === 'RE_AUTHENTICATION_REQUIRED') {
        toast({
          title: 'Session Expired',
          description: 'Your session is expired. Please sign in again.',
          variant: 'destructive',
          action: <ToastAction onClick={() => router.push('/login')} altText="Log In">Log In</ToastAction>,
        });
      } else {
        toast({ title: 'Error', description: 'Failed to add event. Please try again.', variant: 'destructive' });
      }
    }
  };

  const handleRemoveEvent = async (event: any) => {
    try {
      await leaveSession(event);
      toast({ title: 'Event Removed', description: `${event.title} has been removed from your Calendar.` });
      setOpenSessionId(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to remove event. Please try again.', variant: 'destructive' });
    }
  };

  const renderFilters = () => (
    <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="ml-2">Filters</Button>
      </SheetTrigger>
      <SheetContent className="w-max">
        <ScrollArea className="h-full w-full rounded-md">
          <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block mb-2">Session Type</label>
              <select value={tempFilters.type} onChange={e => handleTempFilterChange('type', e.target.value)} className="w-full p-2 border rounded">
                <option value="">All Types</option>
                <option value="Individual">Individual</option>
                <option value="Group">Group</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Mentor's Subjects</label>
              <MultiSelectWithReactSelect options={filteredSubjects} value={tempFilters.subjects.map(s => ({ value: s, label: s }))} onChange={handleSubjectChange} />
            </div>
            <div>
              <label className="block mb-2">Mentor Year Groups</label>
              <MultiSelectWithReactSelect options={yearGroups} value={tempFilters.year_groups.map(y => ({ value: y.toString(), label: `Year ${y}` }))} onChange={handleYearGroupChange} />
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

  const renderMentorCard = (mentor: any) => (
    <Card
      key={mentor.mentor_id}
      className="flex flex-col items-center justify-center text-center w-full cursor-pointer"
      onClick={() => handleOpenMentor(mentor)}
    >
      <CardContent className="pt-6 w-full flex flex-col items-center">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src={mentor.profiles.profile_url} alt={mentor.profiles.first_name} className="object-cover" />
          <AvatarFallback className="text-xl font-semibold">{mentor.profiles.first_name[0]}{mentor.profiles.last_name[0]}</AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-semibold mb-2">{mentor.profiles.first_name} {mentor.profiles.last_name}</h3>
      </CardContent>
      <CardFooter className="bg-gray-100 w-full p-4">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-gray-500">Year {mentor.profiles.current_year}</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </CardFooter>
    </Card>
  );

  const renderMentorSheet = () => {
    if (!selectedMentor) return null;
    const mentor = selectedMentor;
    return (
      <Sheet open={true} onOpenChange={isOpen => !isOpen && handleCloseMentor()}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <div className="flex items-center">
              <Avatar className="w-16 h-16">
                <AvatarImage src={mentor.profiles.profile_url} alt={mentor.profiles.first_name} className="object-cover" />
                <AvatarFallback className="text-base font-semibold">{mentor.profiles.first_name[0]}{mentor.profiles.last_name[0]}</AvatarFallback>
              </Avatar>
              <div className="ml-4">
                <SheetTitle className="text-2xl font-bold">{mentor.profiles.first_name} {mentor.profiles.last_name}</SheetTitle>
                <SheetDescription>Year {mentor.profiles.current_year}</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="mt-6">
            <p className="text-gray-700 mb-6">{mentor.description}</p>
            <div className="flex justify-between">
              <div className="w-[75%] mr-2">
                <h4 className="font-semibold mb-4">{formatPossessiveName(mentor.profiles.first_name)}</h4>
                <div className="grid grid-col-1 gap-4">
                  {mentor.profiles.subjects?.map((s: string) => (
                    <div key={s} className="flex items-center">
                      <Image src={`/img/${s}.png`} alt={s} width={24} height={24} />
                      <span className="ml-2">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator orientation="vertical" />
              <div className="w-[100%] ml-2">
                <h4 className="font-semibold mb-4">Schedule a Meeting</h4>
                <p className="text-sm mb-2">Availability</p>
                <p className="text-sm text-gray-500 mb-4">{mentor.availability_text}</p>
                <p className="text-sm mb-2">Questions?</p>
                {mentor.email && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`mailto:${mentor.email}`} target="_blank" rel="noopener noreferrer">
                      <Mail className="mr-2 h-4 w-4" /> {mentor.profiles.first_name} {mentor.profiles.last_name}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <SheetFooter className="mt-8 flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              className="w-full"
              disabled={!mentor.google_appointment_link}
              onClick={() =>
                mentor.google_appointment_link &&
                window.open(mentor.google_appointment_link, '_blank', 'noopener,noreferrer')
              }
            >
              {mentor.google_appointment_link ? (
                <>
                  Open Booking Page
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Booking page not yet configured'
              )}
            </Button>
            {mentor.google_appointment_link && (
              <p className="text-xs text-muted-foreground text-center">
                Opens in a new tab.
              </p>
            )}
            {/*
              Phase 2: revive in-app booking with a native Google Calendar API flow.
              The iframe approach below is blocked by Google's X-Frame-Options on
              calendar.app.google. Kept as reference for when the native flow lands.

              <Dialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">Proceed to Booking Page</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[100%]">
                  <DialogHeader>
                    <DialogTitle>Schedule an Appointment with {mentor.profiles.first_name}</DialogTitle>
                    <DialogDescription>Choose a time slot that works for you.</DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <GoogleAppointmentScheduler mentorScheduleLink={mentor.google_appointment_link} />
                  </div>
                </DialogContent>
              </Dialog>
            */}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  };

  const renderGroupCard = (groupSession: any) => (
    <Sheet key={groupSession.group_session_id} open={openSessionId === String(groupSession.group_session_id)} onOpenChange={isOpen => setOpenSessionId(isOpen ? String(groupSession.group_session_id) : null)}>
      <SheetTrigger asChild>
        <Card className="flex flex-col w-full cursor-pointer">
          <CardContent className="pt-6 flex-1">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-base font-semibold leading-snug">{groupSession.title}</h3>
              {userSessionIds.includes(groupSession.group_session_id) && (
                <Badge variant="outline" className="ml-2 shrink-0 text-xs">Added</Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-2">{groupSession.subjects?.map(String).join(' · ')}</p>
            {groupSession.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{groupSession.description}</p>
            )}
          </CardContent>
          <CardFooter className="bg-gray-100 w-full px-4 py-3">
            <div className="flex items-center w-full gap-3">
              <div className="flex items-center text-xs text-gray-500 gap-1">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{formatShortDate(groupSession.date)}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500 gap-1">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{formatTime(groupSession.start_time)}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </div>
          </CardFooter>
        </Card>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <div className="ml-4">
            <SheetTitle className="text-2xl font-bold">{groupSession.title}</SheetTitle>
            <SheetDescription>{groupSession.subjects?.map(String).join(' | ')}</SheetDescription>
          </div>
        </SheetHeader>
        <div className="mt-6">
          <p className="text-gray-700 mb-6">{groupSession.description}</p>
          <div className="flex justify-between">
            <div className="w-[75%] mr-2">
              <h4 className="font-semibold mb-4">Event Details</h4>
              <div className="grid grid-col-1 gap-4">
                <div className="flex items-center"><CalendarIcon className="w-5 h-5 mr-2" /><span>{formatDate(groupSession.date)}</span></div>
                <div className="flex items-center"><Clock1 className="w-5 h-5 mr-2" /><span>{formatTime(groupSession.start_time)} - {formatTime(groupSession.end_time)}</span></div>
              </div>
            </div>
            <Separator orientation="vertical" />
            <div className="w-[100%] ml-2">
              <h4 className="font-semibold mb-4">Mentor Details</h4>
              <div className="flex justify-start gap-2">
                <Avatar className="w-12 h-12 mb-4">
                  <AvatarImage src={groupSession.profiles?.profile_url} alt={groupSession.profiles?.first_name} />
                  <AvatarFallback>{groupSession.profiles?.first_name[0]}{groupSession.profiles?.last_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm mb-2">{groupSession.profiles?.first_name} {groupSession.profiles?.last_name}</p>
                  <p className="text-sm text-gray-500 mb-4">Year {groupSession.profiles?.current_year}</p>
                </div>
              </div>
              {groupSession.mentors?.email && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`mailto:${groupSession.mentors.email}`} target="_blank" rel="noopener noreferrer">
                    <Mail className="mr-2 h-4 w-4" /> {groupSession.profiles?.first_name} {groupSession.profiles?.last_name}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
        <SheetFooter className="mt-8">
          {!userSessionIds.includes(groupSession.group_session_id) ? (
            <Button onClick={() => handleAddToEvents(groupSession)} className="w-full">
              <CalendarPlus className="w-5 h-5 mr-2" />Add to Google Calendar
            </Button>
          ) : (
            <Button onClick={() => handleRemoveEvent(groupSession)} className="w-full" variant="destructive">
              Remove from Google Calendar
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  if (isLoading) return <MentoringSubjectSkeleton />;
  if (error) return <div>Error loading mentors. Please try again.</div>;
  if (!subject) return <div>Subject not found.</div>;

  return (
    <div className="h-screen bg-white w-full p-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/mentoring">Mentoring</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{subject.value}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        {groupSessions.length > 0 && (
          <section className="pt-4 pb-4">
            <h2 className="text-xl font-semibold mb-4">Group Sessions</h2>
            <Carousel className="mx-12">
              <CarouselContent>
                {groupSessions.map(session => (
                  <CarouselItem key={session.group_session_id} className="basis-72 md:basis-80">{renderGroupCard(session)}</CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </section>
        )}

        <h2 className="text-xl font-semibold mb-4 pt-4">Individual Sessions</h2>
        <div className="flex mb-6 items-center">
          <div className="relative flex-grow mr-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search Mentors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
          {renderFilters()}
        </div>
        {isSearching || filteredMentors.length === 0 ? (
          <div>
            <h1 className="text-xl font-semibold mb-6">Search Results</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentors.map(renderMentorCard)}
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-semibold mb-6">Available Mentors</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentors.map(renderMentorCard)}
            </div>
          </div>
        )}
      {renderMentorSheet()}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, PlusIcon, EditIcon, TrashIcon, ChevronRightIcon } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import {getMentoringGroupSessions } from '@/lib/actions';
import { createGroupSession, editGroupSession, deleteGroupSession} from '@/lib/event_actions';
import MultiSelectWithReactSelect from './MultiSelectWithReact';
import { DatePickerDemo } from './DatePicker';
import { debugLog } from '@/lib/debug';

const GroupMentoringEventsManager = ({ mentorSubjects, yearGroups }: { mentorSubjects: any[]; yearGroups: any[] }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [isAllEventsDialogOpen, setIsAllEventsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const { toast } = useToast();

  const [eventForm, setEventForm] = useState<any>({
    group_session_id: null,
    title: '',
    date: new Date(),
    start_time: '',
    end_time: '',
    subjects: [],
    applicable_year_groups: [],
    description: '',
    google_event_id: '',
    iCalUID: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const sortEvents = (events: any[]) => {
    return events.sort((a: any, b: any) => {
      const dateA = new Date(`${a.date}T${a.start_time}`);
      const dateB = new Date(`${b.date}T${b.start_time}`);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const fetchEvents = async () => {
    try {
      const fetchedEvents = await getMentoringGroupSessions();
      const sortedEvents = sortEvents(fetchedEvents); //sort by date asc
      setEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = (event: any) => {
    setEventToDelete(event)
    setIsDeleteConfirmOpen(true)
  }

  const handleInputChange = (field: string, value: any) => { //updates temp_filters
    setEventForm((prevFilters: any) => ({ ...prevFilters, [field]: value }));
  };

  const handleSubjectChange = (selected: any[]) => {
    handleInputChange('subjects', selected.map(option => option.value))
  };

  const handleYearGroupChange = (selected: any[]) => {
    handleInputChange('applicable_year_groups', selected.map(option => parseInt(option.value)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    debugLog('Previous data:',eventForm)
    const transformedEventData = transformEventFormData(eventForm, isEditing);
    let updatedEvents;

    if (isEditing) {
      debugLog('This is the group session data:',eventForm)
      debugLog('gs_id:',eventForm.group_session_id)
      await editGroupSession({...transformedEventData, group_session_id: eventForm.group_session_id});
      updatedEvents = events.map(event => 
        event.group_session_id === currentEvent.group_session_id ? { ...event, ...transformedEventData } : event
      );
      toast({
        title: "Success",
        description: "Event updated successfully.",
      });
    } else {
      debugLog('Event to be added:',transformedEventData)
      const newEvent = await createGroupSession(transformedEventData);
      updatedEvents = [...events, newEvent];
      toast({
        title: "Success",
        description: "New event created successfully.",
      });
    }

    const sortedEvents = sortEvents(updatedEvents);
    setEvents(sortedEvents);
    setIsDialogOpen(false);
  } catch (error) {
    console.error("Error saving event:", error);
    toast({
      title: "Error",
      description: "Failed to save event. Please try again.",
      variant: "destructive",
    });
  }
};

  const handleDelete = async (deleteEvent: any) => {
    try {
      await deleteGroupSession(deleteEvent);
      const updatedEvents = events.filter(event => event.group_session_id !== deleteEvent.group_session_id);
      setEvents(updatedEvents);
      toast({
        title: "Success",
        description: "Event deleted successfully.",
      });
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  };


  function transformEventFormData(eventForm: any, _isEditing?: boolean) {
    // Helper function to format time
    function formatTime(timeString: string) {
      // Parse the time string
      const [hours, minutes] = timeString.split(':').map(Number);
    
      // Create a new Date object for today's date
      const date = new Date();
    
      // Set the time
      date.setHours(hours, minutes, 0, 0);
    
      // Format the date with the local timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
        hour12: false,
      });
      
      return formatter.format(date);
    }
  
    // Helper function to format date
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    };
  
    const transformedData: any = {
      title: eventForm.title,
      date: formatDate(eventForm.date),
      start_time: formatTime(eventForm.start_time),
      end_time: formatTime(eventForm.end_time),
      subjects: eventForm.subjects,
      applicable_year_groups: eventForm.applicable_year_groups,
      description: eventForm.description
    };
    // Include group_session_id only if editing an existing session
    if (isEditing && eventForm.group_session_id) {
      transformedData.group_session_id = eventForm.group_session_id;
      transformedData.google_event_id = eventForm.google_event_id
      transformedData.iCalUID = eventForm.iCalUID
    }
  
    return transformedData;
  }

  function formatTimeForUpdate(timeString: string) {
    // Parse the time string
    const [time, offset] = timeString.split('+');
    const [hours, minutes] = time.split(':');
  
    // Create a date object for today
    const date = new Date();
    
    // Set the time components
    date.setUTCHours(parseInt(hours, 10));
    date.setUTCMinutes(parseInt(minutes, 10));
    date.setUTCSeconds(0);
  
    // Adjust for the timezone offset
    const offsetMinutes = parseInt(offset, 10) * 60;
    date.setUTCMinutes(date.getUTCMinutes() - offsetMinutes);
  
    // Format the time in the user's local timezone
    const formatter = new Intl.DateTimeFormat('default', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  
    return formatter.format(date);
  }

  const openDialog = (event: any = null) => {
    if (event) {
      setIsEditing(true);
      setCurrentEvent(event);
      debugLog('Opendialog event',event)
      setEventForm({
        ...event,
        group_session_id: event.group_session_id,
        date: new Date(event.date),
        start_time: formatTimeForUpdate(event.start_time),
        end_time: formatTimeForUpdate(event.end_time),
        google_event_id: event.google_event_id,
        iCalUID: event.iCalUID

      });
    } else {
      setIsEditing(false);
      setCurrentEvent(null);
      setEventForm({
        group_session_id: null,
        title: '',
        date: new Date(),
        start_time: '',
        end_time: '',
        subjects: [],
        applicable_year_groups: [],
        description: '',
        google_event_id: '',
        iCalUID: ''
      });
    }
    setIsDialogOpen(true);
    debugLog('Eventform:',eventForm)
  };

  const renderEventCard = (event: any) => (
    <Card key={event.group_session_id} className="mb-4">
      <CardContent className="flex justify-between items-center p-4">
        <div>
          <h3 className="font-semibold">{event.title}</h3>
          <p className="text-sm text-gray-500">{event.date} | {event.start_time} - {event.end_time}</p>
        </div>
        <div>
          <Button variant="ghost" onClick={() => openDialog(event)}>
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => handleConfirmDelete(event)}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Group Mentoring Events</CardTitle>
        <Button onClick={() => openDialog()}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </CardHeader>
      <CardContent>
        {events.slice(0, 3).map(renderEventCard)}
        {events.length > 3 && (
          <Button variant="link" onClick={() => setIsAllEventsDialogOpen(true)}>
            See More <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Name</Label>
                <Input id="title" name="title" value={eventForm.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
              </div>
              <div className='flex flex-col gap-1'>
                <Label className = 'space y-2' htmlFor="date">Date</Label>
                <DatePickerDemo 
              date={eventForm.date} 
              setDate={(date) => handleInputChange('date', date)} 
            /></div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input id="start_time" name="start_time" type="time" value={eventForm.start_time} onChange={(e) => handleInputChange('start_time', e.target.value)} required />
                </div>
                <div className="flex-1">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input id="end_time" name="end_time" type="time" value={eventForm.end_time} onChange={(e) => handleInputChange('end_time', e.target.value)} required />
                </div>
              </div>
              <Label className='font-normal'>Enter the event times in local timezone</Label>
              <div>
                <Label htmlFor="subjects">Subjects</Label>
                <MultiSelectWithReactSelect
                  options={mentorSubjects.map(subject => ({ value: subject, label: subject }))}
                  value={eventForm.subjects.map((subject: any) => ({value: subject, label: subject}))}
                  onChange={handleSubjectChange}
                />
              </div>
              <div>
                <Label htmlFor="applicable_year_groups">Applicable Year Groups</Label>
                <MultiSelectWithReactSelect
                  options={yearGroups}
                  value={eventForm.applicable_year_groups.map((year: any) => ({value: year.toString(), label: `Year ${year}`}))}
                  onChange={handleYearGroupChange}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={eventForm.description} onChange={(e) => handleInputChange('description', e.target.value)} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit">{isEditing ? 'Update Event' : 'Create Event'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAllEventsDialogOpen} onOpenChange={setIsAllEventsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>All Group Mentoring Events</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {events.map(renderEventCard)}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              "{eventToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(eventToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default GroupMentoringEventsManager;
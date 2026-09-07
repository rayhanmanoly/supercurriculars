import React, { useState } from 'react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Mail, ChevronRight, TrophyIcon, SpeechIcon, UsersRoundIcon } from 'lucide-react';
import { SafeImage } from '@/components/SafeImage';
import { Event } from '@/lib/types';

const EventCardWithDialog = ({ event }: { event: Event }) => {
  const [isOpen, setIsOpen] = useState(false);

  
const eventMap = {
    'House Competition': TrophyIcon,
    'Talk': SpeechIcon,
    'External Event': UsersRoundIcon,
  } as const;
  type EventCategory = keyof typeof eventMap;
  const Icon = eventMap[event.category as EventCategory] || UsersRoundIcon;
  
  const formatDate = (inputDate: string) => {
    try {
      return new Date(inputDate).toDateString();
    } catch (error) {
      if (typeof inputDate === 'string') {
        const formattedDate = new Date(inputDate);
        const day = formattedDate.getDate().toString().padStart(2, '0');
        const month = (formattedDate.getMonth() + 1).toString().padStart(2, '0');
        const year = formattedDate.getFullYear().toString().slice(-2);
        return `${day}/${month}/${year}`;
      }
    }
  };

  function formatShortDate(dateString: string): string {
    // Create a Date object from the input string
    const date = new Date(dateString);
    
    // Get the day and month
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() returns 0-11
    
    // Return the formatted date string
    return `${day}/${month}`;
  }

  const formatTime = (timeString: string) => {
    const [time, offset] = timeString.split('+');
    const [hours, minutes] = time.split(':');
    const date = new Date(Date.UTC(2000, 0, 1, parseInt(hours), parseInt(minutes)));
    date.setHours(date.getHours() - parseInt(offset));
    return new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(date);
  };

  return (
    <>
      <Card 
        className='flex flex-col items-left justify-center pt-2 cursor-pointer hover:bg-gray-100' 
        onClick={() => setIsOpen(true)}
      >
        <CardTitle className='text-sm font-medium pl-2 pb-1'>
          <div className="flex items-center overflow-hidden">
          <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{event.title}</span>
        </div>
        </CardTitle>
        <CardContent className='text-xs text-gray-500 pl-2 pb-2'>
          {formatShortDate(event.date)} | {formatTime(event.start_time)} - {formatTime(event.end_time)}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold'>{event.title}</DialogTitle>
            <DialogDescription>
              <Badge variant="default" className='mr-2'>{event.category}</Badge>
              <Badge variant="secondary" className='mr-2'>{event.sub_category}</Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            {event.poster && (
              <div className='flex justify-center pb-2'>
                <SafeImage src={event.poster} width={140} height={140} alt={event.title} />
              </div>
            )}
            <p className="text-gray-700 mb-4">{event.description}</p>
            <div className='flex flex-col items-left space-y-2 w-full'>
              <h4 className="font-semibold mb-2">Details</h4>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
              </div>
              {event.contact_name && event.contact_email && (
                <Button variant="outline" className="w-full justify-start mb-2" asChild>
                  <a href={`mailto:${event.contact_email}`} target="_blank" rel="noopener noreferrer">
                    <Mail className="mr-2 h-4 w-4" /> {event.contact_name}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventCardWithDialog;
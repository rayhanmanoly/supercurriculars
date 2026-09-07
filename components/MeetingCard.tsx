import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Mail, ChevronRight } from 'lucide-react';
import { Meeting } from '@/lib/types';

const MeetingCardWithDialog = ({ meeting }: { meeting: Meeting }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateString: string) => {
    // Create a Date object from the input string
    const date = new Date(dateString);
    
    // Get the day and month
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() returns 0-11
    
    // Return the formatted date string
    return `${day}/${month}`;
  }
  
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return new Date(0, 0, 0, parseInt(hours), parseInt(minutes)).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <Button 
        variant="secondary" 
        className="w-full justify-between bg-gray-100 hover:bg-gray-200"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={meeting.meetPhoto} alt={meeting.meetName} />
            <AvatarFallback>{meeting.meetName ? meeting.meetName.split(" ").map((n)=>n[0]).join("") : 'N/A'}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-medium">{meeting.meetName}</p>
            <p className="text-xs text-gray-500">{meeting.subject ? meeting.subject.charAt(0).toUpperCase() + meeting.subject.slice(1) : 'N/A'} | {formatDate(meeting.date)}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{meeting.subject ? meeting.subject.charAt(0).toUpperCase() + meeting.subject.slice(1) : 'N/A'} Mentoring</DialogTitle>
            <DialogDescription>Meeting with {meeting.meetName}</DialogDescription>
          </DialogHeader>
          <h3 className="font-semibold">Details:</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-500" />
              <span>{formatDate(meeting.date)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-gray-500" />
              <span>{meeting.startTime ? formatTime(meeting.startTime) : ''} - {meeting.endTime ? formatTime(meeting.endTime) : 'Check Calendar'}</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-gray-500" />
              <a href={`mailto:${meeting.email}`} className="text-blue-600 hover:underline">
                {meeting.email}
              </a>
            </div>
            <div>
              <h3 className="font-semibold">Meeting Focus:</h3>
              <p className="text-sm text-gray-600">{meeting.description ? meeting.description : 'N/A'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MeetingCardWithDialog;
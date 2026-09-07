"use client"


import { Opportunity } from '@/lib/types';

  import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronRight, Clock, Star, Calendar as CalendarIcon, Globe, DollarSign, FolderIcon, BookOpenIcon, TrophyIcon, UsersIcon, BookIcon, HeadphonesIcon, HeartHandshakeIcon} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';


const ActivityPreview = ({activity}: {activity: Opportunity}) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const renderDetailsDialog = () => (
    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{activity.title}</DialogTitle>
          <DialogDescription>
            <div className="flex items-center mb-4">
              <Badge variant="default" className="mr-2">{activity.opportunity_type}</Badge>
              {Object.values(activity.subjects).slice(0, 2).map((subject, index) => (
                <Badge key={index} variant="outline" className="mr-2">{subject}</Badge>
              ))}
              <Badge variant="secondary" className="mr-2">
                {activity.custom_opportunity ? "Custom Opportunity" : (activity.internal ? "Internal" : "External")}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <p>{activity.full_description}</p>
          <div className="space-y-4 mt-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>{activity.time_required}</span>
            </div>
            <div className="flex items-center">
              <Star className="w-5 h-5 mr-2" />
              <span>{activity.weightage}</span>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              <span>{ activity.submission_date ? new Date(activity.submission_date).toLocaleDateString('en-GB') : 'No date set'}</span>
            </div>
            <div className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              <span>{activity.online ? 'Online' : 'In-person'}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              <span>{activity.cost === 0 ? 'Free' : `$${activity.cost}`}</span>
            </div>
          </div>
        </div>
        
      </DialogContent>
    </Dialog>
  );
  return (
    <>
      <Card
        key={activity.opportunity_id}  
        onClick={() => setIsDetailsOpen(true)}
        className='cursor-pointer hover:bg-gray-50'
      >
        <CardHeader className='pb-2 pt-4'>
            <CardTitle className="text-lg">{activity.title}</CardTitle>
        </CardHeader>
        <CardContent className='pt-0'>
            <p className="text-sm text-gray-500">{activity.short_description}</p>
        </CardContent>
      </Card>
      {renderDetailsDialog()}
    </>
  );
};

export default ActivityPreview;
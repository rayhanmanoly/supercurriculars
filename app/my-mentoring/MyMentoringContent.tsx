'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronRight, CalendarIcon, Plus, X, ChevronRightIcon } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import MeetingCardWithDialog from '@/components/MeetingCard';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import SetupWizard from '@/components/MentoringSetup';
import GroupMentoringEventsManager from '@/components/GroupMentoringManager';
import { useToast } from '@/components/ui/use-toast';
import { useMyMentoringData } from './useMyMentoringData';
import MyMentoringSkeleton from './MyMentoringSkeleton';
import { ProfileData } from '@/lib/types';

interface MyMentoringContentProps {
  profile: ProfileData;
}

const yearGroups = [
  { value: '7', label: 'Year 7' }, { value: '8', label: 'Year 8' },
  { value: '9', label: 'Year 9' }, { value: '10', label: 'Year 10' },
  { value: '11', label: 'Year 11' }, { value: '12', label: 'Year 12' },
  { value: '13', label: 'Year 13' },
];

export const MyMentoringContent = ({ profile }: MyMentoringContentProps) => {
  const { meetings, mentoringProfile, isLoading, error, updateProfile } = useMyMentoringData();
  const { toast } = useToast();

  const [isAllSessionsOpen, setIsAllSessionsOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editedMentoringData, setEditedMentoringData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  useEffect(() => {
    if (isEditSheetOpen) {
      setEditedMentoringData({ ...mentoringProfile });
    }
  }, [isEditSheetOpen, mentoringProfile]);

  const handleEditChange = (field: string, value: any) => {
    setEditedMentoringData((prev: any) => ({ ...prev, [field]: value }));
  };

  const addSubject = () => {
    if (editedMentoringData.mentoring_subjects?.length < (profile.subjects?.length ?? 0)) {
      setEditedMentoringData((prev: any) => ({
        ...prev,
        mentoring_subjects: [...prev.mentoring_subjects, ''],
      }));
    }
  };

  const removeSubject = (index: number) => {
    setEditedMentoringData((prev: any) => ({
      ...prev,
      mentoring_subjects: prev.mentoring_subjects.filter((_: any, i: number) => i !== index),
    }));
  };

  const getAvailableSubjects = () => {
    const selected = new Set(editedMentoringData.mentoring_subjects);
    return (profile.subjects || []).filter(s => s && !selected.has(s));
  };

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      const changes: Record<string, any> = {};
      for (const [key, value] of Object.entries(editedMentoringData)) {
        if (JSON.stringify(mentoringProfile[key]) !== JSON.stringify(value)) {
          changes[key] = value;
        }
      }
      await updateProfile(changes);
      toast({ title: 'Profile Updated', description: 'Your mentoring profile has been successfully updated.' });
      setIsEditSheetOpen(false);
    } catch {
      toast({ title: 'Update Failed', description: 'There was an error updating your profile. Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderAllSessionsDialog = () => (
    <Dialog open={isAllSessionsOpen} onOpenChange={setIsAllSessionsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>All Upcoming Sessions</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {meetings.map((session, i) => (
            <MeetingCardWithDialog key={i} meeting={session} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderEditSheet = () => (
    <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Update Profile</SheetTitle>
          <SheetDescription>Modify your mentoring profile</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <Textarea
            className="mb-4"
            placeholder="Profile description"
            value={editedMentoringData.description || ''}
            onChange={e => handleEditChange('description', e.target.value)}
          />
          <Label className="mb-2 block">Edit Mentoring Subjects</Label>
          {editedMentoringData.mentoring_subjects?.map((subject: string, index: number) => (
            <div key={index} className="flex items-center mb-2">
              <Select
                value={subject || 'placeholder'}
                onValueChange={value => {
                  const newSubjects = [...editedMentoringData.mentoring_subjects];
                  newSubjects[index] = value;
                  handleEditChange('mentoring_subjects', newSubjects);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subject && <SelectItem value={subject}>{subject}</SelectItem>}
                  {getAvailableSubjects().map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSubject(index)}
                disabled={editedMentoringData.mentoring_subjects.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addSubject}
            disabled={editedMentoringData.mentoring_subjects?.length >= (profile.subjects?.length ?? 0)}
            className="w-full mt-2"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Subject
          </Button>
          <Label className="mb-2 mt-4 block">Edit Availability</Label>
          <Input
            placeholder="Availability"
            value={editedMentoringData.availability_text || ''}
            onChange={e => handleEditChange('availability_text', e.target.value)}
          />
          <div className="flex justify-between items-center">
            <Label className="mb-2 mt-4 block">Edit Google Calendar Link</Label>
            <Button variant="link" className="p-0" onClick={() => window.open(editedMentoringData.google_appointment_link)}>
              Preview <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Input
            placeholder="Google Calendar Appointment Link"
            value={editedMentoringData.google_appointment_link || ''}
            onChange={e => handleEditChange('google_appointment_link', e.target.value)}
          />
        </div>
        <SheetFooter>
          <Button onClick={handleProfileUpdate} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  if (isLoading) return <MyMentoringSkeleton />;
  if (error) return <div>Error loading mentoring data. Please try again.</div>;

  return (
    <div className="h-screen bg-white w-full p-6">
      <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  My Mentoring
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex gap-6">
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Mentoring Profile</CardTitle>
              <Button variant="ghost" className="text-sm" onClick={() => setIsEditSheetOpen(true)}>
                Edit <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.profile_url} alt={profile.first_name} />
                  <AvatarFallback>{profile.first_name[0]}{profile.last_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{profile.first_name} {profile.last_name}</h2>
                  <p className="text-sm text-gray-500">Year {profile.current_year}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">{mentoringProfile.description}</p>
              <div className="flex justify-between">
                <div className="w-[75%] mr-2">
                  <h4 className="font-semibold mb-4">My Mentoring Subjects</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {mentoringProfile.mentoring_subjects?.map((subject: string) => (
                      <div key={subject} className="flex items-center">
                        <Image src={`/img/${subject}.png`} alt={subject} width={24} height={24} />
                        <span className="ml-2">{subject}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator orientation="vertical" className="mx-4" />
                <div className="ml-2">
                  <h4 className="font-semibold mb-4">Schedule a Meeting</h4>
                  <p className="text-sm mb-2">Availability</p>
                  <p className="text-sm text-gray-500 mb-4">{mentoringProfile.availability_text}</p>
                  <Button variant="link" className="p-0" onClick={() => window.open(mentoringProfile.google_appointment_link, '_blank')}>
                    Google Calendar Meeting Link <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 space-y-6 max-w-[40%]">
            <Card>
              <CardHeader>
                <CardTitle>One-to-One Sessions</CardTitle>
                <p className="text-sm text-gray-500">Upcoming One-to-One Mentoring Sessions</p>
              </CardHeader>
              <CardContent>
                {meetings.slice(0, 3).map((session, i) => (
                  <MeetingCardWithDialog key={i} meeting={session} />
                ))}
                {meetings.length > 3 && (
                  <Button variant="link" onClick={() => setIsAllSessionsOpen(true)}>
                    See More <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setIsSetupWizardOpen(true)}
            >
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Setup Mentoring Schedule
              </div>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <SetupWizard isOpen={isSetupWizardOpen} onClose={() => setIsSetupWizardOpen(false)} />

            <GroupMentoringEventsManager
              mentorSubjects={mentoringProfile.mentoring_subjects || []}
              yearGroups={yearGroups}
            />
          </div>
        </div>

        {renderAllSessionsDialog()}
        {renderEditSheet()}
    </div>
  );
};

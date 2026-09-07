'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LoaderCircleIcon, X } from "lucide-react";
import { SetProfile } from '@/lib/actions';
import MultiSelectWithReactSelect from '@/components/MultiSelectWithReact';
import { createClient } from '@/utils/supabase/client';
import { filteredSubjectsForOnboarding, removedForGCSE } from '@/lib/globals';
import { useRouter } from 'next/navigation';
import { debugLog } from '@/lib/debug';
import { cn } from '@/lib/utils';

type AccountRole = 'student' | 'teacher';




const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  current_year: z.string().min(1, "Year group is required"),
  scienceOption: z.string().optional(),
  subjects: z.array(z.object({
    subject: z.string().min(1, "Subject is required")
  })).optional()
}).refine((data) => {
    const year = parseInt(data.current_year)
    if (year >= 10) {
        return data.subjects && data.subjects.length > 0
    }
    return true
}, {
        message: "Subject choices are required for Year 10 and above",
        path: ["subjects"]
})


const teacherFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  subjects: z.array(z.object({
    value: z.string(),
    label: z.string(),
    url: z.string()
  })).min(1, "At least one subject is required")
});

type FormData = z.infer<typeof formSchema>;
type TeacherFormData = z.infer<typeof teacherFormSchema>;


const TeacherForm = ({email, allSubjects}: {email: string, allSubjects: any}) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const formattedData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: email,
      role: 'teacher',
      can_add: true,
      subjects: data.subjects.map((subject: any) => subject.value) || []
    };

    const profileDataString = JSON.stringify(formattedData);
    
    try {
      await SetProfile(profileDataString);
    } catch (error) {
      console.error("Error setting profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
    <CardHeader>
      <CardTitle className="text-2xl font-bold text-center">Teacher Profile Setup</CardTitle>
      <p className="text-center text-gray-500">Set up your teacher account.</p>
    </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input {...register("first_name", { required: true })} />
              {errors.first_name && <p className="text-red-500 text-sm">First name is required</p>}
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input {...register("last_name", { required: true })} />
              {errors.last_name && <p className="text-red-500 text-sm">Last name is required</p>}
            </div>
          </div>
          <div>
            <Label>Subjects You Teach</Label>
            <MultiSelectWithReactSelect
              onChange={(values: any) => {
                setValue("subjects", values);
              }}
              options={allSubjects}
              value={watch("subjects") || []}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit'}</Button>
        </form>
      </CardContent>
    </Card>
  );
};


const StudentForm = ({email, allSubjects}: {email: string, allSubjects: any}) => {
  const [subjects, setSubjects] = useState<{ subject: string }[]>([]);
  const [scienceOption, setScienceOption] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const watchYearGroup = watch("current_year");
  const watchScienceOption = watch("scienceOption");

  useEffect(() => {
    if (watchYearGroup === '12' || watchYearGroup === '13') {
      setSubjects([{ subject: '' }, { subject: '' }]);
    } else if (watchYearGroup === '10' || watchYearGroup === '11') {
      setSubjects([]);
      setScienceOption('');
    } else {
      setSubjects([]);
      setScienceOption('');
    }
  }, [watchYearGroup]);

  useEffect(() => {
    if (watchScienceOption === 'combined') {
      setSubjects([{ subject: '' }, { subject: '' }, { subject: '' }, { subject: '' }]);
    } else if (watchScienceOption === 'separate') {
      setSubjects([{ subject: '' }, { subject: '' }, { subject: '' }]);
    }
  }, [watchScienceOption]);

  const addSubject = () => {
    setSubjects([...subjects, { subject: '' }]);
  };

  const removeSubject = (index: number) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
  };

  const getAvailableSubjects = (index: number, isGCSE: boolean) => {
    const selectedSubjects = subjects.map(s => s.subject).filter((_, i) => i !== index);
    if (isGCSE) {
      return allSubjects.filter((subject: any) => !selectedSubjects.includes(subject.value) && !removedForGCSE.includes(subject.value));
    }
    return allSubjects.filter((subject: any) => !selectedSubjects.includes(subject.value));
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const formattedData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: email,
      current_year: data.current_year ? parseInt(data.current_year) : null,
      subjects: data.subjects && data.subjects.length > 0 ? data.subjects : [],
      role: 'student',
      can_add: false,
    };

    const profileDataString = JSON.stringify(formattedData);
    
    try {
      await SetProfile(profileDataString);
    } catch (error) {
      console.error("Error setting profile:", error);
    } finally {
      setIsSubmitting(false);
    }

  };

  // ... keep existing student form effects and helper functions ...

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Student Profile Setup</CardTitle>
        <p className="text-center text-gray-500">Let&apos;s get your account ready.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input id="first_name" {...register("first_name")} placeholder="First Name" />
                {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message?.toString()}</p>}
              </div>
              <div>
                <Input id="last_name" {...register("last_name")} placeholder="Last Name" />
                {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message?.toString()}</p>}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Enter your first and last name.</p>
          </div>

          <div>
            <Label htmlFor="current_year">Year Group</Label>
            <Select onValueChange={(value) => setValue("current_year", value)} value={watch("current_year")}>
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {[7, 8, 9, 10, 11, 12, 13].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    Year {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.current_year && <p className="text-red-500 text-sm mt-1">{errors.current_year.message?.toString()}</p>}
            <p className="text-sm text-gray-500 mt-1">Select your current year group.</p>
          </div>

          {(watchYearGroup === '10' || watchYearGroup === '11') && (
            <div>
              <Label className="mb-2 block">Science Option</Label>
              <RadioGroup onValueChange={(value) => setValue("scienceOption", value)} value={watch("scienceOption")} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-100">
                  <RadioGroupItem value="combined" id="combined" />
                  <Label htmlFor="combined" className="flex-grow cursor-pointer">Combined Science</Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-100">
                  <RadioGroupItem value="separate" id="separate" />
                  <Label htmlFor="separate" className="flex-grow cursor-pointer">Separate Science</Label>
                </div>
              </RadioGroup>
              {errors.scienceOption && <p className="text-red-500 text-sm mt-1">{errors.scienceOption.message?.toString()}</p>}
            </div>
          )}
            
          {watchYearGroup && subjects.map((subject, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="flex-grow">
                <Label htmlFor={`subject${index + 1}`}>Subject {index + 1}</Label>
                <div className="flex items-center">
                  <Select 
                    onValueChange={(value) => {
                      const newSubjects = [...subjects];
                      newSubjects[index].subject = value;
                      setSubjects(newSubjects);
                      setValue(`subjects.${index}.subject`, value);
                    }}
                    value = {watch(`subjects.${index}.subject`)}
                  >
                    <SelectTrigger className="flex-grow">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSubjects(index, watchYearGroup === '10' || watchYearGroup === '11').map((subject: any) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(watchYearGroup === '12' || watchYearGroup === '13') && index >= 2 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="p-2 h-10 w-10 ml-2" 
                      onClick={() => removeSubject(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {errors.subjects?.[index]?.subject && (
                  <p className="text-red-500 text-sm mt-1">{errors.subjects?.[index]?.subject?.message?.toString()}</p>
                )}
              </div>
            </div>
          ))}

          {watchYearGroup && (watchYearGroup === '12' || watchYearGroup === '13') && subjects.length < 4 && (
            <Button type="button" onClick={addSubject} className="w-full" variant="secondary">
              Add Another Subject
            </Button>
          )}

          {watchYearGroup && (
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

function RoleToggle({
  value,
  onChange,
}: {
  value: AccountRole;
  onChange: (role: AccountRole) => void;
}) {
  return (
    <div className="w-full max-w-lg mx-auto mb-4 px-1">
      <p className="text-sm text-muted-foreground text-center mb-2">
        Account type <span className="text-xs">(temporary — for demo / local setup)</span>
      </p>
      <div className="grid grid-cols-2 gap-2 rounded-lg border p-1 bg-muted/40">
        {([
          { id: 'student' as const, label: 'Student' },
          { id: 'teacher' as const, label: 'Teacher' },
        ]).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              value === option.id
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-pressed={value === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const ProfileSetupForm = () => {
  const supabase = createClient();
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<AccountRole>('student');
  const [isLoading, setIsLoading] = useState(true);
  const [showError, setShowError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setShowError(true);
      }
    };
    getUser();
  }, []);

  const allSubjects = filteredSubjectsForOnboarding;

  if (showError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 p-8 text-center">
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md">
          Please try signing in again.
        </p>
        <Button onClick={() => router.push('/login')} variant="default">
          Sign In Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="flex w-full justify-center items-center h-screen">
          <LoaderCircleIcon className="animate-spin w-10 h-10" />
        </div>
      </main>
    );
  }

  debugLog('onboarding role', role);

  return (
    <div className="flex flex-col pt-6 min-h-screen">
      <RoleToggle value={role} onChange={setRole} />
      {role === 'teacher' ? (
        <TeacherForm email={email} allSubjects={allSubjects} />
      ) : (
        <StudentForm email={email} allSubjects={allSubjects} />
      )}
    </div>
  );
};

export default ProfileSetupForm;
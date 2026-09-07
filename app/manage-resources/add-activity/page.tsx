'use client'
import { ActivityForm } from "@/components/AddActivityForm";
import { AddNewActivity } from "@/lib/actions";
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {ActivityFormData} from '@/components/AddActivityForm'
import { ProfileContext } from "@/app/client-layout";
import { useContext } from "react";


export default function AddActivity() {
  const {toast} = useToast();
  const router = useRouter()
  const profile = useContext(ProfileContext)
  const isTeacher = profile?.role === 'teacher'
  const handleSubmit = async (data: ActivityFormData) => {
    try {
      // Create FormData and append all fields
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'past_projects' && Array.isArray(value)) {
          value.forEach((file: any) => {
            formData.append(key, file);
          });
        } else if (value instanceof File) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else {
          formData.append(key, String(value));
        }
      });

      await AddNewActivity(formData, isTeacher);
      toast({
        title: "Activity submitted",
        description: "Your activity has been successfully added.",
      });
      router.push('/manage-resources');
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "There was a problem submitting your activity.",
        variant: "destructive",
      });
      return false;
    }
  };
  if (profile && !profile?.can_add) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4 p-8 text-center">
      <h2 className="text-2xl font-semibold">Access Restricted</h2>
      <p className="text-gray-600 max-w-md">
        You do not have permission to add activities. If you think this is an error, please{" "}
        <a 
          href="mailto:supercurricularadmin@britishschool.sch.ae"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          contact support
        </a>.
      </p>
    </div>
  )
  return (
    <div className="h-screen bg-white w-full">
      <div className="flex-1 p-8">
        <div className="flex flex-row justify-start items-end">
        <Button className="mb-4" variant="outline" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <h1 className="text-2xl font-semibold mb-5 pl-4">Add New Activity</h1>
        </div>  
        <ActivityForm 
          onSubmit={handleSubmit}
          submitLabel="Add Activity"
        />
      </div>
    </div>
  );
}
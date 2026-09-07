import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { ChevronRight, Clock, Star, Calendar as CalendarIcon, Globe, DollarSign, FolderIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Opportunity } from '@/lib/types';
import { time_conversions } from '@/lib/globals';

const formSchema = z.object({
  opportunity_id: z.string(),
  description: z.string().min(1, "Description is required"),
  files: z.array(z.instanceof(File)).optional(),
});

const ActivityCardWithDialogs = ({ activity, iconMap, onActivityComplete }: { activity: Opportunity, iconMap: Record<string, React.ElementType>, onActivityComplete: (formData: FormData) => Promise<void> }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCompletionOpen, setIsCompletionOpen] = useState(false);
    const Icon = iconMap[activity.opportunity_type] || FolderIcon;
  
    const form = useForm({
      resolver: zodResolver(formSchema),
      defaultValues: {
        opportunity_id: activity.opportunity_id,
        description: '',
        files: undefined,
      },
    });
  
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
      try {
        const formData = new FormData();
        formData.append('opportunity_id', values.opportunity_id);
        formData.append('description', values.description);
        if (values.files) {
          values.files.forEach((file) => {
            formData.append(file.name, file);
          });
        }
        
        await onActivityComplete(formData);
        setIsCompletionOpen(false);
        setIsDetailsOpen(false);  // Close the details dialog as well
        form.reset();  // Reset the form
      } catch (error) {
        console.error('Error submitting portfolio:', error);
        // You might want to show an error message here
      }
    };
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
        <div>
          <p>{activity.full_description}</p>
          <div className="space-y-4 mt-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>{time_conversions[activity.time_required]}</span>
            </div>
            <div className="flex items-center">
              <Star className="w-5 h-5 mr-2" />
              <span>{activity.weightage}</span>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              <span>{activity.submission_date ? new Date(activity.submission_date).toLocaleDateString('en-GB') : 'N/A'}</span>
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
        <Button onClick={() => {
          setIsDetailsOpen(false);
          setIsCompletionOpen(true);
        }} className="w-full mt-4">
          Mark as Complete
        </Button>
      </DialogContent>
    </Dialog>
  );

  const renderCompletionDialog = () => (
    <Dialog open={isCompletionOpen} onOpenChange={setIsCompletionOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete {activity.title}</DialogTitle>
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
        <div>
          <h4 className="font-semibold">Describe your experience & accomplishments</h4>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...form.register('opportunity_id')} />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your activity or project..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed description of your activity or project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="files"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Upload Files</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          onChange(files);
                        }}
                        {...rest}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload relevant files for your portfolio item (PDF, DOC, DOCX, JPG, JPEG, PNG).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Button 
        key={activity.opportunity_id} 
        variant="secondary" 
        className="w-full justify-between bg-gray-100 hover:bg-gray-200"
        onClick={() => setIsDetailsOpen(true)}
      >
        <div className="flex items-center overflow-hidden">
          <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{activity.title}</span>
        </div>
        <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0" />
      </Button>
      {renderDetailsDialog()}
      {renderCompletionDialog()}
    </>
  );
};

export default ActivityCardWithDialogs;
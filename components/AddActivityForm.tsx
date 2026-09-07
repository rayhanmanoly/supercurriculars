"use client"

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerDemo } from '@/components/DatePicker';
import MultiSelectWithReactSelect from '@/components/MultiSelectWithReact';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { yearGroups, filteredSubjects, time_conversions } from '@/lib/globals';
import { useContext, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Opportunity, Teacher } from '@/lib/types';
import { getResources, getTeachers } from '@/lib/actions';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from "@/components/ui/command"
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, ExternalLink } from 'lucide-react';
import Fuse from 'fuse.js';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { FileManager } from './FileManager';
import { ImageManager } from './ImageManager';
import { ProfileContext, TeacherContext } from '@/app/client-layout';
import ActivityPreview from './ActivityPreview';

type FieldConfig = {
  type: 'input' | 'textarea' | 'select' | 'multiSelect' | 'checkbox' | 'date' | 'file' | 'number';
  label: string;
  description: string;
  validation: z.ZodType<any>;
  options?: Array<{ value: string; label: string; }> | string[];
  accept?: string;
  required?: boolean;
}

const formFields = {
  title: {
    type: 'input',
    label: 'Title*',
    description: 'Enter the title of the activity',
    validation: z.string().min(1, "Title is required"),
    required: true
  },
  short_description: {
    type: 'textarea',
    label: 'Short Description*',
    description: 'Brief overview of the activity (max 100 characters)',
    validation: z.string().min(1, "Short description is required").max(100, "Max 100 characters"),
    required: true
  },
  full_description: {
    type: 'textarea',
    label: 'Full Description*',
    description: 'Provide a detailed description of the activity',
    validation: z.string().min(1, "Full description is required"),
    required: true
  },
  opportunity_type: {
    type: 'select',
    label: 'Opportunity Type*',
    description: 'Choose the type of opportunity',
    options: ["Course", "Competition", "Club", "Reading", "Podcast", "Project", "Volunteering", "Other"],
    validation: z.enum(["Course", "Competition", "Club", "Reading", "Podcast", "Project", "Volunteering", "Other"]),
    required: true
  },
  subjects: {
    type: 'multiSelect',
    label: 'Applicable Subjects*',
    description: 'Select all relevant subject areas',
    options: filteredSubjects,
    validation: z.array(z.string()).min(1, "Select at least one subject"),
    required: true
  },
  year_groups: {
    type: 'multiSelect',
    label: 'Applicable Year Groups*',
    description: 'Select the year groups this opportunity is most suited for',
    options: yearGroups,
    validation: z.array(z.number()).min(1, "Select at least one year group"),
    required: true
  },
  time_required: {
    type: 'select',
    label: 'Time Required*',
    description: 'Estimate the time commitment for this activity',
    options: Object.entries(time_conversions).map(([value, label]) => ({
      value: value.toString(),
      label
    })),
    validation: z.string(),
    required: true
  },
  submission_date: {
    type: 'date',
    label: 'Submission Date',
    description: 'If applicable, select the submission deadline for this activity',
    validation: z.date().nullable(),
  },
  one_off: {
    type: 'checkbox',
    label: 'One-off Event',
    description: 'Check if this is a one-time event - (i.e. after the submission date this will not be available again)',
    validation: z.boolean(),
  },
  internal: {
    type: 'checkbox',
    label: 'Internal Activity',
    description: 'Check if this is an internal school activity - (i.e. organised by BSAK)',
    validation: z.boolean(),
  },
  online: {
    type: 'checkbox',
    label: 'Online Activity',
    description: 'Check if this activity can be completed online',
    validation: z.boolean(),
  },
  url: {
    type: 'input',
    label: 'Website URL',
    description: 'Enter the website URL for this activity, if available',
    validation: z.string().url().optional().or(z.literal('')),
  },
  cost: {
    type: 'number',
    label: 'Cost*',
    description: 'Enter the cost of this activity in AED (0 if free)',
    validation: z.number().min(0),
    required: true
  },
  contact_name: {
    type: 'input',
    label: 'Contact Name*',
    description: 'Name of the person students can contact for help. This could be you, a teacher or someone who has done this, with appropriate permission.',
    validation: z.string().min(1, "Contact name is required"),
    required: true
  },
  contact_email: {
    type: 'input',
    label: 'Contact Email*',
    description: 'Email address of the contact person',
    validation: z.string().email("Invalid email address"),
    required: true
  },
  advice: {
    type: 'textarea',
    label: 'Advice*',
    description: 'Provide any advice or tips for students',
    validation: z.string().min(1, "Advice is required"),
    required: true
  },
  image: {
    type: 'file',
    label: 'Activity Image*',
    description: 'Upload an image representing this activity - this is ideally a logo.',
    validation: z.union([
        z.instanceof(File),
        z.string().url(),  // Allow URL strings for existing files
        z.literal('')      // Allow empty string
      ]),
    accept: "image/*",
    required: true
  },
  past_projects: {
    type: 'file',
    label: 'Past Projects',
    description: 'Add examples of past projects (PDF, DOC, DOCX, JPG, JPEG, PNG)',
    validation: z.union([
        z.instanceof(File),
        z.array(z.instanceof(File)), // Allow array of Files
        z.array(z.string().url()),   // Allow array of URLs
        z.literal(''),
        z.undefined()
      ]).optional(),
    accept: ".pdf,.doc,.docx,.png,.jpg,.jpeg",
  },
  review_teacher: {
    type: 'select',
    label: 'Approving Teacher*',
    description: 'Select the teacher who will approve this activity',
    validation: z.string().min(1, "Approving teacher is required"),
    required: true,
    options: []
  },
  weightage: {
    type: 'number',
    label: 'Weightage (1-5)*',
    description: 'Rate the "usefulness" of this activity. Consulting with your approver is recommended.',
    validation: z.number().min(1).max(5),
    required: true
  },
} as const satisfies Record<string, FieldConfig>;

// ... (previous code with imports and formFields) ...

// Create schema dynamically from field definitions
const formSchema = z.object(
    Object.fromEntries(
      Object.entries(formFields).map(([key, field]) => [key, field.validation])
    )
  );
  
  type FormData = z.infer<typeof formSchema>;
  
export type ActivityFormData = z.infer<typeof formSchema>;
interface ActivityFormProps {
    initialData?: Opportunity;
    onSubmit: (data: any) => Promise<boolean>;
    submitLabel?: string;
    isEditing?: boolean;
  }
  
  const getSteps = (isTeacher: boolean) => [
    {
      title: "Basic Information",
      fields: ["title", "opportunity_type", "subjects"] as const,
    },
    {
      title: "Activity Details",
      fields: ["short_description", "full_description", "advice", "image"] as const,
    },
    {
      title: "Activity Requirements",
      fields: ["time_required", "submission_date", "cost", "one_off", "internal", "online"] as const,
    },
    {
      title: "Additional Information",
      fields: ["url", "past_projects"] as const,
    },
    {
      title: "Point of Contact",
      fields: ["contact_name", "contact_email"] as const,
    },
    {
      title: "Approval Information",
      fields: isTeacher ? ["weightage", "year_groups"] as const : ["review_teacher", "weightage", "year_groups"] as const,
    }
  ] as const;
  
  
  export const ActivityForm = ({ 
    initialData, 
    onSubmit, 
    submitLabel = "Submit",
    isEditing = false,
  }: ActivityFormProps) => {
    const profile = useContext(ProfileContext)
    const isTeacher = profile?.role === 'teacher'
    const steps = getSteps(isTeacher)
    const [step, setStep] = useState(0);
    const [isReviewStep, setIsReviewStep] = useState(false);
    const [teacherOptions, setTeacherOptions] = useState<{ value: string; label: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<string[]>(initialData?.past_projects || []);
    const [activityImage, setActivityImage] = useState(initialData?.image || '');
    const teachers = useContext(TeacherContext);


    ///for fuzzy matching
    const [matchedActivities, setMatchedActivities] = useState<Opportunity[]>([]);
    const [showMatchDialog, setShowMatchDialog] = useState(false);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

    useEffect(() => {
      // Load opportunities for fuzzy matching
      const loadOpportunities = async () => {
        try {
          const resources = await getResources();
          setOpportunities(resources);
        } catch (error) {
          console.error('Error loading opportunities:', error);
        }
      };
      !isEditing && loadOpportunities();
    }, []);
    
    const checkForSimilarActivities = () => {
      const options = {
        keys: [{name: "title", weight: 0.7}, {name: "subjects", weight: 0.3}],
        threshold: 0.4,
      };
      
      const fuse = new Fuse(opportunities, options);
      
      const results = fuse.search(
        `${form.getValues("title")} ${form.getValues('subjects')}`
      ).filter(term => term.item.opportunity_type === form.getValues('opportunity_type'));
      
      return results.map(result => result.item);
    };



    
  useEffect(() => {
    const loadTeachers =  () => {
      if (teachers) {
        setTeacherOptions(teachers.map(teacher => ({
          value: teacher.email,
          label: `${teacher.first_name} ${teacher.last_name}`
        })));
      }
    };
    loadTeachers();
  }, []);
  
  useEffect(() => {
    // Update the form's past_projects field whenever files change
    form.setValue('past_projects', files);
  }, [files]);

  useEffect(() => {
    // Update the form's image field whenever the image changes
    form.setValue('image', activityImage);
  }, [activityImage]);

  const formatInitialData = (opportunity: Opportunity) => {
    return {
        ...opportunity,
        // Convert time required from number to string
        time_required: opportunity.time_required?.toString(),
        
        // Format the submission date
        submission_date: opportunity.submission_date && new Date(opportunity.submission_date),
            
        
        // Format activity images
        image: opportunity.image || '',

        // Ensure past_projects exists
        past_projects: Array.isArray(opportunity.past_projects) 
      ? opportunity.past_projects 
      : opportunity.past_projects 
        ? [opportunity.past_projects]
        : [],
    }
}

const formattedData = initialData ? formatInitialData(initialData as Opportunity) : {};
    const form = useForm<FormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: '',
        short_description: '',
        full_description: '',
        opportunity_type: undefined,
        weightage: 1,
        year_groups: [],
        subjects: [],
        time_required: '',
        submission_date: null,
        one_off: false,
        internal: false,
        online: false,
        url: '',
        cost: 0,
        contact_name: '',
        contact_email: '',
        advice: '',
        review_teacher: isTeacher ? profile?.email : '',
        ...formattedData
      },
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    

    const resetForm = () => {
        form.reset();
        setStep(0);
        setIsReviewStep(false);
      };

    const nextStep = async () => {
    const fields = steps[step].fields;
    const results = await Promise.all(fields.map(field => form.trigger(field)));
    
    if (results.every(Boolean)) {
      if (step === 0 && !isEditing) {
        const matches = checkForSimilarActivities();
        if (matches.length > 0) {
          setMatchedActivities(matches);
          setShowMatchDialog(true);
          return;
        }
      }
      
      if (step < steps.length - 1) {
        setStep(step + 1);
      } else {
        setIsReviewStep(true);
      }
    }
  };
  
    const prevStep = () => {
      if (isReviewStep) {
        setIsReviewStep(false);
      } else {
        setStep(step - 1);
      }
    };
  
    const renderReviewStep = () => (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Review Your Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] pr-4">
            {Object.entries(form.getValues()).map(([key, value]) => {
              const fieldConfig = formFields[key as keyof typeof formFields];
              if (!fieldConfig) return null;
  
              return (
                <div key={key} className="mb-4">
                  <h3 className="font-semibold">{fieldConfig.label}</h3>
                  <p className="text-sm text-gray-600">
                    {(key === 'past_projects' && !isEditing) ? Array.isArray(value) && value.map((file: any) => file?.name).join(', ') :
                    (key === 'image' && !isEditing) ? value instanceof File && value?.name :
                    (key === 'past_projects' && Array.isArray(value))? value.map((file) => typeof file === 'string' ? file.split('/').pop()?.split('-++-').pop() || '' : '').join(', ') :
                    (key === 'image' && typeof value === 'string') ? value.split('/').pop()?.split('-++-').pop() || '' :
                     Array.isArray(value) ? value.join(', ') :
                     typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                     value instanceof Date ? value.toLocaleDateString() :
                     value?.toString() || 'N/A'}
                  </p>
                </div>
              );
            })}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={prevStep}>
            Back to Edit
          </Button>
          <Button type="submit" disabled={isSubmitting}> {isSubmitting ? (
          <>
            <span className="mr-2">Submitting...</span>
            {/* You can add a loading spinner here if you have one */}
          </>
        ) : (
          submitLabel
        )} </Button>
        </CardFooter>
      </Card>
    );

    const renderFormField = (
        fieldName: keyof typeof formFields,
        form: any
      ) => {
        if (fieldName === 'review_teacher' && isTeacher) {
          return null;
        }
        const fieldConfig = formFields[fieldName];
        
      
        return (
          <FormField
            key={fieldName}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fieldConfig.label}</FormLabel>
                <FormControl>
                  {(() => {
                    switch (fieldConfig.type) {
                      case 'input':
                        return <Input {...field} />;
                      
                      case 'textarea':
                        return <Textarea {...field} />;
                      
                        case 'select':
                            if (fieldName === 'review_teacher') {
                              return (
                                <Popover modal={true}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                        
                                      {field.value
                                        ? teacherOptions.find((teacher) => teacher.value === field.value)?.label
                                        : "Select teacher..."}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                      <CommandInput placeholder="Search teacher..." />
                                      <CommandList>
                                      <CommandEmpty>No teacher found.</CommandEmpty>
                                      <CommandGroup>
                                        {teacherOptions && teacherOptions.map((teacher) => (
                                          <CommandItem
                                            key={teacher.value}
                                            value = {teacher.label}
                                            onSelect={() => {
                                              form.setValue(fieldName, teacher.value);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === teacher.value ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            {teacher.label}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              );
                            }
                            // Return regular select for other select fields
                            return (
                                <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${fieldConfig.label}`} />
                                </SelectTrigger>
                                <SelectContent>
                                {(fieldConfig.options)?.map((option) => (
                                    <SelectItem 
                                      key={typeof option === 'string' ? option : option.value} 
                                      value={typeof option === 'string' ? option : option.value}
                                    >
                                      {typeof option === 'string' ? option : option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                      
                      case 'multiSelect':
                        return (
                          <MultiSelectWithReactSelect
                            options={fieldConfig.options || []}
                            value={field.value?.map((value: any) => ({
                              value: value.toString(),
                              label: fieldConfig.options?.find((opt: any) => 
                                opt.value?.toString() === value.toString() || opt.toString() === value.toString()
                              )?.label || value.toString()
                            }))}
                            onChange={(selected: any) => {
                              const values = selected.map((item: any) => 
                                fieldName === 'year_groups' ? parseInt(item.value) : item.value
                              );
                              field.onChange(values);
                            }}
                          />
                        );
                      
                        case 'checkbox':
                            return (
                              <div className="flex items-start space-x-4 rounded-md border p-4 shadow-sm hover:bg-muted/50 transition-colors">
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-1"
                                />
                                <div className="space-y-1">
                                  <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {fieldConfig.label}
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    {fieldConfig.description}
                                  </p>
                                </div>
                              </div>
                            );
                      
                      case 'date':
                        return (
                          <DatePickerDemo
                            date={field.value}
                            setDate={field.onChange}
                          />
                        );
                      
                        case 'file':
                            const currentValue = field.value;
                            const isExistingFile = (typeof currentValue === 'string' || Array.isArray(currentValue)) && currentValue.length > 0;
                            
                            return (
                              <div className="space-y-4">
                                {!isEditing ? 
                                (fieldName === 'image') ? (
                                <>
                                <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => field.onChange(e.target.files?.[0])} />
                                <p className="text-sm text-muted-foreground"><span className="font-semibold">Selected image:</span> {currentValue.name}</p>
                                </>)
                                : (<>
                                <Input type="file" multiple accept={fieldConfig.accept} onChange={(e) => field.onChange(Array.from(e.target.files || []))} />
                                {(Array.isArray(currentValue) && currentValue.length > 0) || currentValue?.name ? (
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">Selected files:</span>{" "}
                                    {Array.isArray(currentValue) 
                                      ? currentValue.map(file => file.name).join(", ")
                                      : currentValue.name}
                                  </p>
                                ) : null}
                                </>)
                                
                                : (fieldName === 'past_projects') ? (
                                  <FileManager
                                  files={files}
                                  setFiles={setFiles}
                                  isEditing={isEditing}
                                  disabled={loading}
                                  opportunity_id={initialData?.opportunity_id}
                                />
                                ) : (
                                  <>
                                  <ImageManager
                                    image={activityImage}
                                    setImage={setActivityImage}
                                    opportunity_id={initialData?.opportunity_id}
                                  />
                                   
                                  </>
                                )}
                              </div>
                            );
                      
                      case 'number':
                        return <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />;
                      
                      default:
                        return null;
                    }
                  })()}
                </FormControl>
                {fieldConfig.type !== 'checkbox' && (
                  <FormDescription>{fieldConfig.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      };

      const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
          
          const success = await onSubmit(values);
          if (success) {
            form.reset();
          }
        } catch (error) {
          console.error('Error submitting form:', error);
        } finally {
          setIsSubmitting(false);
        }
      };

      
      
  
    return (
      <>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}  className="space-y-8">
          {isReviewStep ? (
            renderReviewStep()
          ) : (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>{steps[step].title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps[step].fields.map(fieldName => 
                  renderFormField(fieldName, form)
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                {step > 0 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="button" onClick={(e) => {
                    e.preventDefault();  // Prevent any form submission
                    nextStep();
                  }}>
                    Review
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </form>
        </Form>

        <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Similar Activities Found</DialogTitle>
            <DialogDescription>
              We've found some activities that seem similar to the one you're trying to add. Please review them to avoid duplicates.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {matchedActivities.map((activity, index) => (
              <ActivityPreview key={index} activity={{
                ...activity,
                submission_date: activity.submission_date ? new Date(activity.submission_date) : undefined,
                project_files: activity.past_projects || []
              }} />
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowMatchDialog(false)} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => {
              setShowMatchDialog(false);
              setStep(step + 1);
            }}>
              Continue Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    );
  };
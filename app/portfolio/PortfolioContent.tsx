'use client'

import { useState, useEffect } from 'react';
import { usePortfolioData } from './usePortfolioData';
import PortfolioSkeleton from './PortfolioSkeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Clock, ChevronRight, ExternalLink, CalendarIcon, Globe, DollarSign, Mail, LoaderCircle, CheckCircle, ActivityIcon } from 'lucide-react';
import { SafeImage } from '@/components/SafeImage';
import { useToast } from '@/components/ui/use-toast';
import { exportPortfolioPDF, uploadFile } from '@/lib/actions';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePickerDemo } from '@/components/DatePicker';
import MultiSelectWithReactSelect from '@/components/MultiSelectWithReact';
import SliderWithTooltip from '@/components/SliderWithTooltip';
import { default as ReactSelect } from 'react-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FilePreview from '@/components/FilePreview';
import { Opportunity, ProfileData } from '@/lib/types';
import { time_conversions, yearGroups, filteredSubjects } from '@/lib/globals';

interface PortfolioContentProps {
  profile: ProfileData;
}

interface SubjectOption {
  value: string;
  label: string;
}

interface FilterState {
  name: string;
  type: string;
  subjects: string[];
  year_groups: number[];
  weightage: number;
  online: boolean;
  internal: boolean;
  before_submission_date: Date | null;
  after_submission_date: Date | null;
  one_off: boolean;
  custom_opportunity: boolean;
  time_required: number;
  free: boolean;
}

const defaultFilters = (): FilterState => ({
  name: '',
  type: '',
  subjects: [],
  year_groups: [],
  weightage: 0,
  online: false,
  internal: false,
  before_submission_date: null,
  after_submission_date: null,
  one_off: false,
  custom_opportunity: false,
  time_required: 0,
  free: false,
});

function formatDate(inputDate: Date | string): string {
  try {
    return (inputDate as Date).toDateString();
  } catch {
    if (typeof inputDate === 'string') {
      const d = new Date(inputDate);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear().toString().slice(-2);
      return `${day}/${month}/${year}`;
    }
    return 'Check site';
  }
}

export const PortfolioContent = ({ profile }: PortfolioContentProps) => {
  const { data, isLoading, error, completeActivity, editActivity, addActivity } = usePortfolioData();
  const { toast } = useToast();

  const [filteredActivities, setFilteredActivities] = useState<Opportunity[]>([]);
  const [PDFloading, setPDFloading] = useState(false);
  const [addActivityLoading, setAddActivityLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Opportunity | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters());
  const [tempFilters, setTempFilters] = useState<FilterState>(defaultFilters());
  const [isSubmitFormOpen, setOpenSubmitForm] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isAddActivitySheetOpen, setIsAddActivitySheetOpen] = useState(false);
  const [activityType, setActivityType] = useState('');
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [description, setDescription] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalActivity, setOriginalActivity] = useState<Opportunity | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const activities = data?.activities ?? [];

  useEffect(() => {
    applyFilters();
  }, [filters, activities]);

  const applyFilters = () => {
    const filtered = activities.filter(opp => {
      const matchesSearch =
        opp.title.toLowerCase().includes(filters.name.toLowerCase()) ||
        opp.short_description.toLowerCase().includes(filters.name.toLowerCase()) ||
        opp.full_description.toLowerCase().includes(filters.name.toLowerCase()) ||
        filters.name === '';
      const matchesType = !filters.type || opp.opportunity_type === filters.type;
      const matchesSubjects =
        filters.subjects.length === 0 ||
        filters.subjects.some(subj => Object.values(opp.subjects || {}).includes(subj));
      const matchesYearGroups =
        filters.year_groups.length === 0 ||
        (Array.isArray(opp.year_groups) &&
          filters.year_groups.some(year => opp.year_groups.includes(year)));
      const matchesWeightage = opp.weightage >= filters.weightage;
      const matchesOnline = !filters.online || opp.online;
      const matchesInternal = !filters.internal || opp.internal;
      const matchesFree = !filters.free || opp.cost === 0;
      const matchesTimeRequired = !filters.time_required || opp.time_required <= filters.time_required;
      const matchesDate =
        (!filters.before_submission_date && !filters.after_submission_date) ||
        !opp.submission_date ||
        (filters.before_submission_date &&
          filters.after_submission_date &&
          Date.parse(opp.submission_date.toString()) <= filters.before_submission_date.getTime() &&
          Date.parse(opp.submission_date.toString()) >= filters.after_submission_date.getTime());
      return (
        matchesSearch && matchesType && matchesSubjects && matchesYearGroups &&
        matchesWeightage && matchesOnline && matchesInternal && matchesFree &&
        matchesTimeRequired && matchesDate
      );
    });
    setFilteredActivities(filtered);
  };

  const handleTempFilterChange = (filterName: string, value: any) => {
    setTempFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleSaveFilters = () => {
    setFilters({ ...tempFilters });
    setIsFilterSheetOpen(false);
  };

  const handleResetFilters = () => {
    const reset = defaultFilters();
    setTempFilters(reset);
    setFilters(reset);
    setSliderValue(0);
    setIsFilterSheetOpen(false);
  };

  const handleSliderChange = (newValue: number) => {
    setSliderValue(newValue);
    handleTempFilterChange('weightage', newValue);
  };

  const handleSubjectChange = (selected: any) => {
    handleTempFilterChange('subjects', selected.map((o: any) => o.value));
  };

  const handleYearGroupChange = (selected: any) => {
    handleTempFilterChange('year_groups', selected.map((o: any) => parseInt(o.value)));
  };

  const areActivitiesEqual = (a: Opportunity, b: Opportunity) =>
    a.user_description === b.user_description &&
    JSON.stringify(a.project_files) === JSON.stringify(b.project_files);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && selectedActivity) {
      setUploadingFiles(new Set(files.map(f => f.name)));
      const results = await Promise.all(
        files.map(async file => {
          try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('opportunityId', selectedActivity.opportunity_id);
            const url = await uploadFile(fd, 'portfolio', '', false);
            return { name: file.name, url };
          } catch {
            toast({ title: 'Error', description: `Failed to upload ${file.name}.`, variant: 'destructive' });
            return null;
          }
        })
      );
      const uploaded = results.filter(Boolean) as { name: string; url: string }[];
      if (uploaded.length > 0) {
        const updated = {
          ...selectedActivity,
          project_files: [...(selectedActivity.project_files || []), ...uploaded.map(f => f.url)],
        };
        setSelectedActivity(updated);
        setHasChanges(true);
        toast({ title: 'Success', description: `${uploaded.length} file(s) uploaded successfully.` });
      }
      setUploadingFiles(new Set());
    }
  };

  const handleDeleteFile = (fileUrl: string, index: number) => {
    if (selectedActivity) {
      const updated = {
        ...selectedActivity,
        project_files: selectedActivity.project_files?.filter((_, i) => i !== index) || [],
      };
      setSelectedActivity(updated);
      setHasChanges(originalActivity ? !areActivitiesEqual(updated, originalActivity) : false);
    }
  };

  const handleStartEdit = () => {
    setOriginalActivity({ ...selectedActivity } as Opportunity);
    setIsEditMode(true);
    setHasChanges(false);
  };

  const handleCancelChanges = () => {
    if (originalActivity) {
      setSelectedActivity({ ...originalActivity });
      setIsEditMode(false);
      setOriginalActivity(null);
      setHasChanges(false);
    }
  };

  const handleSaveCompletedChanges = async () => {
    if (!selectedActivity || !hasChanges) return;
    setIsSaving(true);
    try {
      const filesToDelete =
        originalActivity?.project_files?.filter(
          f => !selectedActivity.project_files?.includes(f)
        ) || [];
      await editActivity({
        opportunityId: selectedActivity.opportunity_id,
        description: selectedActivity.user_description || '',
        projectFiles: selectedActivity.project_files || [],
        filesToDelete,
      });
      setIsEditMode(false);
      setOriginalActivity(null);
      setHasChanges(false);
      toast({ title: 'Changes Saved', description: 'Your activity has been updated successfully.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update activity. Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const formSchema = z.object({
    opportunity_id: z.string(),
    description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
    files: z.array(z.instanceof(File)).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { opportunity_id: '', description: '', files: undefined },
  });

  const openCompletionSheet = (activity: Opportunity) => {
    setSelectedActivity(activity);
    form.reset({ opportunity_id: activity.opportunity_id, description: '', files: undefined });
    setOpenSubmitForm(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();
      formData.append('opportunity_id', values.opportunity_id);
      formData.append('description', values.description);
      if (values.files) values.files.forEach(file => formData.append(file.name, file));
      await completeActivity(formData);
      setOpenSubmitForm(false);
      setSelectedActivity(null);
      toast({ title: 'Activity Completed', description: 'Activity has been marked as complete.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to mark activity as complete. Please try again.', variant: 'destructive' });
    }
  };

  const handleAddCustomActivity = async (activityData: Partial<Opportunity>) => {
    setAddActivityLoading(true);
    try {
      await addActivity(activityData);
      setIsAddActivitySheetOpen(false);
      toast({ title: 'Activity Added', description: 'Your custom activity has been added to your portfolio.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add custom activity. Please try again.', variant: 'destructive' });
    } finally {
      setSelectedActivity(null);
      setAddActivityLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setPDFloading(true);
      const pdfBase64 = await exportPortfolioPDF();
      const bytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${profile.first_name}-${profile.last_name}-portfolio.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'PDF Exported', description: 'Your portfolio has been exported as a PDF.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to export PDF. Please try again.', variant: 'destructive' });
    } finally {
      setPDFloading(false);
    }
  };

  const renderActivityCard = (opportunity: Opportunity) => (
    <Card
      key={opportunity.opportunity_id}
      className="flex flex-col items-center justify-between text-center w-full h-full hover:bg-gray-100 cursor-pointer"
      onClick={() => setSelectedActivity(opportunity)}
    >
      <CardContent className="flex flex-col items-center justify-start w-full pt-6 px-4">
        <div className="relative h-16 w-16 mb-4 shrink-0 overflow-hidden rounded-lg bg-gray-50">
          <SafeImage
            src={opportunity.image}
            alt={opportunity.title}
            fill
            sizes="64px"
            className="object-contain p-1"
            showFallbackWhenEmpty
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <ActivityIcon className="w-6 h-6 text-gray-400" />
              </div>
            }
          />
        </div>
        <h3 className="text-xl font-semibold mb-2 line-clamp-2 h-14">{opportunity.title}</h3>
        {opportunity.short_description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 h-16">{opportunity.short_description}</p>
        )}
      </CardContent>
      <CardFooter className="bg-gray-100 w-full p-4">
        <div className="flex flex-row items-center w-full">
          {!opportunity.custom_opportunity && (
            <div className="flex items-center text-sm text-gray-500 flex-grow">
              <Clock className="w-5 h-5 mr-2 text-gray-400" />
              <span>{time_conversions[opportunity.time_required]}</span>
            </div>
          )}
          {opportunity.weightage ? (
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < opportunity.weightage ? 'text-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
          ) : <div className="flex-grow" />}
          <div className="ml-auto">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );

  const renderFilters = () => (
    <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Filters</Button>
      </SheetTrigger>
      <SheetContent>
        <ScrollArea className="h-full w-full rounded-md">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <Input
              type="text"
              placeholder="Search activities"
              value={tempFilters.name}
              onChange={e => handleTempFilterChange('name', e.target.value)}
            />
            <div>
              <label className="block mb-2">Supercurricular Type</label>
              <select value={tempFilters.type} onChange={e => handleTempFilterChange('type', e.target.value)} className="w-full p-2 border rounded">
                <option value="">All Types</option>
                <option value="Course">Course</option>
                <option value="Competition">Competition</option>
                <option value="Club">Club</option>
                <option value="Reading">Reading</option>
                <option value="Podcast">Podcast</option>
                <option value="Project">Project</option>
                <option value="Volunteering">Volunteering</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Time Requirement</label>
              <select value={tempFilters.time_required} onChange={e => handleTempFilterChange('time_required', e.target.value)} className="w-full p-2 border rounded">
                <option value="">Any</option>
                <option value="0">A few hours</option>
                <option value="1">A few days</option>
                <option value="2">A couple of weeks</option>
                <option value="3">A month</option>
                <option value="4">A few months</option>
                <option value="5">More than 6 months</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Relevant Subject Areas</label>
              <MultiSelectWithReactSelect
                options={filteredSubjects}
                value={tempFilters.subjects.map(s => ({ value: s, label: s }))}
                onChange={handleSubjectChange}
              />
            </div>
            <div>
              <label className="block mb-2">Applicable Year Groups</label>
              <MultiSelectWithReactSelect
                options={yearGroups}
                value={tempFilters.year_groups.map(y => ({ value: y.toString(), label: `Year ${y}` }))}
                onChange={handleYearGroupChange}
              />
            </div>
            <div>
              <label className="block mb-3">Submit After</label>
              <DatePickerDemo date={tempFilters.after_submission_date} setDate={d => handleTempFilterChange('after_submission_date', d)} />
            </div>
            <div>
              <label className="block mb-3">Submit Before</label>
              <DatePickerDemo date={tempFilters.before_submission_date} setDate={d => handleTempFilterChange('before_submission_date', d)} />
            </div>
            <div>
              <label className="block mb-2">Minimum Star Rating</label>
              <SliderWithTooltip min={0} max={5} step={1} value={sliderValue} onChange={handleSliderChange} />
            </div>
            <div className="flex space-x-2">
              {[
                { id: 'online', label: 'Online' },
                { id: 'internal', label: 'Internal' },
                { id: 'free', label: 'Free' },
              ].map(({ id, label }) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox
                    id={id}
                    checked={tempFilters[id as keyof FilterState] as boolean}
                    onCheckedChange={checked => handleTempFilterChange(id, checked)}
                  />
                  <label htmlFor={id}>{label}</label>
                </div>
              ))}
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

  const renderActivityDetails = () => (
    <Sheet
      open={!!selectedActivity && !isSubmitFormOpen}
      onOpenChange={() => {
        setSelectedActivity(null);
        setIsEditMode(false);
        setOriginalActivity(null);
        setHasChanges(false);
      }}
    >
      <SheetContent className="overflow-hidden w-full sm:max-w-xl md:max-w-2xl">
        <ScrollArea className="h-[calc(100vh-2rem)]">
          {selectedActivity && (
            <div className="w-full max-w-[calc(100%-1rem)] pr-2">
              <SheetHeader className="mb-6">
                <div className="flex flex-row items-start gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                    <SafeImage
                      src={selectedActivity.image}
                      alt={selectedActivity.title}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                      showFallbackWhenEmpty
                      fallback={
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <ActivityIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-2xl font-bold break-words">{selectedActivity.title}</SheetTitle>
                    <SheetDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="default">{selectedActivity.opportunity_type}</Badge>
                        {Object.values(selectedActivity.subjects).slice(0, 3).map((subject, i) => (
                          <Badge key={i} variant="outline">{subject}</Badge>
                        ))}
                        <Badge variant="secondary">
                          {selectedActivity.custom_opportunity ? 'Custom Opportunity' : selectedActivity.internal ? 'Internal' : 'External'}
                        </Badge>
                      </div>
                      {selectedActivity.status !== 'Completed'
                        ? !selectedActivity.custom_opportunity && selectedActivity.started_at && (
                            <p className="mt-3 text-sm">Started on {formatDate(selectedActivity.started_at)}</p>
                          )
                        : selectedActivity.finished_at && (
                            <p className="mt-3 text-sm">Completed on {formatDate(selectedActivity.finished_at)}</p>
                          )}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="space-y-8 pb-6">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700 break-words hyphens-auto whitespace-pre-wrap">{selectedActivity.full_description}</p>
                </div>
                {!selectedActivity.custom_opportunity && selectedActivity.status !== 'Completed' && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-3">Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 mr-2 shrink-0 text-gray-500" />
                          <span>{time_conversions[selectedActivity.time_required]}</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-5 h-5 mr-2 shrink-0 text-gray-500" />
                          <span>{selectedActivity.weightage}</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="w-5 h-5 mr-2 shrink-0 text-gray-500" />
                          <span>{selectedActivity.submission_date ? formatDate(selectedActivity.submission_date) : 'No Submission Date'}</span>
                        </div>
                        <div className="flex items-center">
                          <Globe className="w-5 h-5 mr-2 shrink-0 text-gray-500" />
                          <span>{selectedActivity.online ? 'Online' : 'In-person'}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 mr-2 shrink-0 text-gray-500" />
                          <span>{selectedActivity.cost === 0 ? 'Free' : `$${selectedActivity.cost}`}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Guidance</h4>
                      <div className="space-y-4">
                        {selectedActivity.advice && (
                          <div>
                            <h5 className="font-medium mb-1">Advice</h5>
                            <p className="text-gray-700 break-words">{selectedActivity.advice}</p>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                          {selectedActivity.contact_name && selectedActivity.contact_email && (
                            <Button variant="outline" className="flex-1 justify-start" asChild>
                              <a href={`mailto:${selectedActivity.contact_email}`} target="_blank" rel="noopener noreferrer">
                                <Mail className="mr-2 h-4 w-4 shrink-0" /> {selectedActivity.contact_name}
                              </a>
                            </Button>
                          )}
                          {selectedActivity.url && (
                            <Button variant="outline" className="flex-1 justify-start" asChild>
                              <a href={selectedActivity.url} target="_blank" rel="noopener noreferrer">
                                Website <ExternalLink className="ml-2 w-4 h-4 shrink-0" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {selectedActivity.status === 'Completed' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold mb-2">Your Experience</h4>
                      <div className="space-x-2">
                        {isEditMode ? (
                          <>
                            <Button variant="outline" onClick={handleCancelChanges} disabled={isSaving}>Cancel</Button>
                            <Button variant="default" onClick={handleSaveCompletedChanges} disabled={!hasChanges || isSaving}>
                              {isSaving ? <><span className="mr-2">Saving...</span><LoaderCircle className="animate-spin" /></> : 'Save Changes'}
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" onClick={handleStartEdit}>Edit</Button>
                        )}
                      </div>
                    </div>
                    <h5 className="font-medium">Description</h5>
                    <Textarea
                      value={selectedActivity.user_description}
                      onChange={e => {
                        const updated = { ...selectedActivity, user_description: e.target.value };
                        setSelectedActivity(updated);
                        setHasChanges(originalActivity ? !areActivitiesEqual(updated, originalActivity) : false);
                      }}
                      disabled={!isEditMode || isSaving}
                    />
                    <h5 className="font-medium">Project Files</h5>
                    <div className="space-y-2">
                      {selectedActivity.project_files && selectedActivity.project_files.length > 0 ? (
                        selectedActivity.project_files.map((file, index) => (
                          <FilePreview
                            key={index}
                            fileUrl={file}
                            fileName={file.split('/').pop()?.split(`${selectedActivity.opportunity_id}-`).pop() || `File ${index + 1}`}
                            isEditable={isEditMode && !isSaving}
                            onDelete={() => handleDeleteFile(file, index)}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No project files attached.</p>
                      )}
                      {isEditMode && (
                        <>
                          <Input type="file" multiple disabled={isSaving || uploadingFiles.size > 0} onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                          {uploadingFiles.size > 0 && (
                            <div className="mt-2">
                              <p>Uploading files:</p>
                              {Array.from(uploadingFiles).map(name => (
                                <div key={name} className="flex items-center mt-1"><LoaderCircle className="animate-spin mr-2" size={16} /><span>{name}</span></div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <SheetFooter className="mt-8 pt-4 border-t">
                {selectedActivity.status === 'In Progress' && (
                  <Button onClick={() => openCompletionSheet(selectedActivity)} className="w-full">Mark as Complete</Button>
                )}
              </SheetFooter>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );

  const renderCompletionSheet = () => (
    <Sheet open={isSubmitFormOpen} onOpenChange={() => setOpenSubmitForm(false)}>
      <SheetContent className="min-w-[35%]">
        {selectedActivity && (
          <>
            <SheetHeader>
              <SheetTitle>{selectedActivity.title}</SheetTitle>
              <SheetDescription>
                <div className="flex items-center mb-4">
                  <Badge variant="default" className="mr-2">{selectedActivity.opportunity_type}</Badge>
                  {Object.values(selectedActivity.subjects).slice(0, 2).map((subject, i) => (
                    <Badge key={i} variant="outline" className="mr-2">{subject}</Badge>
                  ))}
                </div>
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Describe your experience & accomplishments</h4>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <input type="hidden" {...form.register('opportunity_id')} />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your activity or project..." {...field} />
                        </FormControl>
                        <FormDescription>Provide a detailed description of your activity or project.</FormDescription>
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
                            onChange={e => onChange(Array.from(e.target.files || []))}
                            {...rest}
                          />
                        </FormControl>
                        <FormDescription>Upload relevant files (PDF, DOC, DOCX, JPG, JPEG, PNG).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );

  const renderAddActivitySheet = () => {
    const handleNewActivitySubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.target as HTMLFormElement);
      fd.append('opportunity_type', activityType);
      fd.append('subjects', JSON.stringify(subjects.map(s => s.value)));
      fd.append('full_description', description);
      const activityData = { ...Object.fromEntries(fd.entries()), subjects: subjects.map(s => s.value) };
      handleAddCustomActivity(activityData as Partial<Opportunity>);
    };

    return (
      <Sheet open={isAddActivitySheetOpen} onOpenChange={setIsAddActivitySheetOpen}>
        <SheetTrigger asChild>
          <Button onClick={() => setIsAddActivitySheetOpen(true)}>Add Activity</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Custom Activity</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleNewActivitySubmit}>
            <div className="space-y-4 mt-4">
              <Input name="title" placeholder="Activity title" required />
              <Textarea name="description" placeholder="Describe the activity" className="w-full p-2 border rounded" onChange={e => setDescription(e.target.value)} required />
              <Select required onValueChange={setActivityType}>
                <SelectTrigger className="w-full p-2 border rounded">
                  <SelectValue placeholder="Select an activity type" />
                </SelectTrigger>
                <SelectContent>
                  {['Course','Competition','Club','Reading','Podcast','Project','Volunteering'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ReactSelect options={filteredSubjects} isMulti placeholder="Select related subjects..." onChange={selected => setSubjects(selected as unknown as SubjectOption[])} required />
              <Button type="submit" disabled={addActivityLoading}>Add Activity</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    );
  };

  if (isLoading) return <PortfolioSkeleton />;
  if (error) return <div>Error loading portfolio. Please try again.</div>;

  return (
    <div className="h-screen bg-white w-full p-8">
      <h1 className="text-2xl font-semibold mb-6">Portfolio</h1>
        <Card className="mb-6 w-full">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-around gap-4 py-2">
            {[
              { icon: <CheckCircle className="w-5 h-5 text-green-500" />, value: activities.filter(a => a.status === 'Completed').length, label: 'Completed' },
              { icon: <Clock className="w-5 h-5 text-blue-500" />, value: activities.filter(a => a.status === 'In Progress').length, label: 'Ongoing' },
              { icon: <Star className="w-5 h-5 text-yellow-400" />, value: activities.filter(a => a.status === 'Completed').reduce((sum, a) => sum + a.weightage, 0), label: 'Total Stars' },
            ].map(({ icon, value, label }) => (
              <Card key={label} className="flex flex-col items-center justify-center pt-4 pb-3 px-6 flex-1">
                <div className="mb-1">{icon}</div>
                <span className="text-2xl font-bold">{value}</span>
                <span className="text-sm text-gray-500 mt-1">{label}</span>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-8 border-t pt-6 mt-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">My Activities</h2>
            <div className="flex items-center gap-2">
              {renderFilters()}
              {renderAddActivitySheet()}
              <Button onClick={handleExportPDF} disabled={PDFloading} variant="outline">
                {PDFloading ? 'Exporting...' : 'Export PDF'}
              </Button>
            </div>
          </div>

          {(['In Progress', 'Completed'] as const).map(status => (
            <div key={status} className="w-[90%] space-x-10">
              <h3 className="text-base font-medium text-gray-500 mb-4">
                {status === 'In Progress' ? 'Ongoing Activities' : 'Completed Activities'}
              </h3>
              <Carousel opts={{ loop: true }} className="w-full">
                <CarouselContent className="-ml-2">
                  {filteredActivities
                    .filter(a => a.status === status)
                    .map(opp => (
                      <CarouselItem key={opp.opportunity_id} className="md:basis-1/2 lg:basis-1/3 pl-2">
                        {renderActivityCard(opp)}
                      </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          ))}
        </div>

        {renderActivityDetails()}
        {isSubmitFormOpen && renderCompletionSheet()}
    </div>
  );
};

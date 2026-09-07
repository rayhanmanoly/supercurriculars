import { useState, useEffect} from 'react';
import { useResourceData } from './useResourceData';
import ResourceSkeleton from './ResourceSkeleton';
import { Opportunity, ProfileData } from '@/lib/types';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { time_conversions } from '@/lib/globals';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { debugLog } from '@/lib/debug';
import { ScrollArea } from '@/components/ui/scroll-area';
import MultiSelectWithReactSelect from '@/components/MultiSelectWithReact';
import { DatePickerDemo } from '@/components/DatePicker';
import SliderWithTooltip from '@/components/SliderWithTooltip';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { yearGroups, filteredSubjects } from '@/lib/globals';
import {useActivities} from './useActivities';
import { OpportunityCard } from '@/components/OpportunityCard';



interface FilterState {
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
    time_required: string;
    free: boolean;
  }


interface ResourceContentProps {
  profile: ProfileData;
}

export const ResourceContent = ({ profile }: ResourceContentProps) => {
  const { data, error, isLoading, mutate } = useResourceData();
  const { activityIds, isLoading: activitiesLoading, error: activitiesError, addActivity, isActivityAdded, refresh: refreshActivities } = useActivities();
  const [openOpportunityId, setOpenOpportunityId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    type: '',
    subjects: [] as string[],
    year_groups: [] as number[],
    weightage: 0,
    online: false,
    internal: false,
    before_submission_date: null,
    after_submission_date: null,
    one_off: false,
    custom_opportunity: false,
    time_required: '',
    free: false,
  });

  const [tempFilters, setTempFilters] = useState<FilterState>({ ...filters });

  const timeLabel = (value: string) => {
    return value === '' ? 'Any' : time_conversions[parseInt(value)];
  }

  const FilterBadges = ({ 
    filters, 
    onRemoveFilter 
  }: { 
    filters: typeof tempFilters,
    onRemoveFilter: (key: keyof typeof filters) => void 
  }) => {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {filters.type && (
          <Badge variant="secondary" className="px-3 py-1">
            Type: {filters.type}
            <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('type')} />
          </Badge>
        )}
        
        {filters.subjects.length > 0 && (
          <Badge variant="secondary" className="px-3 py-1">
            Subjects: {filters.subjects.join(', ')}
            <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('subjects')} />
          </Badge>
        )}
        
        {filters.year_groups.length > 0 && (
          <Badge variant="secondary" className="px-3 py-1">
            Years: {filters.year_groups.join(', ')}
            <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('year_groups')} />
          </Badge>
        )}
        
        {filters.time_required && (
          <Badge variant="secondary" className="px-3 py-1">
            Time: {timeLabel(filters.time_required)}
            <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('time_required')} />
          </Badge>
        )}
        
        {filters.weightage > 0 && (
          <Badge variant="secondary" className="px-3 py-1">
            Min Rating: {filters.weightage}
            <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('weightage')} />
          </Badge>
        )}
        
        {filters.online && (
          <Badge variant="secondary" className="px-3 py-1">
            Online Only
            <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('online')} />
          </Badge>
        )}
        
        {filters.internal && (
          <Badge variant="secondary" className="px-3 py-1">
            Internal Only
            <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('internal')} />
          </Badge>
        )}
        
        {filters.free && (
          <Badge variant="secondary" className="px-3 py-1">
            Free Only
            <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('free')} />
          </Badge>
        )}
      </div>
    );
  };
  
  // Add this handler in your main component
  const handleRemoveFilter = (key: keyof typeof filters) => {
    const newFilters = { ...filters };
    
    // Handle different types of filters
    switch (key) {
      case 'subjects':
      case 'year_groups':
        newFilters[key] = [];
        break;
      case 'weightage':
        newFilters.weightage = 0;
        setSliderValue(0);
        break;
      case 'online':
      case 'internal':
      case 'free':
        newFilters[key] = false;
        break;
      case 'time_required':
      case 'type':
        newFilters[key] = '';
        break;
      default:
        break;
    }
    
    setFilters(newFilters);
    setTempFilters(newFilters);
  };


  const { toast } = useToast();
  const router = useRouter();
  const handleTempFilterChange = (filterName: keyof FilterState, value: any) => {
    setTempFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));
  };

  const handleSaveFilters = () => {
    setFilters({...tempFilters});
    setIsFilterSheetOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      type: '',
      subjects: [] as string[],
      year_groups: [] as number[],
      weightage: 0,
      online: false,
      internal: false,
      before_submission_date: null,
      after_submission_date: null,
      one_off: false,
      custom_opportunity: false,
      time_required: '',
      free: false,
    };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setSliderValue(0);
    setIsFilterSheetOpen(false);
  };

  const handleSliderChange = (newValue: number) => {
    setSliderValue(newValue);
    handleTempFilterChange('weightage', newValue);
  };

  const handleSubjectChange = (selected: any) => {
    handleTempFilterChange('subjects', selected.map((option: any) => option.value));
  };

  const handleYearGroupChange = (selected: any) => {
    handleTempFilterChange('year_groups', selected.map((option: any) => parseInt(option.value)));
  };


  useEffect(() => {
    const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return value;
      return value !== '' && value !== 0 && value !== null;
    });

    setIsSearching(searchTerm !== '' || hasActiveFilters);
    debugLog(filters.time_required !== '');
    if (searchTerm !== '' || hasActiveFilters) {
      applyFilters(data?.opportunities || []);
    } else {
      setFilteredOpportunities(data?.opportunities || []);
    }
  }, [searchTerm, filters, data?.opportunities]);

  // Add filter application logic
  const applyFilters = (opportunities: Opportunity[]) => {
    const filtered = opportunities.filter((opp) => {
      const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          opp.short_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          opp.full_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          searchTerm === '';
      const matchesType = !filters.type || opp.opportunity_type === filters.type;
      const matchesSubjects = filters.subjects.length === 0 || 
                            filters.subjects.some(subj => Object.values(opp.subjects || {}).includes(subj));
      const matchesYearGroups = filters.year_groups.length === 0 ||
                              (Array.isArray(opp.year_groups) && 
                               filters.year_groups.some(year => opp.year_groups.includes(year)));
      const matchesWeightage = opp.weightage >= filters.weightage;
      const matchesOnline = !filters.online || opp.online;
      const matchesInternal = !filters.internal || opp.internal;
      const matchesFree = !filters.free || opp.cost === 0;
      const matchesTimeRequired = !filters.time_required || opp.time_required <= parseInt(filters.time_required);
      const matchesDate = (!filters.before_submission_date && !filters.after_submission_date) || 
                         !opp.submission_date || 
                         ((filters.before_submission_date && filters.after_submission_date) && 
                         (Date.parse(opp.submission_date.toString()) <= filters.before_submission_date.getTime() && 
                          Date.parse(opp.submission_date.toString()) >= filters.after_submission_date.getTime()));

      return matchesSearch && matchesType && matchesSubjects && matchesYearGroups &&
             matchesWeightage && matchesOnline && matchesInternal && matchesFree && 
             matchesTimeRequired && matchesDate;
    });
    setFilteredOpportunities(filtered);
  };


  if (isLoading) return <ResourceSkeleton />;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data available</div>;

  const handleAddToCourses = async (opportunityId: string, title: string) => {
    try {
      await addActivity(opportunityId);
      toast({
        title: "Success!",
        description: `${title} has been added to your portfolio.`,
      });
      // Refresh the data
      router.refresh();
    } catch (error) {
      console.error('Error adding activity:', error);
        toast({
          title: "Error",
          description: "Failed to add activity. Please try again.",
          variant: "destructive",
        });
      }
  };

  const handleRefresh = () => {
    mutate(); // You can also pass data for optimistic updates
  };

  const renderRecommendedSection = (
    recommendedOpportunities: { [key: string]: Opportunity[] },
    openOpportunityId: string | null,
    setOpenOpportunityId: (id: string | null) => void,
    userActivities: string[],
    handleAddToCourses: (id: string, title: string) => Promise<void>
  ) => (
    <div className="flex-1 w-full">
    <h1 className='text-2xl font-semibold mb-4'>Recommended Activities</h1>
    {Object.entries(recommendedOpportunities).map(([type, opps]) => (
      (opps.length > 0) ?
      <div key={type} className='w-[90%] space-x-10 py-2 mb-4'>
        <h2 className="text-xl font-semibold mb-4">{type === 'Volunteering' || type === 'Reading' ? type : `${type}s`}</h2>
        <Carousel opts={{
            loop: true,
            }} className='w-full'>
          <CarouselContent className='-ml-2'>
            {opps.map((opp) => (
              <CarouselItem key={opp.opportunity_id} className="md:basis-1/2 lg:basis-1/3 pl-2">
                <OpportunityCard
                    type = {'resources'}
                    opportunity={opp}
                    isInPortfolio={isActivityAdded(opp.opportunity_id)}
                    showAddButton={true}
                    onAddClick={handleAddToCourses}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    : <div></div>))}
  </div>
  );

  const renderSearchResults = (
    isSearching: boolean,
    filteredOpportunities: Opportunity[],
    openOpportunityId: string | null,
    setOpenOpportunityId: (id: string | null) => void,
    userActivities: string[],
    handleAddToCourses: (id: string, title: string) => Promise<void>
  )  => (
    <div>
      {isSearching
    ? <h1 className='text-xl font-semibold mb-6'>Search Results</h1>
    : <h1 className='text-xl font-semibold mb-6'>Suggested Activities</h1>
    }
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredOpportunities.map((opp) => 
        <OpportunityCard
        type = {'resources'}
        opportunity={opp}
        isInPortfolio={isActivityAdded(opp.opportunity_id)}
        showAddButton={true}
        onAddClick={handleAddToCourses}
    />
        )}
    </div>
    </div>
  );


const renderFilters = () => (
    <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="ml-2">Filters</Button>
      </SheetTrigger>
      <SheetContent className='w-[400px] sm:max-w-[540px]'>
        <ScrollArea className="h-[calc(100vh-8rem)] pr-4 mr-[-1rem]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="block mb-2">Supercurricular Type</label>
            <select
              id='type'
              value={tempFilters.type}
              onChange={(e) => handleTempFilterChange('type', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Types</option>
              <option value="Course">Course</option>
              <option value="Competition">Competition</option>
              <option value="Club">Club</option>
              <option value="Reading">Reading</option>
              <option value="Podcast">Podcast</option>
              <option value="Project">Project</option>
              <option value="Volunteering">Voluntering</option>
              
              {/* Add more options based on your data */}
            </select>
          </div>

          <div>
            <label className="block mb-2">Time Requirement</label>
            <select
              id = 'time'
              value={tempFilters.time_required}
              onChange={(e) => handleTempFilterChange('time_required', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value = ''> Any</option>
              <option value="0">A few hours</option>
              <option value="1">A few days</option>
              <option value="2">A couple of weeks</option>
              <option value='3' >A month</option>
              <option value="4">A few months</option>
              <option value="5">More than 6 months</option>
              
              {/* Add more options based on your data */}
            </select>
          </div>
          <div>
            <label className='block mb-2'>Relevant Subject Areas</label>
          <MultiSelectWithReactSelect options = {filteredSubjects} value = {tempFilters.subjects.map(subject => ({value: subject, label: subject}))} onChange={handleSubjectChange}/>
          </div>

          <div>
            <label className='block mb-2'>Applicable Year Groups</label>
          <MultiSelectWithReactSelect options = {yearGroups} value = {tempFilters.year_groups.map(year => ({value: year.toString(), label: `Year ${year}`}))} onChange={handleYearGroupChange}/>
          </div>


            <div>
            <label className='block mb-3'>Submit After</label>
            <DatePickerDemo 

              date={tempFilters.after_submission_date} 
              setDate={(date) => {handleTempFilterChange('after_submission_date', date)}} 
            />
            </div>

            <div>
            <label className='block mb-3'>Submit Before</label>
            <DatePickerDemo
            
              date={tempFilters.before_submission_date} 
              setDate={(date) => handleTempFilterChange('before_submission_date', date)} 
            />
            </div>

          
        

          <div>
            <label className="block mb-2">Minimum Star Rating</label>
            <SliderWithTooltip 
              min={0} 
              max={5} 
              step={1} 
              value={sliderValue} 
              onChange={handleSliderChange} 
      />
          </div>
          <div className='flex space-x-2'>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="online"
              checked={tempFilters.online}
              onCheckedChange={(checked) => handleTempFilterChange('online', checked)}
            />
            <label htmlFor="online">Online</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="internal"
              checked={tempFilters.internal}
              onCheckedChange={(checked) => handleTempFilterChange('internal', checked)}
            />
            <label htmlFor="internal">Internal</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="free"
              checked={tempFilters.free}
              onCheckedChange={(checked) => handleTempFilterChange('free', checked)}
            />
            <label htmlFor="free">Free</label>
          
          </div>
          {/* Add more filter options here */}
          </div>
        </div>
        </ScrollArea>
        <SheetFooter className="mt-4">
          <Button onClick={handleResetFilters} variant="outline">Reset</Button>
          <Button onClick={handleSaveFilters}>Save Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    
  );

  return (
    <div className="flex-1 p-8 w-full">
    <h1 className="text-2xl font-semibold mb-6">Resource Hub</h1>
    <div className="flex mb-6 items-center w-full">
          <div className="relative mr-2 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search Activities"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
          </div>
          {renderFilters()}
        </div>
        <FilterBadges 
        filters={filters} 
        onRemoveFilter={handleRemoveFilter}
      />
      <div className="flex flex-1 pt-4">
      {isSearching || Object.values(data.recommendedOpportunities).every(arr => arr.length === 0)
        ?  renderSearchResults(
            isSearching,
            filteredOpportunities,
            openOpportunityId,
            setOpenOpportunityId,
            data.userActivities,
            handleAddToCourses
          )
        :renderRecommendedSection(
            data.recommendedOpportunities,
            openOpportunityId,
            setOpenOpportunityId,
            data.userActivities,
            handleAddToCourses
          )
       
        }
        {/* Other components */}
      </div>
      </div>
  );
};

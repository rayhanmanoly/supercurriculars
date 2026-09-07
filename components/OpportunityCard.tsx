import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SafeImage } from '@/components/SafeImage';
import { ExternalLink, Clock, Star, Globe, CalendarIcon, Mail, ActivityIcon, SidebarOpenIcon, WalletMinimal } from 'lucide-react';
import { time_conversions } from '@/lib/globals';
import { Opportunity } from '@/lib/types';
import {Dialog, DialogContent, DialogTrigger} from '@/components/ui/dialog';
import FilePreview from '@/components/FilePreview';
import { Separator } from './ui/separator';


interface OpportunityCardProps {
  type: string;
  opportunity: Opportunity;
  isInPortfolio?: boolean;
  showAddButton?: boolean;
  onAddClick?: (id: string, title: string) => Promise<void>;
  showEditButton?: boolean;
  onEditClick?: (opportunity: Opportunity) => void;
}

export const OpportunityCard = ({ 
  type,
  opportunity, 
  isInPortfolio = false,
  showAddButton = false,
  onAddClick,
  showEditButton = false,
  onEditClick
}: OpportunityCardProps) => {
  const formatDate = (inputDate: Date | string) => {
    try {
      if (typeof(inputDate) == 'string') {
        inputDate = new Date(inputDate);
      }
      return inputDate.toLocaleDateString('en-GB')
    } catch (error) {
      if (typeof(inputDate) == 'string') {
        const formattedDate = new Date(inputDate)
        const day = formattedDate.getDate().toString().padStart(2, '0');
        const month = (formattedDate.getMonth() + 1).toString().padStart(2, '0');
        const year = formattedDate.getFullYear().toString().slice(-2);
        return `${day}/${month}/${year}`;
      } else {
        return ('N/A')
      }
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {type === 'table' ? (
          <Button variant="ghost" size="icon"><SidebarOpenIcon className="w-4 h-4" /></Button>
        ) : (
          <Card className="flex flex-col items-center justify-between text-center w-full h-full hover:bg-gray-100 cursor-pointer relative">
            {isInPortfolio && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="opacity-80">In Portfolio</Badge>
            </div>
          )}
          <CardContent className="flex flex-col items-center justify-start w-full pt-6 px-4">
            <div className="relative h-16 w-16 mb-4 shrink-0 overflow-hidden rounded-lg">
              <SafeImage
                src={opportunity.image}
                alt={opportunity.title}
                fill
                sizes="64px"
                className="object-cover"
                showFallbackWhenEmpty
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <ActivityIcon className="w-6 h-6 text-gray-400" />
                  </div>
                }
              />
            </div>
            <h3 className="text-xl font-semibold mb-2 line-clamp-2 h-14">{opportunity.title}</h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2 h-10">{opportunity.subjects.map(String).join(' | ')}</p>
            <p className="text-sm text-gray-600 mb-4 line-clamp-3 h-16">{opportunity.short_description}</p>
          </CardContent>
          <CardFooter className="bg-gray-100 w-full p-4 mt-auto">
            <div className='flex flex-row items-center justify-between w-full'>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" />
                <span className="truncate">{time_conversions[opportunity.time_required]}</span>
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < opportunity.weightage ? 'text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
          </CardFooter>
        </Card>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-hidden min-w-[30%]" >
        <ScrollArea className="h-[calc(100vh-2rem)] ">
          <div className="w-full">
            <div className="w-full max-w-[calc(100%-1rem)]">
          <SheetHeader className="mb-4">
            <div className="flex flex-row items-center gap-4">
              <div className="relative mt-4 mb-2 h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                <SafeImage
                  src={opportunity.image}
                  alt={opportunity.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                  showFallbackWhenEmpty
                  fallback={
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <ActivityIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  }
                />
              </div>
              <div className="">
                <SheetTitle className="text-2xl font-bold break-words">{opportunity.title}</SheetTitle>
                <SheetDescription>
                  <div className="gap-2 mt-1">
                    <Badge variant="default" className="mb-1">{opportunity.opportunity_type}</Badge>
                    {opportunity.subjects.slice(0, 3).map((subject, index) => (
                      <Badge key={index} variant="outline" className="mb-1">{subject}</Badge>
                    ))}
                    <Badge variant="secondary" className="mb-1">{opportunity.internal ? 'Internal' : 'External'}</Badge>
                    {opportunity.year_groups && (
                      <Badge variant="secondary" className="mb-1">Year(s) {opportunity.year_groups.join(', ')}</Badge>
                    )}
                  </div>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div className="w-80">
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-gray-700 break-words hyphens-auto whitespace-pre-wrap">{opportunity.full_description}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-500" />
                  <span>{time_conversions[opportunity.time_required]}</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-gray-500" />
                  <span>{opportunity.weightage}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2 text-gray-500" />
                  <span>{opportunity.submission_date ? formatDate(opportunity.submission_date) : 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-gray-500" />
                  <span>{opportunity.online ? 'Online' : 'In-person'}</span>
                </div>
                <div className="flex items-center">
                  <WalletMinimal className="w-5 h-5 mr-2 text-gray-500" />
                  <span>{opportunity.cost === 0 ? 'Free' : `${opportunity.cost} AED`}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Guidance</h4>
              <div className="space-y-3">
                {opportunity.advice && (
                  <div className="">
                    <h5 className="font-medium mb-1 pr-2">Advice</h5>
                    <p className="text-gray-700 break-words">{opportunity.advice}</p>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {opportunity.contact_name && opportunity.contact_email && (
                      <Button variant="outline" className="flex-1 justify-start" asChild>
                        <a href={`mailto:${opportunity.contact_email}`} target="_blank" rel="noopener noreferrer">
                          <Mail className="mr-2 h-4 w-4" /> {opportunity.contact_name}
                        </a>
                      </Button>
                    )}
                    
                    {opportunity.url && (
                      <Button variant="outline" className="flex-1 justify-start" asChild>
                        <a href={opportunity.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" /> Website
                        </a>
                      </Button>
                    )}
                  </div>
                  
                  {(opportunity.past_projects && opportunity.past_projects.length > 0) && (
                    <Dialog>
                        <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                            <ExternalLink className="mr-2 h-4 w-4" /> Past Projects
                        </Button>
                        </DialogTrigger>
                        <DialogContent className="pt-6">
                        <div className="space-y-2">
                            <h4 className="font-medium text-md">Past Projects</h4>
                            <p className="text-sm text-muted-foreground">These are some relevant resources to help you with this opportunity. Click to download.</p>
                            <Separator className="my-2" />
                            <ScrollArea className="h-[300px] pr-4 pt-2">
                            <div className="space-y-2">
                                {opportunity.past_projects.map((fileUrl: string, index) => {
                                const fileName = fileUrl.split('/').pop()?.split('-++-').pop() || `File ${index + 1}`;
                                return (
                                    <div key={index} className="rounded-lg overflow-hidden border">
                                    <FilePreview fileUrl={fileUrl} fileName={fileName} />
                                    </div>
                                );
                                })}
                            </div>
                            </ScrollArea>
                        </div>
                        </DialogContent>
                    </Dialog>
                    )}
                </div>
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 bg-white p-4 -mx-6">
            {showAddButton && (
              !isInPortfolio ? (
                <Button onClick={() => onAddClick?.(opportunity.opportunity_id, opportunity.title)} className="w-full">
                  Add to My Activities
                </Button>
              ) : (
                <Button className="w-full" variant="ghost" disabled>
                  Activity in Portfolio
                </Button>
              )
            )}
            {showEditButton && (
              <Button onClick={() => onEditClick?.(opportunity)} className="w-full">
                Edit Activity
              </Button>
            )}
          </div>
          </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
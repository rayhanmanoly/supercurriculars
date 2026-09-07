import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Copy } from 'lucide-react';

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [finalDescription, setFinalDescription] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const finalizeDescription = () => {
    setFinalDescription(`${description}\n\n---DO NOT EDIT---\n\n Generated Mentoring Meeting Event`);
    nextStep();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(finalDescription);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 1: Enter Your Schedule Description</DialogTitle>
              <DialogDescription>Include information about the things you can talk about, and where you can meet.</DialogDescription>
            </DialogHeader>
            <Textarea
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter your schedule description here..."
              className="mt-4"
            />
          </>
        );
      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 2: Set Up Your Google Calendar Appointment Schedule</DialogTitle>
            </DialogHeader>
            <img src={`/img/Mentoring Setup Part 1.gif`} alt={'Video Explaining Set Up'} className='w-full' />
            <ol className="list-decimal list-inside space-y-4 mt-4">
              <li>Go to <a href="https://calendar.google.com/calendar/u/0/r/appointment" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Calendar Appointment Scheduler</a></li>
              <li>Enter the title "Mentoring Meeting".</li>
              <li>Select your desired meeting duration. We recommend 30 minutes.</li>
              <li>Configure your available times during the week.</li>
              <li>Click Next.</li>
            </ol>
          </>
        );
      case 3:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 3: Add Description</DialogTitle>
            </DialogHeader>
            <img src={`/img/Mentoring Setup Part 2.gif`} alt={'Video Explaining Set Up'} className='w-full' />
            <div>
              <p>Once you click next, paste the text below into your description.</p>
              <div className='flex justify-end'>
                <Button
                  className="flex items-center gap-2"
                  size="default"
                  variant="outline"
                  onClick={copyToClipboard}
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <><p>Copy</p> <Copy className="h-4 w-4" /></>}
                </Button> 
              </div>
              <div className="mt-2 relative">
                <Textarea
                  value={finalDescription}
                  readOnly
                  className="pr-10 w-full min-h-[100px] max-h-[350px] resize-none overflow-y-auto"
                />
              </div>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 4: Add Additional Fields</DialogTitle>
            </DialogHeader>
            <img src={`/img/Mentoring Setup Part 3.gif`} alt={'Video Explaining Set Up'} className='w-full' />
            <ol className="list-decimal list-inside space-y-2 mt-4">
              <li>Expand the "Booking form" section, and click "Add an item".</li>
              <li>Add a custom item, called "Mentoring Subject", and <span className='font-bold'>set this to required.</span></li>
              <li>Add another custom item, called "Focus", and <span className='font-bold'>set this to required.</span></li>
              <li>Check the 'Require email verification' box.</li>
              <li>Click save.</li>
            </ol>
          </>
        );
      case 5:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 5: Finalize and Save</DialogTitle>
            </DialogHeader>
            <img src={`/img/Mentoring Setup Part 4.gif`} alt={'Video Explaining Set Up'} className='w-full' />
            <ol className="list-decimal list-inside space-y-4 mt-4">
              <li>Click "Save" to create your appointment schedule.</li>
              <li>Once saved, click on share in your schedule.</li>
              <li>Select "Copy link".</li>
              <li>Save this link for future use in the app.</li>
            </ol>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
        <ScrollArea className="flex-grow overflow-auto">
          <div className="pr-4 pb-6">
            {renderStep()}
          </div>
        </ScrollArea>
        <div className="mt-4 flex justify-between">
          {step > 1 && <Button onClick={prevStep} variant="outline">Back</Button>}
          {step < 5 ? (
            <Button onClick={step === 1 ? finalizeDescription : nextStep} className="ml-auto">Next</Button>
          ) : (
            <Button onClick={onClose} className="ml-auto">Finish</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetupWizard;
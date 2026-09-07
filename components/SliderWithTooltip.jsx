import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SliderWithTooltip = ({ min = 0, max = 5, step = 1, value, onChange }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleValueChange = (newValue) => {
    onChange(newValue[0]);
  };

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip}>
        <TooltipTrigger asChild>
          <div
            className="w-full max-w-sm"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Slider
              min={min}
              max={max}
              step={step}
              value={[value]}
              onValueChange={handleValueChange}
              className="w-full"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{value}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SliderWithTooltip;
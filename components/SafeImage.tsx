'use client';

import { useEffect, useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type SafeImageProps = Omit<ImageProps, 'src' | 'onError'> & {
  src?: string | null;
  /** Show fallback UI when src is missing (default: render nothing). */
  showFallbackWhenEmpty?: boolean;
  fallbackClassName?: string;
  fallback?: React.ReactNode;
};

export function SafeImage({
  src,
  alt,
  className,
  fallbackClassName,
  fallback,
  showFallbackWhenEmpty = false,
  width,
  height,
  fill,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const sizedByClass = Boolean(className);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const renderFallback = () => {
    if (fallback) return <>{fallback}</>;

    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-gray-100 text-gray-400',
          fill ? 'absolute inset-0' : sizedByClass ? 'h-full w-full' : undefined,
          fallbackClassName,
          className
        )}
        style={
          !fill && !sizedByClass && width != null && height != null
            ? { width: Number(width), height: Number(height) }
            : undefined
        }
        aria-hidden={!alt}
      >
        <ImageIcon className="h-6 w-6 shrink-0" />
      </div>
    );
  };

  if (!src) {
    return showFallbackWhenEmpty ? renderFallback() : null;
  }

  if (hasError) {
    return renderFallback();
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}

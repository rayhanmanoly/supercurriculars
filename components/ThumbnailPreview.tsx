import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThumbnailPreviewProps {
  url: string;
  maxSize?: number;
  className?: string;
}

const ThumbnailPreview = ({
  url,
  maxSize = 200,
  className = ""
}: ThumbnailPreviewProps) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setThumbnail(null);
    setHasError(false);
  }, [url]);

  useEffect(() => {
    if (!url) return;

    const createThumbnail = () => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = height * (maxSize / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = width * (maxSize / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        setThumbnail(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = () => {
        setHasError(true);
      };

      img.src = url;
    };

    createThumbnail();
  }, [url, maxSize]);

  if (hasError) {
    return (
      <div
        className={cn(
          'relative aspect-square w-[200px] rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center text-gray-400',
          className
        )}
      >
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }

  if (!thumbnail) {
    return <div className={cn('animate-pulse bg-gray-200 w-16 h-16 rounded-md', className)} />;
  }

  return (
    <div className={cn(`relative aspect-square w-[200px] rounded-md overflow-hidden border`, className)}>
      <Image
        src={thumbnail}
        alt="Thumbnail preview"
        fill
        unoptimized
        className="object-contain"
      />
    </div>
  );
};

export default ThumbnailPreview;

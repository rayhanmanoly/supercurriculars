import { useState } from 'react';
import { Input } from './ui/input';
import ThumbnailPreview from './ThumbnailPreview';
import { LoaderCircle } from 'lucide-react';
import { deleteFile, uploadFile } from '@/lib/actions';
import { toast } from './ui/use-toast';

interface ImageManagerProps {
  image: string;
  setImage: React.Dispatch<React.SetStateAction<string>>;
  isEditing?: boolean;
  disabled?: boolean;
  opportunity_id?: string;
}

export function ImageManager({ 
  image, 
  setImage,
  isEditing = true,
  disabled = false,
  opportunity_id 
}: ImageManagerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // If there's an existing image, delete it first
      

      const formData = new FormData();
      formData.append('file', file);
      formData.append('opportunityId', opportunity_id || '');

      const uploadedImageUrl = await uploadFile(formData, 'opportunities', 'images', isEditing);
      if (image) {
        await deleteFile(image, "opportunities");
      }
      uploadedImageUrl && setImage(uploadedImageUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="space-y-2">
      {image && (
        
        <div className="flex items-center gap-2">
        <p className='text-sm font-medium'>Current Image</p>
        <ThumbnailPreview 
          url={image}
          maxSize={1000}
          className="max-w-16 max-h-16"
        />
        </div>
      )}

      {isEditing && (
        <Input
          type="file"
          disabled={disabled || isUploading}
          onChange={handleImageUpload}
          accept="image/*"
        />
      )}
      
      {isUploading && (
        <div className="flex items-center mt-1">
          <LoaderCircle className="animate-spin mr-2" size={14} />
          <p className='text-sm'>Uploading image...</p>
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { Input } from './ui/input';
import FilePreview from './FilePreview';
import { Button } from './ui/button';
import { LoaderCircle, Trash2, UploadIcon } from 'lucide-react';
import { deleteFile, uploadFile } from '@/lib/actions';
import { toast } from './ui/use-toast';

interface FileManagerProps {
  files: string[] ;
  setFiles:  React.Dispatch<React.SetStateAction<string[]>>
  isEditing?: boolean;
  disabled?: boolean;
  opportunity_id?: string;
}

export function FileManager({ 
  files, 
  setFiles,
  isEditing = true,
  disabled = false,
  opportunity_id 
}: FileManagerProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
    const oldFiles = Array.from(e.target.files || []);
    if (oldFiles.length > 0) {
      setUploadingFiles(new Set(oldFiles.map(file => file.name)));

      const uploadPromises = oldFiles.map(async (file) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('opportunityId', opportunity_id || '');

          const uploadedFileUrl = await uploadFile(formData, 'opportunities', 'past-projects', isEditing);
          return { name: file.name, url: uploadedFileUrl };
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          toast({
            title: "Error",
            description: `Failed to upload ${file.name}. Please try again.`,
            variant: "destructive",
          });
          return null;
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const successfulUploads = uploadedFiles.filter(Boolean) as { name: string, url: string }[];

      if (successfulUploads.length > 0) {
        const updatedFiles = [
            ...files,
            ...successfulUploads.map(file => file.url)
          ];
        setFiles(updatedFiles);
        toast({
          title: "Success",
          description: `${successfulUploads.length} file(s) uploaded successfully.`,
        });
      }
    } }catch (error) {
      console.error(`Error uploading files:`, error);
      toast({
        title: "Error",
        description: `Failed to upload files. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(new Set());
    }
  }

  const handleDeleteFile = async (fileUrl: string) => {
    
    await deleteFile(fileUrl, "opportunities");
    setFiles(prev => prev.filter(file => file !== fileUrl));
  };



  return (
    <div className="space-y-2">
      {/* Display existing files that haven't been marked for deletion */}
      {files && files.map((file, index) => (
          <FilePreview 
            key={index} 
            fileUrl={file}
            fileName={file.split('/').pop()?.split('-++-').pop() || ''}
            isEditable={isEditing && !disabled}
            onDelete={() => handleDeleteFile(file)}
          />
        ))}

     

      {isEditing && (
        <Input
          type="file"
          multiple
          disabled={disabled}
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
      )}
      {uploadingFiles.size > 0 && (
        <div className="mt-2">
        <p>Uploading files:</p>
        {Array.from(uploadingFiles).map(fileName => (
            <div key={fileName} className="flex items-center mt-1">
            <LoaderCircle className="animate-spin mr-2" size={14} />
            <p className='text-sm'>{fileName}</p>
            </div>
        ))}
        </div>
      )}

      
    </div>
  );
}
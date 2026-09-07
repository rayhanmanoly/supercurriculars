import React from 'react';
import { FileIcon, FileText, Image, FilePen, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  isEditable?: boolean;
  onDelete?: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl, fileName, isEditable, onDelete }) => {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  const getFileIcon = () => {
    switch (fileExtension) {
      case 'pdf':
        return <FilePen size={24} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image size={24} />;
      case 'doc':
      case 'docx':
        return <FileText size={24} />;
      default:
        return <FileIcon size={24} />;
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering delete in edit mode
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-100">
      <div 
        className="flex items-center cursor-pointer gap-2"
        onClick={handleDownload}
      >
        {getFileIcon()}
        <span className="ml-2 text-sm truncate">{fileName.slice(0, 20)}</span>
      </div>
      {isEditable && onDelete && (
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.preventDefault()
          onDelete();
        }} type="button">
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default FilePreview;
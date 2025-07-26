import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileIcon, FolderIcon, FileText, FileCode, FileImage, MoreVertical, Download, Trash2, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";

// UploadButton component for folder upload
function UploadButton({ folderKey }: { folderKey: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      const key = folderKey.endsWith('/') ? folderKey + file.name : folderKey + '/' + file.name;
      const res = await fetch(`/api/upload?key=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error('Failed to get presigned URL');
      const { url } = await res.json();
      const putRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });
      if (!putRes.ok) throw new Error('Upload failed');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button
        type="button"
        className={cn("ml-2 px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition", loading && "opacity-60 pointer-events-none")}
        onClick={handleClick}
        disabled={loading}
        tabIndex={-1}
      >
        {loading ? 'Uploading...' : success ? 'Uploaded!' : 'Upload'}
      </button>
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
    </>
  );
}


export interface FileItem {
  key: string;
  size: number;
  lastModified: string;
}

export interface FolderItem {
  key: string;
  isOpen?: boolean;
  contents?: {
    files: FileItem[];
    folders: FolderItem[];
  };
  isLoading?: boolean;
  error?: string;
}

interface FileFolderListProps {
  files: FileItem[];
  folders: FolderItem[];
  onFolderClick?: (folderKey: string) => void;
  currentPath?: string;
  level?: number;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch(ext) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />;
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return <FileCode className="h-5 w-5 text-yellow-500" />;
    case 'css':
      return <FileCode className="h-5 w-5 text-blue-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <FileImage className="h-5 w-5 text-green-500" />;
    default:
      return <FileIcon className="h-5 w-5 text-gray-500" />;
  }
};

const FileActions = ({ 
  onDownload, 
  onDelete, 
  onShare, 
  variant = 'default' 
}: { 
  onDownload: () => void, 
  onDelete: () => void, 
  onShare: () => void,
  variant?: 'default' | 'ghost' 
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button 
        variant={variant} 
        size="icon" 
        className={cn(
          "h-8 w-8",
          variant === 'ghost' && "opacity-0 group-hover:opacity-100 transition-opacity"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
        <Download className="mr-2 h-4 w-4" />
        <span>Download</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}>
        <Share2 className="mr-2 h-4 w-4" />
        <span>Share</span>
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={(e) => { e.stopPropagation(); onDelete(); }} 
        className="text-red-600"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>Delete</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const FolderAccordion = ({ folder, level = 0 }: { folder: FolderItem; level?: number }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contents, setContents] = useState<{
    files: FileItem[];
    folders: FolderItem[];
  }>({
    files: [],
    folders: []
  });

  const fetchFolderContents = async (folderKey: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/objects?prefix=${encodeURIComponent(folderKey)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setContents({
        files: data.files || [],
        folders: data.folders || []
      });
    } catch {
      setError('Failed to load folder contents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && contents.files.length === 0 && contents.folders.length === 0 && !isLoading) {
      fetchFolderContents(folder.key);
    }
  };

  return (
    <Accordion type="single" collapsible className={cn("w-full", level > 0 && "ml-4 border-l border-border pl-3")}> 
      <AccordionItem value={folder.key}> 
        <AccordionTrigger onClick={() => handleOpenChange(!open)} className={cn("hover:no-underline py-1", level > 0 && "text-sm")}> 
          <div className="flex items-center gap-2 flex-1"> 
            <FolderIcon className="h-4 w-4 text-blue-500 flex-shrink-0" /> 
            <span className="truncate">{folder.key.split('/').filter(Boolean).pop()}</span> 
            <Badge variant="outline" className="ml-2"> 
              {contents.folders.length + contents.files.length || ''} 
            </Badge> 
            <UploadButton folderKey={folder.key} />
          </div> 
        </AccordionTrigger> 
        <AccordionContent className="pt-2"> 
          {isLoading ? ( 
            <div className="flex items-center justify-center py-4"> 
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div> 
            </div> 
          ) : error ? ( 
            <div className="text-sm text-red-500 py-2">{error}</div> 
          ) : ( 
            <FileFolderList 
              files={contents.files.filter(f => !(f.size === 0 && f.key.endsWith('/')))} 
              folders={contents.folders} 
              level={(level || 0) + 1} 
            /> 
          )} 
        </AccordionContent> 
      </AccordionItem> 
    </Accordion>

    );
}

export default function FileFolderList({ 
  files, 
  folders, 
  level = 0 
}: FileFolderListProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileAction = (action: string, fileKey: string) => {
    console.log(`${action} file:`, fileKey);
    // Implement file actions here
  };

  return (
    <div className={cn("space-y-4", level > 0 && "space-y-2")}>
      {/* Folders Section */}
      {folders.length > 0 && level === 0 && (
        <Accordion type="single" collapsible className="w-full mb-4">
          <AccordionItem value="folders">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-1">
                <FolderIcon className="h-4 w-4" />
                <span>Folders</span>
                <Badge variant="outline" className="ml-2">
                  {folders.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1">
                {folders.map((folder) => (
                  <FolderAccordion key={folder.key} folder={folder} level={level + 1} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      {folders.length > 0 && level > 0 && (
        <div className="space-y-1">
          {folders.map((folder) => (
            <FolderAccordion key={folder.key} folder={folder} level={level + 1} />
          ))}
        </div>
      )}

      {/* Files Section */}
      {files.filter(f => !(f.size === 0 && f.key.endsWith('/'))).length > 0 && (
        <div className="space-y-2">
          {level === 0 && (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-1">
              <FileIcon className="h-4 w-4" />
              <span>Files</span>
              <Badge variant="outline" className="ml-2">
                {files.filter(f => !(f.size === 0 && f.key.endsWith('/'))).length}
              </Badge>
            </div>
          )}
          <Card className={cn("overflow-hidden", level > 0 && "border border-border")}>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={cn("w-[50%]", level > 0 && "pl-6")}>Name</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead className="text-right">Last Modified</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.filter(f => !(f.size === 0 && f.key.endsWith('/'))).map((file) => {
                    const fileName = file.key.split('/').pop() || file.key;
                    return (
                      <TableRow key={file.key} className="group hover:bg-accent/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getFileIcon(fileName)}
                            <span className="truncate max-w-[300px]">{fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                          {formatFileSize(file.size)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                          {new Date(file.lastModified).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <FileActions 
                            variant="ghost"
                            onDownload={() => handleFileAction('download', file.key)}
                            onDelete={() => handleFileAction('delete', file.key)}
                            onShare={() => handleFileAction('share', file.key)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

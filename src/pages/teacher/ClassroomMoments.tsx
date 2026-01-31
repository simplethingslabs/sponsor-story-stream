import { useState, useCallback } from 'react';
import { TeacherLayout } from '@/components/layouts/TeacherLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Camera, 
  Upload, 
  Image, 
  Video, 
  X, 
  Plus,
  Calendar,
  Clock,
  Users,
  Eye,
  Trash2,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { mockChildren, mockEvents } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface ClassroomMoment {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption: string;
  taggedChildren: string[];
  event?: string;
  uploadedAt: string;
  status: 'pending' | 'approved';
}

// Mock moments data
const mockMoments: ClassroomMoment[] = [
  {
    id: 'moment-1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
    caption: 'Science experiment day - making volcanoes!',
    taggedChildren: ['child-1', 'child-3'],
    uploadedAt: '2026-01-28T10:30:00Z',
    status: 'approved',
  },
  {
    id: 'moment-2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=400',
    caption: 'Art class - painting landscapes',
    taggedChildren: ['child-2', 'child-4'],
    event: 'event-4',
    uploadedAt: '2026-01-27T14:15:00Z',
    status: 'approved',
  },
  {
    id: 'moment-3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400',
    caption: 'Reading corner activities',
    taggedChildren: ['child-1', 'child-2', 'child-5'],
    uploadedAt: '2026-01-26T09:00:00Z',
    status: 'pending',
  },
];

export default function ClassroomMoments() {
  const [moments, setMoments] = useState<ClassroomMoment[]>(mockMoments);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [taggedChildren, setTaggedChildren] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const { toast } = useToast();

  const students = mockChildren.filter(c => c.status === 'active');

  const filteredMoments = moments.filter(m => 
    filterStatus === 'all' || m.status === filterStatus
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const toggleChildTag = (childId: string) => {
    setTaggedChildren(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleUpload = async () => {
    if (!selectedFile || !caption.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please add a photo and caption.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newMoment: ClassroomMoment = {
      id: `moment-${Date.now()}`,
      type: selectedFile.type.startsWith('video') ? 'video' : 'image',
      url: previewUrl,
      caption: caption.trim(),
      taggedChildren,
      event: selectedEvent && selectedEvent !== 'none' ? selectedEvent : undefined,
      uploadedAt: new Date().toISOString(),
      status: 'pending',
    };

    setMoments(prev => [newMoment, ...prev]);
    setUploading(false);
    resetForm();
    setUploadDialogOpen(false);
    
    toast({
      title: 'Moment Uploaded!',
      description: 'Your classroom moment has been submitted for approval.',
    });
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setTaggedChildren([]);
    setSelectedEvent('');
  };

  const deleteMoment = (id: string) => {
    setMoments(prev => prev.filter(m => m.id !== id));
    toast({
      title: 'Moment Deleted',
      description: 'The classroom moment has been removed.',
    });
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Classroom Moments</h1>
            <p className="text-muted-foreground">
              Capture and share special moments with sponsors
            </p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Moment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Classroom Moment</DialogTitle>
                <DialogDescription>
                  Share photos or videos from classroom activities. Tag relevant students and add a caption.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Photo/Video</Label>
                  {!previewUrl ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF, MP4 (max 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      {selectedFile?.type.startsWith('video') ? (
                        <video
                          src={previewUrl}
                          className="w-full h-48 object-cover rounded-lg"
                          controls
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Caption */}
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption *</Label>
                  <Textarea
                    id="caption"
                    placeholder="Describe what's happening in this moment..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Tag Students */}
                <div className="space-y-2">
                  <Label>Tag Students</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select students featured in this moment. Their sponsors will see this content.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                    {students.map((child) => (
                      <div
                        key={child.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          taggedChildren.includes(child.id) 
                            ? 'bg-primary/10 border border-primary' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleChildTag(child.id)}
                      >
                        <Checkbox
                          checked={taggedChildren.includes(child.id)}
                          onCheckedChange={() => toggleChildTag(child.id)}
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={child.photo_url} />
                          <AvatarFallback className="text-xs">
                            {child.first_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{child.first_name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Link to Event */}
                <div className="space-y-2">
                  <Label>Link to Event (Optional)</Label>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No event</SelectItem>
                      {mockEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} ({format(new Date(event.event_date), 'MMM d, yyyy')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  resetForm();
                  setUploadDialogOpen(false);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                  {uploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Moment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Camera className="h-6 w-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{moments.length}</p>
              <p className="text-xs text-muted-foreground">Total Moments</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <Eye className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold text-green-700">
                {moments.filter(m => m.status === 'approved').length}
              </p>
              <p className="text-xs text-green-600">Approved</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-1 text-amber-600" />
              <p className="text-2xl font-bold text-amber-700">
                {moments.filter(m => m.status === 'pending').length}
              </p>
              <p className="text-xs text-amber-600">Pending Review</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Moments</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Moments Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMoments.map((moment) => {
            const tagged = students.filter(s => moment.taggedChildren.includes(s.id));
            const event = mockEvents.find(e => e.id === moment.event);
            
            return (
              <Card key={moment.id} className="overflow-hidden">
                <div className="relative aspect-video">
                  {moment.type === 'video' ? (
                    <video
                      src={moment.url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={moment.url}
                      alt={moment.caption}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant={moment.status === 'approved' ? 'default' : 'secondary'}>
                      {moment.status === 'approved' ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    {moment.type === 'video' ? (
                      <Badge variant="outline" className="bg-background/80">
                        <Video className="h-3 w-3 mr-1" /> Video
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-background/80">
                        <Image className="h-3 w-3 mr-1" /> Photo
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm">{moment.caption}</p>
                  
                  {tagged.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex -space-x-2">
                        {tagged.slice(0, 3).map((child) => (
                          <Avatar key={child.id} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={child.photo_url} />
                            <AvatarFallback className="text-xs">
                              {child.first_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {tagged.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs">+{tagged.length - 3}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {tagged.map(c => c.first_name).join(', ')}
                      </span>
                    </div>
                  )}

                  {event && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{event.title}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(moment.uploadedAt), 'MMM d, yyyy')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMoment(moment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredMoments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No moments yet</p>
              <p className="text-muted-foreground mb-4">
                Start capturing special classroom moments to share with sponsors
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload First Moment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherLayout>
  );
}

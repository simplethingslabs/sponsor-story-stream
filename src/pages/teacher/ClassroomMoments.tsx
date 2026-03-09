import { useState } from 'react';
import { TeacherLayout } from '@/components/layouts/TeacherLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Camera, Upload, Image, Video, X, Plus,
  Calendar, Clock, Users, Eye, Trash2, Filter, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useChildren, useEvents, useMoments, useCreateMoment, useDeleteMoment } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function ClassroomMoments() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [taggedChildren, setTaggedChildren] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const { toast } = useToast();

  const { data: childrenData, isLoading: childrenLoading } = useChildren({ status: 'active' });
  const { data: eventsData, isLoading: eventsLoading } = useEvents();
  const { data: momentsData, isLoading: momentsLoading } = useMoments(
    filterStatus !== 'all' ? { status: filterStatus } : undefined
  );
  const createMoment = useCreateMoment();
  const deleteMomentMutation = useDeleteMoment();

  const students = childrenData?.data || [];
  const events = eventsData?.data || [];
  const moments = momentsData?.data || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toggleChildTag = (childId: string) => {
    setTaggedChildren(prev => 
      prev.includes(childId) ? prev.filter(id => id !== childId) : [...prev, childId]
    );
  };

  const handleUpload = async () => {
    if (!selectedFile || !caption.trim()) {
      toast({ title: 'Missing Information', description: 'Please add a photo and caption.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      // 1. Upload file to Cloudinary via backend
      const isVideo = selectedFile.type.startsWith('video');
      const uploadEndpoint = isVideo ? '/upload/video' : '/upload/image';
      const uploadResult = await api.uploadFile(uploadEndpoint, selectedFile, { folder: 'moments' });

      if (uploadResult.error || !uploadResult.data?.url) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // 2. Save moment to database
      await createMoment.mutateAsync({
        type: isVideo ? 'video' : 'image',
        url: uploadResult.data.url,
        caption: caption.trim(),
        event_id: selectedEvent && selectedEvent !== 'none' ? selectedEvent : undefined,
        tagged_children: taggedChildren,
      });

      resetForm();
      setUploadDialogOpen(false);
      toast({ title: 'Moment Uploaded!', description: 'Your classroom moment has been submitted for approval.' });
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setTaggedChildren([]);
    setSelectedEvent('');
  };

  const handleDelete = (id: string) => {
    deleteMomentMutation.mutate(id, {
      onSuccess: () => toast({ title: 'Moment Deleted', description: 'The classroom moment has been removed.' }),
    });
  };

  const isLoading = childrenLoading || eventsLoading || momentsLoading;

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  const approvedCount = moments.filter((m: any) => m.status === 'approved').length;
  const pendingCount = moments.filter((m: any) => m.status === 'pending').length;

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Classroom Moments</h1>
            <p className="text-muted-foreground">Capture and share special moments with sponsors</p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Upload Moment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Classroom Moment</DialogTitle>
                <DialogDescription>Share photos or videos from classroom activities. Tag relevant students and add a caption.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* File picker */}
                <div className="space-y-2">
                  <Label>Photo/Video</Label>
                  {!previewUrl ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF, MP4 (max 10MB)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
                    </label>
                  ) : (
                    <div className="relative">
                      {selectedFile?.type.startsWith('video') ? (
                        <video src={previewUrl} className="w-full h-48 object-cover rounded-lg" controls />
                      ) : (
                        <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                      )}
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Caption */}
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption *</Label>
                  <Textarea id="caption" placeholder="Describe what's happening in this moment..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} />
                </div>

                {/* Tag students */}
                <div className="space-y-2">
                  <Label>Tag Students</Label>
                  <p className="text-xs text-muted-foreground mb-2">Select students featured in this moment. Their sponsors will see this content.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                    {students.map((child) => (
                      <div key={child.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${taggedChildren.includes(child.id) ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'}`} onClick={() => toggleChildTag(child.id)}>
                        <Checkbox checked={taggedChildren.includes(child.id)} onCheckedChange={() => toggleChildTag(child.id)} />
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={child.photo_url} />
                          <AvatarFallback className="text-xs">{child.first_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{child.first_name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event link */}
                <div className="space-y-2">
                  <Label>Link to Event (Optional)</Label>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger><SelectValue placeholder="Select an event" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No event</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} ({format(new Date(event.event_date), 'MMM d, yyyy')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { resetForm(); setUploadDialogOpen(false); }}>Cancel</Button>
                <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                  {uploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>) : (<><Upload className="mr-2 h-4 w-4" />Upload Moment</>)}
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
              <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
              <p className="text-xs text-green-600">Approved</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-1 text-amber-600" />
              <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
              <p className="text-xs text-amber-600">Pending Review</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Moments</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moments.map((moment: any) => {
            const tagged = students.filter(s => moment.tagged_children?.includes(s.id));
            const event = events.find(e => e.id === moment.event_id);

            return (
              <Card key={moment.id} className="overflow-hidden">
                <div className="relative aspect-video">
                  {moment.type === 'video' ? (
                    <video src={moment.url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={moment.url} alt={moment.caption} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant={moment.status === 'approved' ? 'default' : 'secondary'}>
                      {moment.status === 'approved' ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-background/80">
                      {moment.type === 'video' ? <><Video className="h-3 w-3 mr-1" /> Video</> : <><Image className="h-3 w-3 mr-1" /> Photo</>}
                    </Badge>
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
                            <AvatarFallback className="text-xs">{child.first_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {tagged.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs">+{tagged.length - 3}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{tagged.map(c => c.first_name).join(', ')}</span>
                    </div>
                  )}
                  {event && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{event.title}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">{format(new Date(moment.created_at), 'MMM d, yyyy')}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(moment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {moments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No moments found</p>
              <p className="text-muted-foreground">Upload your first classroom moment to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherLayout>
  );
}

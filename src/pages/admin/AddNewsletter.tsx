import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { FileUpload, ImageUpload, type UploadedFile, type ImageFile } from '@/components/media';
import { useCreateNewsletter } from '@/hooks/useApi';

const newsletterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  published_date: z.string().min(1, 'Published date is required'),
  file_url: z.string().min(1, 'PDF file is required'),
  thumbnail_url: z.string().optional(),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

export default function AddNewsletter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createNewsletter = useCreateNewsletter();
  const [pdfFiles, setPdfFiles] = useState<UploadedFile[]>([]);
  const [thumbnails, setThumbnails] = useState<ImageFile[]>([]);

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      title: '',
      description: '',
      published_date: new Date().toISOString().split('T')[0],
      file_url: '',
      thumbnail_url: '',
    },
  });

  const handlePdfChange = (files: UploadedFile[]) => {
    setPdfFiles(files);
    form.setValue('file_url', files[0]?.url || '');
  };

  const handleThumbnailChange = (images: ImageFile[]) => {
    setThumbnails(images);
    form.setValue('thumbnail_url', images[0]?.url || '');
  };

  const onSubmit = async (data: NewsletterFormData) => {
    try {
      await createNewsletter.mutateAsync({
        title: data.title,
        description: data.description,
        published_date: data.published_date,
        file_url: data.file_url,
        thumbnail_url: data.thumbnail_url,
      });
      toast({
        title: 'Success',
        description: 'Newsletter added successfully',
      });
      navigate('/dashboard/newsletters');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add newsletter',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add Newsletter</h1>
            <p className="text-muted-foreground">
              Upload a new newsletter for sponsors
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Spring 2024 Newsletter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of this newsletter's content..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="published_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Published Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PDF Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="file_url"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          files={pdfFiles}
                          onChange={handlePdfChange}
                          accept="application/pdf"
                          acceptLabel="PDF files only"
                          maxSize={20}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thumbnail (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="thumbnail_url"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          images={thumbnails}
                          onChange={handleThumbnailChange}
                          multiple={false}
                          maxFiles={1}
                          aspectRatio="video"
                          placeholder="Add thumbnail image"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/newsletters')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createNewsletter.isPending}>
                {createNewsletter.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Publish Newsletter'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}

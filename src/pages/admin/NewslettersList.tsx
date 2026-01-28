import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Download, Trash2, FileText, Calendar, Loader2 } from 'lucide-react';
import { useNewsletters, useDeleteNewsletter } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

export default function NewslettersList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: newslettersData, isLoading, error } = useNewsletters();
  const deleteNewsletterMutation = useDeleteNewsletter();

  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const newsletters = newslettersData?.data || [];

  const filteredNewsletters = newsletters.filter((newsletter) =>
    newsletter.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteNewsletterMutation.mutateAsync(deleteId);
        toast({
          title: 'Success',
          description: 'Newsletter deleted successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete newsletter',
          variant: 'destructive',
        });
      }
      setDeleteId(null);
    }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Error loading newsletters: {error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Newsletters</h1>
            <p className="text-muted-foreground">
              Upload and manage school newsletters
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard/newsletters/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Newsletter
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search newsletters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Newsletter Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredNewsletters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No newsletters found</p>
              <p className="text-muted-foreground">
                Upload your first newsletter to get started
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/dashboard/newsletters/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Upload Newsletter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNewsletters.map((newsletter) => (
              <Card key={newsletter.id} className="overflow-hidden">
                {newsletter.thumbnail_url && (
                  <div className="aspect-[3/2] overflow-hidden">
                    <img
                      src={newsletter.thumbnail_url}
                      alt={newsletter.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1">{newsletter.title}</h3>
                  {newsletter.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {newsletter.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(newsletter.published_date).toLocaleDateString()}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(newsletter.file_url, '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(newsletter.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              newsletter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              {deleteNewsletterMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

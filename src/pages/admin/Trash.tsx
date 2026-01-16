import { useState } from 'react';
import { format } from 'date-fns';
import { useTrash, useRestoreItem, usePermanentlyDelete } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RotateCcw, Trash2, Users, FileText, Calendar, Newspaper, Link2 } from 'lucide-react';
import { toast } from 'sonner';

const entityIcons: Record<string, any> = {
  children: Users,
  reports: FileText,
  events: Calendar,
  newsletters: Newspaper,
  sponsorships: Link2,
};

const entityLabels: Record<string, string> = {
  children: 'Children',
  reports: 'Reports',
  events: 'Events',
  newsletters: 'Newsletters',
  sponsorships: 'Sponsorships',
};

export default function Trash() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('children');
  
  const { data: trashData, isLoading, refetch } = useTrash();
  const restoreMutation = useRestoreItem();
  const deleteMutation = usePermanentlyDelete();
  
  const isSuperAdmin = user?.roles?.includes('super_admin');
  
  const handleRestore = async (entityType: string, id: string, name: string) => {
    try {
      await restoreMutation.mutateAsync({ entityType, id });
      toast.success(`${name} restored successfully`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore item');
    }
  };
  
  const handlePermanentDelete = async (entityType: string, id: string, name: string) => {
    try {
      await deleteMutation.mutateAsync({ entityType, id });
      toast.success(`${name} permanently deleted`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
    }
  };
  
  const getItemCount = (entityType: string) => {
    return trashData?.[entityType]?.length || 0;
  };
  
  const renderTable = (entityType: string) => {
    const items = trashData?.[entityType] || [];
    
    if (isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }
    
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Trash2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No deleted {entityLabels[entityType]?.toLowerCase()} found</p>
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Deleted At</TableHead>
            <TableHead>Deleted By</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item: any) => {
            const name = getItemName(entityType, item);
            
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{name}</div>
                  {entityType === 'reports' && (
                    <div className="text-xs text-muted-foreground">
                      {item.quarter} {item.year} - {item.child_name}
                    </div>
                  )}
                  {entityType === 'sponsorships' && (
                    <div className="text-xs text-muted-foreground">
                      {item.sponsor_name} → {item.child_name}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(item.deleted_at), 'MMM d, yyyy HH:mm')}
                </TableCell>
                <TableCell>{item.deleted_by_name || 'Unknown'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(entityType, item.id, name)}
                      disabled={restoreMutation.isPending}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                    
                    {isSuperAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deleteMutation.isPending}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Forever
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. "{name}" will be permanently removed from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handlePermanentDelete(entityType, item.id, name)}
                            >
                              Delete Forever
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };
  
  const getItemName = (entityType: string, item: any): string => {
    switch (entityType) {
      case 'children':
        return `${item.first_name} ${item.last_name}`;
      case 'reports':
        return `${item.quarter} ${item.year} Report`;
      case 'events':
        return item.title;
      case 'newsletters':
        return item.title;
      case 'sponsorships':
        return `Sponsorship #${item.id.slice(0, 8)}`;
      default:
        return item.id;
    }
  };
  
  const totalItems = Object.keys(entityLabels).reduce((sum, key) => sum + getItemCount(key), 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trash</h1>
          <p className="text-muted-foreground">
            Restore or permanently delete items • {totalItems} items in trash
          </p>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              {Object.entries(entityLabels).map(([key, label]) => {
                const Icon = entityIcons[key];
                const count = getItemCount(key);
                
                return (
                  <TabsTrigger key={key} value={key} className="relative">
                    <Icon className="mr-2 h-4 w-4" />
                    {label}
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {Object.keys(entityLabels).map((key) => (
              <TabsContent key={key} value={key} className="mt-6">
                {renderTable(key)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      {isSuperAdmin && totalItems > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete all items in trash. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Empty Trash ({totalItems} items)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Empty Entire Trash?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {totalItems} items in the trash. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Empty Trash
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

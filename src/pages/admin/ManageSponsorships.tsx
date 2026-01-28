import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, Save, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSponsor, useChildren, useSponsorships, useAssignSponsorship, useRemoveSponsorship } from '@/hooks/useApi';

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function ManageSponsorships() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: sponsor, isLoading: isLoadingSponsor } = useSponsor(id || '');
  const { data: childrenData, isLoading: isLoadingChildren } = useChildren({ status: 'active' });
  const { data: sponsorshipsData } = useSponsorships({ sponsor_id: id });
  const assignSponsorship = useAssignSponsorship();
  const removeSponsorship = useRemoveSponsorship();

  const children = childrenData?.data || [];
  const sponsorships = sponsorshipsData?.data || [];
  
  const [search, setSearch] = useState('');
  const [selectedChildren, setSelectedChildren] = useState<Set<string>>(() => {
    return new Set();
  });

  // Initialize selection from sponsorships
  const initialSelection = useMemo(() => {
    const activeSponsored = sponsorships
      .filter((s) => s.status === 'active')
      .map((s) => s.child_id);
    return new Set(activeSponsored);
  }, [sponsorships]);

  // Update selected when sponsorships load
  useMemo(() => {
    if (sponsorships.length > 0 && selectedChildren.size === 0) {
      const activeSponsored = sponsorships
        .filter((s) => s.status === 'active')
        .map((s) => s.child_id);
      setSelectedChildren(new Set(activeSponsored));
    }
  }, [sponsorships]);

  const filteredChildren = children.filter(
    (child) =>
      `${child.first_name} ${child.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      child.grade.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = isLoadingSponsor || isLoadingChildren;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!sponsor) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Sponsor not found</p>
          <Button onClick={() => navigate('/dashboard/sponsors')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sponsors
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const toggleChild = (childId: string) => {
    setSelectedChildren((prev) => {
      const next = new Set(prev);
      if (next.has(childId)) {
        next.delete(childId);
      } else {
        next.add(childId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    let added = 0;
    let removed = 0;

    try {
      // Find children to add
      for (const childId of selectedChildren) {
        if (!initialSelection.has(childId)) {
          await assignSponsorship.mutateAsync({
            sponsor_id: id!,
            child_id: childId,
          });
          added++;
        }
      }

      // Find children to remove
      for (const childId of initialSelection) {
        if (!selectedChildren.has(childId)) {
          const sponsorship = sponsorships.find((s) => s.child_id === childId && s.status === 'active');
          if (sponsorship) {
            await removeSponsorship.mutateAsync({ id: sponsorship.id });
            removed++;
          }
        }
      }

      toast({
        title: 'Sponsorships updated',
        description: `Added ${added}, removed ${removed} sponsorship${added + removed !== 1 ? 's' : ''}.`,
      });

      navigate(`/dashboard/sponsors/${id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update sponsorships',
        variant: 'destructive',
      });
    }
  };

  const hasChanges =
    selectedChildren.size !== initialSelection.size ||
    [...selectedChildren].some((id) => !initialSelection.has(id));

  const isPending = assignSponsorship.isPending || removeSponsorship.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/sponsors/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Manage Sponsorships</h1>
            <p className="text-muted-foreground">
              Assign or remove children for {sponsor.full_name}
            </p>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges || isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Sponsor Info */}
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={sponsor.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {sponsor.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{sponsor.full_name}</p>
              <p className="text-sm text-muted-foreground">{sponsor.email}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{selectedChildren.size} selected</span>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search children by name or grade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Children List */}
        <Card>
          <CardHeader>
            <CardTitle>Select Children to Sponsor</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredChildren.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No children found.</p>
            ) : (
              <div className="space-y-2">
                {filteredChildren.map((child) => {
                  const isSelected = selectedChildren.has(child.id);
                  const wasInitiallySelected = initialSelection.has(child.id);

                  return (
                    <div
                      key={child.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleChild(child.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleChild(child.id)}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={child.photo_url} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {child.first_name[0]}
                          {child.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {child.first_name} {child.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {calculateAge(child.date_of_birth)} years old • {child.grade}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {wasInitiallySelected && !isSelected && (
                          <Badge variant="destructive">Will be removed</Badge>
                        )}
                        {!wasInitiallySelected && isSelected && (
                          <Badge variant="default">New</Badge>
                        )}
                        {wasInitiallySelected && isSelected && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

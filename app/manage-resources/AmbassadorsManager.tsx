'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { LoaderCircle, Plus, Search, Trash2 } from 'lucide-react';
import {
  getMyAmbassadors,
  searchAmbassadorCandidates,
  grantAmbassadorAccess,
  revokeAmbassadorAccess,
} from '@/lib/actions';
import { AmbassadorStudent } from '@/lib/types';

export function AmbassadorsManager() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [ambassadors, setAmbassadors] = useState<AmbassadorStudent[]>([]);
  const [candidates, setCandidates] = useState<AmbassadorStudent[]>([]);
  const [query, setQuery] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAmbassadors = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await getMyAmbassadors();
      setAmbassadors(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to load subject ambassadors.',
        variant: 'destructive',
      });
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    loadAmbassadors();
    setQuery('');
    setCandidates([]);
  }, [open, loadAmbassadors]);

  useEffect(() => {
    if (!open) return;

    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchAmbassadorCandidates(query);
        setCandidates(data);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to search students.',
          variant: 'destructive',
        });
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query, open, toast]);

  const handleGrant = async (student: AmbassadorStudent) => {
    setBusyId(student.id);
    const { error } = await grantAmbassadorAccess(student.id);
    setBusyId(null);
    if (error) {
      toast({ title: 'Could not grant access', description: error, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Ambassador added',
      description: `${student.first_name} ${student.last_name} can now submit resources.`,
    });
    await loadAmbassadors();
    setCandidates((prev) => prev.filter((s) => s.id !== student.id));
  };

  const handleRevoke = async (student: AmbassadorStudent) => {
    setBusyId(student.id);
    const { error } = await revokeAmbassadorAccess(student.id);
    setBusyId(null);
    if (error) {
      toast({ title: 'Could not revoke access', description: error, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Access revoked',
      description: `${student.first_name} ${student.last_name} can no longer submit resources.`,
    });
    await loadAmbassadors();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Subject Ambassadors</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Subject Ambassadors</DialogTitle>
          <DialogDescription>
            Grant Year 12–13 students permission to submit resources. They appear as Contributors
            and can use Manage Resources. You can only revoke students you approved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden flex flex-col min-h-0">
          <section className="space-y-2 shrink-0">
            <h4 className="text-sm font-semibold">Your ambassadors</h4>
            {loadingList ? (
              <div className="flex justify-center py-6">
                <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : ambassadors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No ambassadors yet. Search below to add one.
              </p>
            ) : (
              <ScrollArea className="max-h-40 rounded-md border">
                <ul className="divide-y">
                  {ambassadors.map((student) => (
                    <li
                      key={student.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {student.email}
                          {student.current_year != null ? ` · Year ${student.current_year}` : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive"
                        disabled={busyId === student.id}
                        onClick={() => handleRevoke(student)}
                        aria-label={`Revoke ${student.first_name}`}
                      >
                        {busyId === student.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </section>

          <section className="space-y-2 flex-1 min-h-0 flex flex-col">
            <h4 className="text-sm font-semibold">Add ambassador</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="pl-9"
              />
            </div>
            <ScrollArea className="flex-1 min-h-[8rem] max-h-48 rounded-md border">
              {searching ? (
                <div className="flex justify-center py-6">
                  <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : candidates.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">
                  {query.trim()
                    ? 'No matching students without contributor access.'
                    : 'Type to search Year 12–13 students, or leave blank to browse.'}
                </p>
              ) : (
                <ul className="divide-y">
                  {candidates.map((student) => (
                    <li
                      key={student.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {student.first_name} {student.last_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">
                            {student.email}
                          </span>
                          {student.current_year != null && (
                            <Badge variant="outline" className="text-[10px] h-5">
                              Y{student.current_year}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="shrink-0"
                        disabled={busyId === student.id}
                        onClick={() => handleGrant(student)}
                      >
                        {busyId === student.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

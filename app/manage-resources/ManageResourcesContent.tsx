'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Opportunity, ProfileData } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { ActivityForm } from '@/components/AddActivityForm'
import { DataTable } from './data_table'
import { columns } from './columns'
import { ManageResourcesSkeleton } from './skeleton'
import { useManageResourcesData } from './useManageResourcesData'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AmbassadorsManager } from './AmbassadorsManager'

interface ManageResourcesContentProps {
  profile: ProfileData
}

export function ManageResourcesContent({ profile }: ManageResourcesContentProps) {
  const router = useRouter()
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showReturnAlert, setShowReturnAlert] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const isTeacher = profile.role === 'teacher'
  const { opportunities, isLoading, error, deleteResource, updateResource, updateStatus } =
    useManageResourcesData(isTeacher)
  const [newStatus, setNewStatus] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (selectedOpportunity) {
      setNewStatus(selectedOpportunity.status)
      setReviewText(selectedOpportunity.review_text || '')
    } else {
      setNewStatus('')
      setReviewText('')
    }
  }, [selectedOpportunity])

  const handleStatusUpdate = async () => {
    try {
      setIsSaving(true)
      await updateStatus(
        {
          status: newStatus,
          review_text: newStatus === 'returned' ? reviewText : null,
          last_updated: new Date().toISOString(),
        },
        selectedOpportunity?.opportunity_id
      )

      toast({
        title: 'Success',
        description: 'Activity status updated successfully',
      })
      setShowStatusDialog(false)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update activity status',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteOpportunity = async (opportunity: Opportunity) => {
    try {
      setIsDeleting(true)
      await deleteResource(opportunity.opportunity_id)
      toast({
        title: 'Success',
        description: 'Activity deleted successfully',
      })
      setShowDeleteDialog(false)
      setSelectedOpportunity(null)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete activity',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditDialogClose = () => {
    setShowEditDialog(false)
    setSelectedOpportunity(null)
  }

  const handleEditSubmit = async (initialData: any) => {
    const result = await updateResource(
      initialData,
      selectedOpportunity?.opportunity_id,
      isTeacher
    )
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Activity updated successfully',
      })
      setShowEditDialog(false)
      setSelectedOpportunity(null)
      return true
    }

    toast({
      title: 'Error',
      description: 'Failed to update activity',
      variant: 'destructive',
    })
    return false
  }

  if (!profile.can_add) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 p-8 text-center">
        <h2 className="text-2xl font-semibold">Access Restricted</h2>
        <p className="text-gray-600 max-w-md">
          You do not have permission to add activities. If you think this is an error, please speak
          to your teacher or{' '}
          <a
            href="mailto:supercurricularadmin@britishschool.sch.ae"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            contact support
          </a>
          .
        </p>
      </div>
    )
  }

  if (isLoading) return <ManageResourcesSkeleton />

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 p-8 text-center">
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md">
          {error.message}. Please try signing in again.
        </p>
        <Button onClick={() => router.push('/login')} variant="default">
          Sign In Again
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white w-full">
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Manage Resources</h1>
          <div className="flex gap-2">
            {isTeacher && <AmbassadorsManager />}
            <Button onClick={() => router.push('/manage-resources/add-activity')}>
              Create Activity
            </Button>
          </div>
        </div>

        <div className="flex max-w-full">
          <DataTable
            columns={columns({
              setShowStatusDialog,
              setSelectedOpportunity,
              setShowDeleteDialog,
              showEditDialog,
              setShowEditDialog,
              showReturnAlert,
              setShowReturnAlert,
              selectedOpportunity,
              isTeacher,
            })}
            data={opportunities}
          />
        </div>

        <Dialog open={showReturnAlert} onOpenChange={setShowReturnAlert}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return Activity?</DialogTitle>
              <DialogDescription>
                This activity will be marked as returned before editing. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturnAlert(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowReturnAlert(false)
                  setShowEditDialog(true)
                }}
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showEditDialog}
          onOpenChange={(open) => {
            if (!open) handleEditDialogClose()
          }}
        >
          <DialogContent className="max-w-3xl" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Edit Activity</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[80vh]">
              {selectedOpportunity && (
                <ActivityForm
                  key={selectedOpportunity.opportunity_id}
                  initialData={selectedOpportunity}
                  onSubmit={handleEditSubmit}
                  submitLabel="Save Changes"
                  isEditing={true}
                />
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
              <AlertDialogDescription>
                This activity will be deleted and removed from the school database. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteDialog(false)
                  handleDeleteOpportunity(selectedOpportunity as Opportunity)
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={showStatusDialog}
          onOpenChange={(open) => {
            if (!open) {
              setNewStatus('')
              setReviewText('')
              setSelectedOpportunity(null)
            }
            setShowStatusDialog(open)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activity Status</DialogTitle>
            </DialogHeader>
            {selectedOpportunity && (
              <div className="space-y-4">
                {isTeacher ? (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Update Status</h4>
                      <Select
                        defaultValue={selectedOpportunity.status}
                        value={newStatus || selectedOpportunity.status}
                        onValueChange={(value) => setNewStatus(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(newStatus === 'returned' || selectedOpportunity.status === 'returned') && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Review Comments</h4>
                        <Textarea
                          value={reviewText || selectedOpportunity.review_text || ''}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Add review comments..."
                          rows={3}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <h4 className="font-semibold">Current Status</h4>
                      <Badge
                        variant={
                          selectedOpportunity.status === 'active'
                            ? 'default'
                            : selectedOpportunity.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {selectedOpportunity.status || 'pending'}
                      </Badge>
                    </div>
                    {selectedOpportunity.status === 'returned' &&
                      selectedOpportunity.review_text && (
                        <div>
                          <h4 className="font-semibold">Review Comments</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedOpportunity.review_text}
                          </p>
                        </div>
                      )}
                  </>
                )}
                <div>
                  <h4 className="font-semibold">Last Updated</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedOpportunity.last_updated
                      ? new Date(selectedOpportunity.last_updated).toLocaleDateString('en-GB')
                      : 'No date set'}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              {isTeacher ? (
                <>
                  <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={
                      newStatus === selectedOpportunity?.status ||
                      (newStatus === 'returned' && !reviewText) ||
                      isSaving
                    }
                  >
                    {isSaving ? 'Saving...' : 'Confirm Changes'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowStatusDialog(false)}>Close</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

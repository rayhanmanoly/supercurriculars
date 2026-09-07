"use client"

import { useState } from 'react'
import { Opportunity } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { ActivityForm } from '@/components/AddActivityForm'
import { updateOpportunity, getSubmittedOpportunities } from '@/lib/actions'

interface EditOpportunityDialogProps {
  opportunity: Opportunity | null
  showEditDialog: boolean
  setShowEditDialog: (show: boolean) => void
  setOpportunities?: (opportunities: Opportunity[]) => void
  showReturnAlert: boolean
  setShowReturnAlert: (show: boolean) => void
}

export function EditOpportunityDialog({ 
  opportunity, 
  showEditDialog, 
  setShowEditDialog,
  showReturnAlert,
  setShowReturnAlert,
  setOpportunities 
}: EditOpportunityDialogProps) {

  return (
    <>
      <AlertDialog open={showReturnAlert} onOpenChange={setShowReturnAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This activity will be marked as returned before editing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowReturnAlert(false)
              setShowEditDialog(true)
            }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      
    </>
  )
}
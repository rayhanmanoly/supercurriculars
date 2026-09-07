"use client"

import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"

import { Edit, MoreHorizontal } from "lucide-react"
 
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Opportunity } from "@/lib/types"
import { OpportunityCard } from "@/components/OpportunityCard"
import { EditOpportunityDialog } from "./add-activity/EditActivity"
import { useState } from "react"
import { DataTableColumnHeader } from "./data-table-column-header"

interface ColumnActionsProps {
    setShowStatusDialog: (show: boolean) => void;
    setSelectedOpportunity: (opportunity: Opportunity) => void;
    setShowDeleteDialog: (show: boolean) => void;
    showEditDialog: boolean;
    setShowEditDialog: (show: boolean) => void;
    showReturnAlert: boolean;
    setShowReturnAlert: (show: boolean) => void;
    selectedOpportunity: Opportunity | null;
    isTeacher: boolean;
  }

  export const columns = ({ setShowStatusDialog, setSelectedOpportunity, setShowDeleteDialog, showEditDialog, setShowEditDialog, showReturnAlert, setShowReturnAlert, selectedOpportunity, isTeacher}: ColumnActionsProps): ColumnDef<Opportunity>[] => {


    const handleEditClick = (opportunity: Opportunity) => {
    if (opportunity.status !== 'returned' && !isTeacher) {
      setSelectedOpportunity(opportunity)
      setShowReturnAlert(true)
    } else {
      setSelectedOpportunity(opportunity)
      setShowEditDialog(true)
    }
  }
    
    return [
    {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Title" />
          ),
        accessorKey: "title",
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.title}</div>
        },
    },
    {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Type" />
          ),
        accessorKey: "opportunity_type",
        cell: ({ row }) => {
            return <Badge variant="outline">{row.original.opportunity_type}</Badge>
        },
    },
    {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Subjects" />
          ),
        accessorKey: "subjects",
        cell: ({ row }) => {
            return <div className="flex flex-wrap gap-1">
                {row.original.subjects.map((subject, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{subject}</Badge>
                ))}
            </div>
        },
    },
    {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={isTeacher ? "Submitted By" : "Review Teacher"} />
          ), 
        accessorKey: isTeacher ? "profiles" : "review_teacher",
        cell: ({ row }) => {
          if (isTeacher && row.original.profiles) {
            return `${row.original.profiles.first_name} ${row.original.profiles.last_name}`;
          } else if (!isTeacher && row.original.review_teacher) {
            return row.original.review_teacher;
          } else if (isTeacher) {
            return "You";
          }
          return "N/A";
        },
    },
    {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
          ), 
        accessorKey: "status",
        cell: ({ row }) => {
            return <Badge variant={row.original.status === 'active' ? 'default' : row.original.status === 'pending' ? 'secondary' : 'destructive' }>{row.original.status}</Badge>
        },
    },
    {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Last Updated" />
          ), 
        accessorKey: "last_updated",
        cell: ({ row }) => {
            return <div className="text-sm text-gray-500">{row.original.last_updated ? new Date(row.original.last_updated).toLocaleDateString("en-gb") : 'No date set'}</div>
        },
    },

    {
        header: "Actions",
        id: "actions",
        cell: ({ row }) => {
          const opportunity = row.original
     
          return (
            <div className="flex justify-end">
                <OpportunityCard
              type="table"
              opportunity={opportunity}
              showEditButton={false}
              onEditClick={handleEditClick}
            />
            
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild className="p-2">
                <Button variant="ghost" className="pr-2" size={'icon'}>
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem className={!isTeacher && opportunity.status === 'returned' ? 'bg-red-100 text-red-900 font-medium': isTeacher && opportunity.status === 'pending' ? 'bg-green-100 font-medium': ''}
                       onSelect={(event) => {
                    event.preventDefault();
                    setSelectedOpportunity(opportunity);
                    setShowStatusDialog(true);
                  }}
                >
                  {isTeacher ? "Modify Status" : "View Status Details"}
                </DropdownMenuItem>
                  <EditOpportunityDialog
              opportunity={selectedOpportunity}
              showEditDialog={showEditDialog}
              setShowEditDialog={setShowEditDialog}
              showReturnAlert={showReturnAlert}
              setShowReturnAlert={setShowReturnAlert}
            />  
                <DropdownMenuItem
                   onSelect={
                    
                    (event) => { event.preventDefault(); handleEditClick(opportunity)}
                  }
                >
                  Edit Opportunity
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                onSelect={(event) => {
                    event.preventDefault();
                    setSelectedOpportunity(opportunity);
                    setShowDeleteDialog(true);
                  }}
                >Delete Opportunity</DropdownMenuItem>
                
              </DropdownMenuContent>
            </DropdownMenu> 
            </div>
          )
        },
      },
    ]
}

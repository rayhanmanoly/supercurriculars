import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export function ManageResourcesSkeleton() {
  return (
    <div className="h-screen bg-white w-full">
      <div className="flex-1 p-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
        </div>

        {/* Table Section */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                </TableHead>
                <TableHead className="text-right">
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded ml-auto" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex flex-col space-y-2">
                      <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
                      <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-20 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
                      <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
                      <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
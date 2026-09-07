'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useSettingsData } from './useSettingsData'
import { updateProfile } from '@/lib/actions'
import { useToast } from '@/components/ui/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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
import MultiSelectWithReactSelect from '@/components/MultiSelectWithReact'
import { allSubjects, filteredSubjectsForOnboarding, removedForGCSE } from '@/lib/globals'
import { LoaderCircleIcon, X } from 'lucide-react'

// ─── Schemas ───────────────────────────────────────────────────────────────────

const personalSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
})
type PersonalFormData = z.infer<typeof personalSchema>

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getRoleLabel(role?: string) {
  if (role === 'teacher') return 'Teacher'
  if (role === 'admin') return 'Administrator'
  return 'Student'
}

// ─── PersonalDetailsCard ───────────────────────────────────────────────────────

function PersonalDetailsCard({ firstName, lastName }: { firstName: string; lastName: string }) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: { first_name: firstName, last_name: lastName },
  })

  const onSubmit = async (data: PersonalFormData) => {
    const { error } = await updateProfile(data)
    if (error) {
      toast({ title: 'Error saving name', description: error, variant: 'destructive' })
    } else {
      reset(data)
      toast({ title: 'Name updated', description: 'Your changes have been saved.' })
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Personal Details</CardTitle>
        <CardDescription>Update your display name across the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" {...register('first_name')} />
              {errors.first_name && (
                <p className="text-sm text-red-500">{errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" {...register('last_name')} />
              {errors.last_name && (
                <p className="text-sm text-red-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? (
              <><LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── StudentAcademicCard ───────────────────────────────────────────────────────

function StudentAcademicCard({
  initialYear,
  initialSubjects,
}: {
  initialYear?: number
  initialSubjects?: string[]
}) {
  const { toast } = useToast()
  const [currentYear, setCurrentYear] = useState<string>(initialYear?.toString() ?? '')
  const [scienceOption, setScienceOption] = useState<string>('')
  const [subjects, setSubjects] = useState<{ subject: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingYear, setPendingYear] = useState<string | null>(null)
  const [showYearDialog, setShowYearDialog] = useState(false)

  useEffect(() => {
    if (initialSubjects && initialSubjects.length > 0) {
      setSubjects(initialSubjects.map(s => ({ subject: s })))
    }
  }, [])

  const applyYearChange = useCallback((year: string) => {
    setCurrentYear(year)
    setScienceOption('')
    if (year === '12' || year === '13') {
      setSubjects([{ subject: '' }, { subject: '' }])
    } else {
      setSubjects([])
    }
  }, [])

  const handleYearChange = (year: string) => {
    const hasSubjects = subjects.some(s => s.subject)
    if (hasSubjects && year !== currentYear) {
      setPendingYear(year)
      setShowYearDialog(true)
    } else {
      applyYearChange(year)
    }
  }

  const handleScienceOption = (option: string) => {
    setScienceOption(option)
    if (option === 'combined') {
      setSubjects([{ subject: '' }, { subject: '' }, { subject: '' }, { subject: '' }])
    } else if (option === 'separate') {
      setSubjects([{ subject: '' }, { subject: '' }, { subject: '' }])
    }
  }

  const getAvailableSubjects = (index: number, isGCSE: boolean) => {
    const selected = subjects.map(s => s.subject).filter((_, i) => i !== index)
    const base = filteredSubjectsForOnboarding as { value: string; label: string; url: string }[]
    if (isGCSE) return base.filter(s => !selected.includes(s.value) && !removedForGCSE.includes(s.value))
    return base.filter(s => !selected.includes(s.value))
  }

  const updateSubject = (index: number, value: string) => {
    setSubjects(prev => {
      const updated = [...prev]
      updated[index] = { subject: value }
      return updated
    })
  }

  const isGCSE = currentYear === '10' || currentYear === '11'
  const isALevel = currentYear === '12' || currentYear === '13'
  const showSubjects = currentYear !== '' && (isGCSE ? scienceOption !== '' || subjects.some(s => s.subject) : true)

  const handleSave = async () => {
    if (!currentYear) {
      toast({ title: 'Select a year group first', variant: 'destructive' })
      return
    }
    const yearNum = parseInt(currentYear)
    const filled = subjects.filter(s => s.subject)
    if (yearNum >= 10 && filled.length === 0) {
      toast({ title: 'Add at least one subject', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    const { error } = await updateProfile({
      current_year: yearNum,
      subjects: filled.map(s => s.subject),
    })
    setIsSubmitting(false)
    if (error) {
      toast({ title: 'Error saving academic details', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Academic details updated' })
    }
  }

  return (
    <>
      <AlertDialog open={showYearDialog} onOpenChange={setShowYearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change year group?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing your year group will clear your current subject selections. You'll need to re-select them before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingYear(null)}>Keep Current Year</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                applyYearChange(pendingYear!)
                setPendingYear(null)
              }}
            >
              Change Year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Academic Details</CardTitle>
          <CardDescription>Update your year group and subject choices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Year Group</Label>
            <Select value={currentYear} onValueChange={handleYearChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {[7, 8, 9, 10, 11, 12, 13].map(y => (
                  <SelectItem key={y} value={y.toString()}>
                    Year {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isGCSE && (
            <div className="space-y-2">
              <Label>Science Option</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['combined', 'separate'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleScienceOption(opt)}
                    className={`flex items-center gap-2.5 rounded-md border p-3 text-sm transition-colors hover:bg-gray-50 cursor-pointer text-left ${
                      scienceOption === opt ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                        scienceOption === opt ? 'border-primary bg-primary' : 'border-gray-300'
                      }`}
                    />
                    {opt === 'combined' ? 'Combined Science' : 'Separate Science'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSubjects && subjects.map((s, index) => (
            <div key={index} className="space-y-1.5">
              <Label>Subject {index + 1}</Label>
              <div className="flex items-center gap-2">
                <Select value={s.subject} onValueChange={val => updateSubject(index, val)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSubjects(index, isGCSE).map((subj: any) => (
                      <SelectItem key={subj.value} value={subj.value}>
                        {subj.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isALevel && index >= 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSubjects(prev => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {isALevel && subjects.length < 4 && currentYear && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setSubjects(prev => [...prev, { subject: '' }])}
            >
              Add Another Subject
            </Button>
          )}

          <Separator />

          <Button onClick={handleSave} disabled={isSubmitting || !currentYear}>
            {isSubmitting ? (
              <><LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

// ─── TeacherSubjectsCard ───────────────────────────────────────────────────────

function TeacherSubjectsCard({ initialSubjects }: { initialSubjects?: string[] }) {
  const { toast } = useToast()
  const [subjects, setSubjects] = useState<{ value: string; label: string; url: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (initialSubjects && initialSubjects.length > 0) {
      const opts = (allSubjects as { value: string; label: string; url: string }[]).filter(s =>
        initialSubjects.includes(s.value)
      )
      setSubjects(opts)
    }
  }, [])

  const handleChange = (values: any) => {
    setSubjects(values)
    setIsDirty(true)
  }

  const handleSave = async () => {
    if (subjects.length === 0) {
      toast({ title: 'Add at least one subject', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    const { error } = await updateProfile({ subjects: subjects.map(s => s.value) })
    setIsSubmitting(false)
    if (error) {
      toast({ title: 'Error saving subjects', description: error, variant: 'destructive' })
    } else {
      setIsDirty(false)
      toast({ title: 'Subjects updated' })
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Subjects You Teach</CardTitle>
        <CardDescription>Select all subjects you currently teach at the school.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <MultiSelectWithReactSelect
          options={allSubjects}
          value={subjects}
          onChange={handleChange}
        />
        <Button onClick={handleSave} disabled={isSubmitting || !isDirty}>
          {isSubmitting ? (
            <><LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />Saving...</>
          ) : (
            'Save Changes'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── SettingsContent ───────────────────────────────────────────────────────────

export default function SettingsContent() {
  const profile = useSettingsData()

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoaderCircleIcon className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    )
  }

  const isStudent = !profile.role || profile.role === 'student'
  const isTeacher = profile.role === 'teacher'
  const isAdmin = profile.role === 'admin'

  return (
    <div className="h-screen overflow-auto bg-white">
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Profile Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account information.</p>

        {/* Identity overview — read-only */}
        <Card className="mb-6">
          <CardContent className="flex items-center gap-5 p-6">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={profile.profile_url} alt={profile.first_name} />
              <AvatarFallback className="text-lg font-medium">
                {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">
                {profile.first_name} {profile.last_name}
              </p>
              {profile.email && (
                <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{getRoleLabel(profile.role)}</Badge>
                {isStudent && profile.can_add && (
                  <Badge variant="secondary">Contributor</Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground shrink-0 self-start">
              Avatar syncs from Google
            </p>
          </CardContent>
        </Card>

        <PersonalDetailsCard firstName={profile.first_name} lastName={profile.last_name} />

        {isStudent && (
          <StudentAcademicCard
            initialYear={profile.current_year}
            initialSubjects={profile.subjects}
          />
        )}

        {isTeacher && (
          <TeacherSubjectsCard initialSubjects={profile.subjects} />
        )}

        {isAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Administrator Access</CardTitle>
              <CardDescription>
                Your account has administrator privileges. Contact your system administrator to modify role settings.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}

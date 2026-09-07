'use client'

import { Card } from '@/components/ui/card'
import { ChevronRight, GraduationCap, Search } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useContext, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { filteredSubjects } from '@/lib/globals'
import { ProfileContext } from '@/app/client-layout'


function reorderSubjects(allSubjects: any[], userSubjects: string[] = [], yearGroup: number = 7) {
    const userSubjectsSet = new Set(userSubjects)
    const userSubjectObjects: any[] = []
    const otherSubjects: any[] = []

    allSubjects.forEach(subject => {
        if (userSubjectsSet.has(subject.value)) {
            userSubjectObjects.push(subject)
        } else {
            otherSubjects.push(subject)
        }
    })
    const uni = { value: 'University', label: 'University', url: 'university' }
    if (yearGroup > 10) {
        userSubjectObjects.unshift(uni)
    }
    return [...userSubjectObjects, ...otherSubjects]
}

const Mentoring: React.FC = () => {
    const profileData = useContext(ProfileContext)
    const router = useRouter()

    const [searchTerm, setSearchTerm] = useState('');

    const sortedSubjects = useMemo(
        () => reorderSubjects(filteredSubjects, profileData?.subjects, profileData?.current_year),
        [profileData]
    )

    const visibleSubjects = useMemo(
        () => searchTerm.trim()
            ? sortedSubjects.filter(s => s.label.toLowerCase().includes(searchTerm.toLowerCase()))
            : sortedSubjects,
        [sortedSubjects, searchTerm]
    )

    if (!profileData) return null;

    const renderCard = (subject: any) => (
        <Card
            key={subject.value}
            className="flex flex-row items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => router.push(`mentoring/${subject.url}`)}
        >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100">
                {subject.value === 'University' ? (
                    <GraduationCap className="w-6 h-6 text-indigo-500" />
                ) : (
                    <Image
                        src={`/img/${subject.value}.png`}
                        alt={subject.label}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-cover rounded-lg"
                    />
                )}
            </div>
            <span className="flex-grow font-medium text-sm">{subject.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </Card>
    );

    const renderSubjectCards = () => (
        <div>
            <h1 className="text-xl font-semibold mb-4">Explore By Subject</h1>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>
            {visibleSubjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {visibleSubjects.map(renderCard)}
                </div>
            ) : (
                <p className="text-sm text-gray-400 mt-6">No subjects match "{searchTerm}".</p>
            )}
        </div>
    );

      return (
        <div className="h-screen bg-white w-full p-8">
          <h1 className="text-2xl font-semibold mb-6">Mentoring</h1>
          {renderSubjectCards()}
        </div>
      );
    }

export default Mentoring
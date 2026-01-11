"use client"

import React from 'react'
import { ExperiencesGrid } from '@/components/Experiences/ExperiencesGrid'

export const ExperienceOurHall = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <ExperiencesGrid 
        showTitle={true}
        title="Experience our hall"
        columns={3}
        showFullDescription={false}
      />
    </div>
  )
}

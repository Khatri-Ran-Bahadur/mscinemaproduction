"use client"

import React from 'react'
import { ExperiencesGrid } from '@/components/Experiences/ExperiencesGrid'

export const ExperienceOurHall = () => {
  const [experiences, setExperiences] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const response = await fetch('/api/admin/experiences');
        const data = await response.json();
        if (data.success) {
          setExperiences(data.experiences);
        }
      } catch (error) {
        console.error('Failed to fetch experiences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, []);

  if (loading) {
    return null; // Or a skeleton loader
  }

  // If no dynamic data, fall back to what? 
  // Maybe we shouldn't show anything if empty? 
  // Or maybe we should keep the static data as default/initial state in ExperiencesGrid if no prop passed?
  // But the goal is to be dynamic. 
  // Let's pass the data.

  if (experiences.length === 0) return null;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <ExperiencesGrid 
        showTitle={true}
        title="Experience our hall"
        columns={3}
        showFullDescription={false}
        experiences={experiences}
      />
    </div>
  )
}

/**
 * Utility functions for hall naming and display
 */

export const formatHallName = (hallName) => {
  if (!hallName) return '';
  
  const upperHall = String(hallName).toUpperCase();
  
  // Rule for Hall 1
  if (upperHall.includes('HALL - 1') || upperHall === '1' || upperHall === 'HALL 1' || upperHall === 'HALL-1') {
    return 'Hall - 1 (Dolby Atmos)';
  }
  
  // Rule for Hall 6
  if (upperHall.includes('HALL - 6') || upperHall === '6' || upperHall === 'HALL 6' || upperHall === 'HALL-6') {
    return 'Hall-6 (Kids and Family)';
  }
  
  return hallName;
};

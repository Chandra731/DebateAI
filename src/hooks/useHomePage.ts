import { useQuery } from 'react-query';
import { DatabaseService } from '../services/database';

export const useFeatures = () => {
  return useQuery('features', DatabaseService.getFeatures);
};

export const useTestimonials = () => {
  return useQuery('testimonials', DatabaseService.getTestimonials);
};

export const useStatistics = () => {
  return useQuery('statistics', DatabaseService.getStatistics);
};
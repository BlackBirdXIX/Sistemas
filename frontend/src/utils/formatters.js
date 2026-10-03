import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDateMX = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch (e) {
    return dateString;
  }
};

export const formatDateTimeMX = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es }) + ' hrs';
  } catch (e) {
    return dateString;
  }
};

export const formatTimeMX = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'HH:mm', { locale: es }) + ' hrs';
  } catch (e) {
    return dateString;
  }
};

export const calculateAge = (birthDateString) => {
  if (!birthDateString) return '-';
  try {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (e) {
    return '-';
  }
};

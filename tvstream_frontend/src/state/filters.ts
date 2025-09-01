import { useState } from 'react';

export const useFilters = () => {
  const [language, setLanguage] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');

  return {
    language,
    category,
    setLanguage,
    setCategory
  };
};

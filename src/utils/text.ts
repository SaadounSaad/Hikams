export const isArabic = (text: string): boolean => {
  // Amélioration de la détection du texte arabe pour inclure plus de caractères
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
};

export const getTextDirection = (text: string): 'rtl' | 'ltr' => {
  return isArabic(text) ? 'rtl' : 'ltr';
};

export const getTextAlignment = (text: string): string => {
  return isArabic(text) ? 'text-right' : 'text-left';
};
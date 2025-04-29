export interface Quote {
  id: string;
  text: string;
  category: string;
  source?: string;
  isFavorite: boolean;
  createdAt: string;
  scheduledDate?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  isDefault?: boolean;
}

export interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
}
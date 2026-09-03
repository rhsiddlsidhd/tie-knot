export interface Promotion {
  id: string;
  label: string;
  title: string;
  description: string;
  badge?: string;
  image: string;
  cta: {
    label: string;
    href: string;
  };
  isActive: boolean;
}

export interface BanquetPreviewMeal {
  id: string;
  name: string;
  description: string | null;
  available: boolean;
  accommodationNote?: string;
}

// The board confirmed the entree names. Preparation details and descriptions
// remain a production-launch blocker until finalized with the caterer.
export const banquetPreviewMeals: readonly BanquetPreviewMeal[] = [
  {
    id: 'chicken',
    name: 'Chicken',
    description: null,
    available: true,
    accommodationNote: 'Preparation and sides remain pending final board and caterer approval.',
  },
  {
    id: 'steak',
    name: 'Steak',
    description: null,
    available: true,
    accommodationNote: 'Preparation and sides remain pending final board and caterer approval.',
  },
];

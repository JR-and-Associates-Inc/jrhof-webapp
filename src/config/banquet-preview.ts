export interface BanquetPreviewMeal {
  id: string;
  name: string;
  description: string | null;
  available: boolean;
  accommodationNote?: string;
}

// Test-only interface fixtures. These are intentionally not real menu items,
// and their missing descriptions are a production-launch blocker.
export const banquetPreviewMeals: readonly BanquetPreviewMeal[] = [
  {
    id: 'preview-option-a',
    name: 'Preview option A',
    description: null,
    available: true,
    accommodationNote: 'Test-only placeholder; the board has not approved meal details.',
  },
  {
    id: 'preview-option-b',
    name: 'Preview option B',
    description: null,
    available: true,
    accommodationNote: 'Test-only placeholder; the board has not approved meal details.',
  },
];

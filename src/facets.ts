// Filter facets for the human reference photo library.
//
// These are *catalog* dimensions: every photo is tagged manually (in the
// editor) or via the auto-annotation script with self-identified /
// source-declared values. They are NOT inferred from the image at search
// time and make no claim about any individual beyond how the photo's source
// described it. Edit these lists freely to match your dataset's vocabulary.

export type Facet = {
    key: 'ethnicity' | 'sex' | 'age';
    label: string;
    options: string[];
};

// Broad, self-identified groupings. Intentionally coarse and editable.
export const ETHNICITY_OPTIONS = [
    'African',
    'East Asian',
    'South Asian',
    'Southeast Asian',
    'European',
    'Latino / Hispanic',
    'Middle Eastern',
    'Indigenous',
    'Pacific Islander',
    'Multiracial',
];

export const SEX_OPTIONS = [
    'female',
    'male',
    'other',
];

export const AGE_OPTIONS = [
    'child',
    'teen',
    'young-adult',
    'adult',
    'senior',
];

export const FACETS: Facet[] = [
    {key: 'ethnicity', label: 'Ethnicity', options: ETHNICITY_OPTIONS},
    {key: 'sex', label: 'Sex', options: SEX_OPTIONS},
    {key: 'age', label: 'Age', options: AGE_OPTIONS},
];

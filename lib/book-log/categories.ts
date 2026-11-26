// The category taxonomy. A book's `categories` is a list of these values.
//
// Main categories get a base color from the PICO-8 palette; each
// sub-category ("Main/Sub") gets a shade of its main category's color.
// A book with several categories is drawn in the blend of all of them.
//
// To add a category: add it to `Category` and give it a color in `COLORS`.

export const Category = {
  Religion: "Religion",
  Theology: "Religion/Theology",

  History: "History",
  Medieval: "History/Medieval",

  Fiction: "Fiction",
  Fantasy: "Fiction/Fantasy",
  Mystery: "Fiction/Mystery",
  Philosophical: "Fiction/Philosophical",

  SelfHelp: "Self-help",
  Health: "Self-help/Health",
} as const;

export type Category = (typeof Category)[keyof typeof Category];

const COLORS: Record<Category, string> = {
  [Category.Religion]: "#ffec27",
  [Category.Theology]: "#fff79e",

  [Category.History]: "#ffa300",
  [Category.Medieval]: "#ffcc80",

  [Category.Fiction]: "#29adff",
  [Category.Fantasy]: "#a3dcff",
  [Category.Mystery]: "#00fff0",
  [Category.Philosophical]: "#3d6ee0",

  [Category.SelfHelp]: "#00e436",
  [Category.Health]: "#8cff9e",
};

/** The main category a value belongs to ("Fiction/Fantasy" → "Fiction"). */
export function mainCategory(category: Category): Category {
  return category.split("/")[0] as Category;
}

/** Main categories in declaration order, e.g. for legends and charts. */
export const MAIN_CATEGORIES = Object.values(Category).filter(
  (c) => mainCategory(c) === c,
);

export function categoryColor(category: Category): string {
  return COLORS[category];
}

/** The color for a list of categories: the average of their colors. */
export function blendColor(categories: readonly Category[]): string {
  const rgbs = categories.map((c) => {
    const n = parseInt(COLORS[c].slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  });
  return (
    "#" +
    [0, 1, 2]
      .map((i) => {
        const avg = rgbs.reduce((sum, rgb) => sum + rgb[i], 0) / rgbs.length;
        return Math.round(avg).toString(16).padStart(2, "0");
      })
      .join("")
  );
}

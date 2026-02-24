import { PrismaClient, Role, Difficulty } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { RECIPES, RecipeEntry } from './data/recipes';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ['info', 'warn', 'error'] });

interface Ingredient {
  name: string;
  quantity: number | string | null;
  unit: string | null;
}

const HEBREW_TO_LATIN: [RegExp, string][] = [
  [/א/g, 'a'],
  [/ב/g, 'v'],
  [/ג/g, 'g'],
  [/ד/g, 'd'],
  [/ה/g, 'h'],
  [/ו/g, 'v'],
  [/ז/g, 'z'],
  [/ח/g, 'h'],
  [/ט/g, 't'],
  [/י/g, 'i'],
  [/כ|ך/g, 'k'],
  [/ל/g, 'l'],
  [/מ|ם/g, 'm'],
  [/נ|ן/g, 'n'],
  [/ס/g, 's'],
  [/ע/g, 'i'],
  [/פ|ף/g, 'f'],
  [/צ|ץ/g, 'ts'],
  [/ק/g, 'k'],
  [/ר/g, 'r'],
  [/ש/g, 'sh'],
  [/ת/g, 't'],
];

function toSlug(hebrew: string): string {
  let result = hebrew;
  for (const [pattern, replacement] of HEBREW_TO_LATIN) {
    result = result.replace(pattern, replacement);
  }
  return result
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function parseIngredients(raw: string): Ingredient[] {
  const UNIT_MAP: [RegExp, string][] = [
    [/ק"ג|קילו/, 'kg'],
    [/גרם|גר'|גרום|גר/, 'gram'],
    [/מ"ל|מיליליטר/, 'ml'],
    [/ליטר/, 'liter'],
    [/כוסות|כוס/, 'cup'],
    [/כפות|כף/, 'tbsp'],
    [/כפיות|כפית/, 'tsp'],
    [/ראש/, 'head'],
    [/צרורות|צרור/, 'bunch'],
    [/חבילת|חבילה/, 'package'],
    [/קופסת|קופסא/, 'can'],
    [/שיני|שן/, 'clove'],
    [/ענפי|ענף/, 'sprig'],
    [/חופן/, 'handful'],
    [/קורט/, 'pinch'],
  ];

  const lines = raw.split(/\r\n|\n/);
  const result: Ingredient[] = [];

  for (const rawLine of lines) {
    // Skip section header lines that contain HTML tags (e.g. <strong>לסלט</strong>)
    if (/<[^>]+>/.test(rawLine)) continue;
    const stripped = rawLine.trim();
    if (!stripped) continue;

    let remaining = stripped;

    // Extract leading quantity (integer, decimal, fraction, or range like 8-9)
    let quantity: number | string | null = null;
    const quantityMatch = remaining.match(
      /^(\d+(?:[.,]\d+)?(?:\/\d+)?(?:-\d+)?)\s*/,
    );
    if (quantityMatch) {
      const rawQty = quantityMatch[1];
      remaining = remaining.slice(quantityMatch[0].length);
      if (/\//.test(rawQty)) {
        quantity = rawQty; // fraction string like "1/2"
      } else if (/-/.test(rawQty)) {
        quantity = rawQty; // range string like "8-9"
      } else {
        quantity = parseFloat(rawQty.replace(',', '.'));
      }
    }

    // Extract unit
    let unit: string | null = null;
    for (const [pattern, unitValue] of UNIT_MAP) {
      const unitRegex = new RegExp(`^(${pattern.source})\\s*`);
      const match = remaining.match(unitRegex);
      if (match) {
        unit = unitValue;
        remaining = remaining.slice(match[0].length);
        break;
      }
    }

    const name = remaining.trim();
    if (!name) continue;

    result.push({ name, quantity, unit });
  }

  return result;
}

const CATEGORY_DATA: { name: string; slug: string }[] = [
  { name: 'מרקים', slug: 'marakim' },
  { name: 'סלטים', slug: 'salatim' },
  { name: 'ירקות', slug: 'yerakot' },
  { name: 'תוספות', slug: 'tosafot' },
  { name: 'עיקריות', slug: 'ikkariyot' },
  { name: 'עוגות ועוגיות', slug: 'ugot-ve-ugiyot' },
  { name: 'אפייה מלוחה', slug: 'afiya-meluha' },
  { name: 'קינוחים', slug: 'kinuhim' },
  { name: 'רטבים', slug: 'retavim' },
  { name: 'שונות', slug: 'shonot' },
];

function getCookTime(categoryName: string): number {
  if (categoryName === 'מרקים') return 45;
  if (categoryName === 'עיקריות') return 40;
  if (categoryName === 'עוגות ועוגיות' || categoryName === 'אפייה מלוחה')
    return 50;
  return 20;
}

function getServings(categoryName: string): number {
  if (categoryName === 'מרקים') return 6;
  if (categoryName === 'עיקריות') return 4;
  if (categoryName === 'עוגות ועוגיות' || categoryName === 'אפייה מלוחה')
    return 12;
  if (categoryName === 'סלטים' || categoryName === 'תוספות') return 8;
  return 6;
}

async function main() {
  console.log('Seed started...');
  await prisma.$connect();

  // 1. Cleanup existing data (order matters)
  await prisma.recipe.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin User
  const adminPassword = await bcrypt.hash('Foodies1!', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'danielis@recipes.com',
      password: adminPassword,
      name: 'Danieli',
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin user: ${admin.name} (${admin.email})`);

  // 3. Create Categories
  const categoryMap = new Map<string, string>(); // Hebrew name -> id
  for (const cat of CATEGORY_DATA) {
    const created = await prisma.category.create({ data: cat });
    categoryMap.set(cat.name, created.id);
    console.log(`Created category: ${cat.name} (${cat.slug})`);
  }

  // 4. Load recipe data
  const recipes: RecipeEntry[] = RECIPES;

  // Track used slugs to avoid collisions
  const usedSlugs = new Map<string, number>();

  function uniqueSlug(base: string): string {
    if (!usedSlugs.has(base)) {
      usedSlugs.set(base, 1);
      return base;
    }
    const count = usedSlugs.get(base)! + 1;
    usedSlugs.set(base, count);
    return `${base}-${count}`;
  }

  // 5. Create Recipes
  for (const entry of recipes) {
    const categoryId = categoryMap.get(entry.type);
    if (!categoryId) {
      console.warn(`Unknown category type: ${entry.type}, skipping recipe: ${entry.name}`);
      continue;
    }

    const baseSlug = toSlug(entry.name);
    const slug = uniqueSlug(baseSlug);

    const steps = entry.instructions
      .split(/\r\n|\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const ingredients = parseIngredients(entry.ingredients);
    const story = entry.story && entry.story.trim() ? entry.story.trim() : null;

    const created = await prisma.recipe.create({
      data: {
        title: entry.name,
        slug,
        description: story,
        story,
        categoryId,
        difficulty: Difficulty.Easy,
        prepTimeMinutes: 20,
        cookTimeMinutes: getCookTime(entry.type),
        servings: getServings(entry.type),
        ingredients,
        steps,
        imageUrl: null,
        createdById: admin.id,
      },
    });
    console.log(`Created recipe: ${created.title} (${created.slug})`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

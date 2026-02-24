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

async function main() {
  console.log('Seed started...');
  await prisma.$connect();

  // 1. Upsert Admin User
  const adminPassword = await bcrypt.hash('Foodies1!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'danielis@recipes.com' },
    update: {},
    create: {
      email: 'danielis@recipes.com',
      password: adminPassword,
      name: 'Danieli',
      role: Role.ADMIN,
    },
  });
  console.log(`Upserted admin user: ${admin.name} (${admin.email})`);

  // 2. Upsert Categories
  const categoryMap = new Map<string, string>(); // Hebrew name -> id
  for (const cat of CATEGORY_DATA) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap.set(cat.name, created.id);
    console.log(`Upserted category: ${cat.name} (${cat.slug})`);
  }

  // 3. Load recipe data
  const recipes: RecipeEntry[] = RECIPES;

  // 4. Upsert Recipes
  for (const entry of recipes) {
    const categoryId = categoryMap.get(entry.type);
    if (!categoryId) {
      console.warn(
        `Unknown category type: ${entry.type}, skipping recipe: ${entry.title}`,
      );
      continue;
    }

    const created = await prisma.recipe.upsert({
      where: { slug: entry.slug },
      update: {},
      create: {
        title: entry.title,
        slug: entry.slug,
        description: entry.description,
        story: entry.story,
        categoryId,
        difficulty: entry.difficulty as Difficulty,
        prepTimeMinutes: entry.prepTimeMinutes,
        prepTimeNote: entry.prepTimeNote,
        cookTimeMinutes: entry.cookTimeMinutes,
        servings: entry.servings,
        ingredients: entry.ingredients,
        steps: entry.steps,
        imageUrl: entry.imageUrl,
        createdById: admin.id,
      },
    });
    console.log(`Upserted recipe: ${created.title} (${created.slug})`);
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

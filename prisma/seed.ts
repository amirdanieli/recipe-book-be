import { PrismaClient, Role, Difficulty } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({ log: ['info', 'warn', 'error'] });

async function main() {
  console.log('Seed started...');
  await prisma.$connect();

  // 1. Cleanup existing data (order matters)
  await prisma.recipe.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@recipes.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  // 3. Create Categories
  const desserts = await prisma.category.create({
    data: {
      name: 'Desserts',
      slug: 'desserts',
    },
  });

  const mainCourse = await prisma.category.create({
    data: {
      name: 'Main Course',
      slug: 'main-course',
    },
  });

  // 4. Create Recipes
  await prisma.recipe.create({
    data: {
      title: 'Chocolate Lava Cake',
      slug: 'chocolate-lava-cake',
      description: 'A delicious chocolate cake with a molten center.',
      categoryId: desserts.id,
      difficulty: Difficulty.Medium,
      prepTimeMinutes: 15,
      cookTimeMinutes: 12,
      servings: 2,
      story:
        'This recipe was passed down from my grandmother who loved baking for the holidays.',
      ingredients: [
        { name: 'Dark Chocolate', quantity: 100, unit: 'g' },
        { name: 'Butter', quantity: 50, unit: 'g' },
        { name: 'Eggs', quantity: 2, unit: 'pcs' },
        { name: 'Sugar', quantity: 50, unit: 'g' },
        { name: 'Flour', quantity: 20, unit: 'g' },
      ],
      steps: [
        'Melt chocolate and butter together.',
        'Whisk eggs and sugar until pale.',
        'Fold in melted chocolate mixture.',
        'Sift in flour and fold gently.',
        'Bake at 200°C for 12 minutes.',
      ],
      createdById: admin.id,
    },
  });

  await prisma.recipe.create({
    data: {
      title: 'Classic Beef Burger',
      slug: 'classic-beef-burger',
      description: 'Juicy beef patty with fresh lettuce and tomato.',
      categoryId: mainCourse.id,
      difficulty: Difficulty.Easy,
      prepTimeMinutes: 10,
      cookTimeMinutes: 10,
      servings: 1,
      ingredients: [
        { name: 'Ground Beef', quantity: 150, unit: 'g' },
        { name: 'Burger Bun', quantity: 1, unit: 'pc' },
        { name: 'Lettuce', quantity: 2, unit: 'leaves' },
        { name: 'Tomato', quantity: 2, unit: 'slices' },
      ],
      steps: [
        'Shape beef into a patty.',
        'Grill patty for 5 minutes per side.',
        'Toast the buns.',
        'Assemble the burger.',
      ],
      createdById: admin.id,
    },
  });

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

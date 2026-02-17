import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { Prisma, Recipe } from '@prisma/client';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createRecipeDto: CreateRecipeDto,
    userId: string,
  ): Promise<Recipe> {
    const slug = this.generateSlug(createRecipeDto.title);
    const { ingredients, categoryId, ...rest } = createRecipeDto;

    return this.prisma.recipe.create({
      data: {
        ...rest,
        ingredients: ingredients as unknown as Prisma.InputJsonValue,
        slug,
        category: { connect: { id: categoryId } },
        createdBy: { connect: { id: userId } },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
      },
    });
  }

  findAll(category?: string): Promise<Recipe[]> {
    const where: Prisma.RecipeWhereInput = category
      ? { categoryId: category }
      : {};
    return this.prisma.recipe.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(slug: string): Promise<Recipe> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { slug },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
      },
    });
    if (!recipe) {
      throw new NotFoundException(`Recipe with slug ${slug} not found`);
    }
    return recipe;
  }

  async update(
    slug: string,
    updateRecipeDto: UpdateRecipeDto,
  ): Promise<Recipe> {
    const existing = await this.findOne(slug);

    const { ingredients, ...rest } = updateRecipeDto;
    const data: Prisma.RecipeUpdateInput = { ...rest };

    if (updateRecipeDto.title && updateRecipeDto.title !== existing.title) {
      data.slug = this.generateSlug(updateRecipeDto.title);
    }

    if (ingredients) {
      data.ingredients = ingredients as unknown as Prisma.InputJsonValue;
    }

    return this.prisma.recipe.update({
      where: { slug },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
      },
    });
  }

  async removeBySlug(slug: string): Promise<Recipe> {
    await this.findOne(slug); // Ensure it exists
    return this.prisma.recipe.delete({ where: { slug } });
  }

  remove(id: string): Promise<Recipe> {
    return this.prisma.recipe.delete({ where: { id } });
  }

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Date.now().toString().slice(-6)
    );
  }
}

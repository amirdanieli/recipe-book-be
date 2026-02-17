import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  Min,
  IsNotEmpty,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty } from '@prisma/client';

export class IngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  quantity: string;

  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsEnum(Difficulty)
  @IsNotEmpty()
  difficulty: Difficulty;

  @IsInt()
  @Min(0)
  prepTimeMinutes: number;

  @IsString()
  @IsOptional()
  prepTimeNote?: string;

  @IsInt()
  @Min(0)
  cookTimeMinutes: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  servings?: number;

  @IsString()
  @IsOptional()
  story?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  @IsNotEmpty()
  ingredients: IngredientDto[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  steps: string[];

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

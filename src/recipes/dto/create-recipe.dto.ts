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
import { Type, Transform } from 'class-transformer';
import { Difficulty } from '@prisma/client';

export class IngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(({ value }: { value: unknown }): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return String(value);
  })
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

  @Transform(({ value }: { value: unknown }): string => {
    if (!value) return '';
    const str = typeof value === 'string' ? value : String(value);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  })
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

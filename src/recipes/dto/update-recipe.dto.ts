import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  Min,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Difficulty } from '@prisma/client';
import { IngredientDto } from './create-recipe.dto';

export class UpdateRecipeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @Transform(({ value }: { value: unknown }): string => {
    if (!value) return '';
    const str = typeof value === 'string' ? value : String(value);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  })
  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsInt()
  @Min(0)
  @IsOptional()
  prepTimeMinutes?: number;

  @IsString()
  @IsOptional()
  prepTimeNote?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  cookTimeMinutes?: number;

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
  @IsOptional()
  ingredients?: IngredientDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  steps?: string[];

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

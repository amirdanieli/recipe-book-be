import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, AuthenticatedRequest } from '../utils/types';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  create(
    @Body() createRecipeDto: CreateRecipeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recipesService.create(createRecipeDto, req.user.id);
  }

  @Get()
  findAll(@Query('category') category?: string) {
    return this.recipesService.findAll(category);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.recipesService.findOne(slug);
  }

  @Put(':slug')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('slug') slug: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(slug, updateRecipeDto);
  }

  @Delete(':slug')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('slug') slug: string) {
    return this.recipesService.removeBySlug(slug);
  }
}

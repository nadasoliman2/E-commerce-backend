import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto,UpdateBrandParamsDto } from './dto/update-brand.dto';
import { Token, Role, Auth, User } from 'src/common/decorator/index';
import { RoleEnum } from "src/common/enums/index";
import {
  FileInterceptor,
  FilesInterceptor,
  AnyFilesInterceptor,
} from '@nestjs/platform-express';
import type { IFile, IUser } from 'src/common/interfaces';
import type{ UserDocument } from 'src/common/model';
import {
  fileFieldValidation,
  localMulter,
  cloudMulter,
} from 'src/common/utils/index';
import { UploadedFiles,UploadedFile } from '@nestjs/common';
import { ParseFilePipe } from '@nestjs/common';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}
 @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )

  @Auth([RoleEnum.ADMIN])
  @Post()
 async create(@Body() createBrandDto: CreateBrandDto,
  @User() user:UserDocument,
  @UploadedFile(ParseFilePipe) file:IFile
 ) {
    return await this.brandService.create(createBrandDto,user,file);
  }

  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(+id);
  }

 @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Auth([RoleEnum.ADMIN])
  @Patch(':brandId')
  async update(@Param() {brandId}: UpdateBrandParamsDto,
   @Body() updateBrandDto: UpdateBrandDto,
  @User() user:UserDocument,
  @UploadedFile(new ParseFilePipe({fileIsRequired:false})) file?:IFile) {
    return await  this.brandService.update({brandId}, updateBrandDto,user,file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandService.remove(+id);
  }
}

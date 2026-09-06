import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { BrandRepository } from '../../common/repository/index.js';
import {brandModel} from 'src/common/model/index'
import { S3Service } from 'src/common/services';
import { AuthenticationModule } from '../authentication/authentication.module';

@Module({
  imports:[brandModel,AuthenticationModule],
  controllers: [BrandController],
  providers: [BrandService, BrandRepository, S3Service],
})
export class BrandModule { }

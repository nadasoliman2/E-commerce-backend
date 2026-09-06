import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandDto } from './create-brand.dto';
import {IsMongoId} from 'class-validator'
import {Types} from "mongoose"
import {toObjectId} from 'src/common/utils/index'

export class UpdateBrandDto extends PartialType(CreateBrandDto) {
    
}
export class UpdateBrandParamsDto {
    @IsMongoId()
    brandId!: Types.ObjectId | string
}

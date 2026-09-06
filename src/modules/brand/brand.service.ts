import { Injectable } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto ,UpdateBrandParamsDto} from './dto/update-brand.dto';
import {BrandRepository} from '../../common/repository/index.js'
import { S3Service } from 'src/common/services';
import {generateSlug, toObjectId} from 'src/common/utils/index'
import { IFile, IUser,IBrand } from 'src/common/interfaces';
import { UserDocument } from 'src/common/model';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common/exceptions';

@Injectable()
export class BrandService {


  constructor(
    private readonly s3Service:S3Service,
  private readonly brandRepository: BrandRepository) {}
  async create({name}: CreateBrandDto,user:UserDocument,file:IFile) {
    const checkDuplicated = await this.brandRepository.findOne({filter:{name,paranoid:false}})
    if(checkDuplicated){
      throw new ConflictException("Brand Already Existt")
    }
    const image =  await this.s3Service.uploadAsset({file,path:`Brand`})
    const brand = await this.brandRepository.createOne({
      data:{
        name,
        image,
        createdBy:user._id
      }
    })
    if(!brand){
      await this.s3Service.deleteAsset({Key:image})
      throw new BadRequestException("Fail to create this brand instance")
    }
    
    return brand.toJSON() ;
  }

  findAll() {
    return `This action returns all brand`;
  }

  findOne(id: number) {
    return `This action returns a #${id} brand`;
  }

  async update({brandId}: UpdateBrandParamsDto, {name}: UpdateBrandDto,user:UserDocument,file?:IFile):Promise<IBrand> {
    brandId = toObjectId(brandId as string)
    const brand = await this.brandRepository.findOne({filter:{_id:brandId}})
   if(!brand) throw new NotFoundException("Fail to find matching brand")
   if(name){
if(await this.brandRepository.findOne({filter:{name,_id:{$ne:brandId},paranoid:false}})){
  throw new ConflictException("Brand Name Already Exist")
}
brand.name = name;

   }
   let oldImage!:string;
   if(file){
    oldImage = brand.image;
    brand.image = await this.s3Service.uploadAsset({file,path:`Brand`})
   }
   brand.updatedBy = user._id;
   await brand.save();
if(oldImage){
  await this.s3Service.deleteAsset({Key:oldImage})
}

    return brand.toJSON()
  }

  remove(id: number) {
    return `This action removes a #${id} brand`;
  }
}

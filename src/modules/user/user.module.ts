import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

import { AuthenticationModule } from '../authentication/authentication.module';

import { S3Service } from 'src/common/services';

@Module({
  imports: [
    AuthenticationModule,
    // MulterModule.register({
    //   storage:diskStorage({
    // destination(req:Request,file:Express.Multer.File,callback:Function){
    //   return callback(null,`./uploads`)
    // },
    // filename(req:Request,file:Express.Multer.File,callback:Function){
    // const uniqueFileName = randomUUID() +"_" + file.originalname
    //   return callback(null,uniqueFileName)
    // } }),
    // fileFilter(req:Request,file:Express.Multer.File,callback:Function){
    // if(!['image/jpeg'].includes(file.mimetype)){
    //   return callback(new BadRequestException("Invalid file format"))
    // }
    // return callback(null,true)
    // },
    // limits:{fileSize: 2*1024*1024 , }

    // })
  ],
  exports: [UserService],
  controllers: [UserController],
  providers: [UserService, S3Service],
})
export class UserModule {}

import {
  ParseFilePipe,
  MaxFileSizeValidator,
  UseInterceptors,
  Controller,
  Patch,
  Req,
  Get,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
// import { AuthenticationGuard, AuthorizationGuard } from 'src/common/guard';
import { TokenTypeEnum, RoleEnum } from 'src/common/enums';
import { Token, Role, Auth, User } from 'src/common/decorator/index';
import type { UserDocument } from 'src/common/model/user.model';
import { of, delay } from 'rxjs';
import type { IFile, IUser } from 'src/common/interfaces/index';
import {
  FileInterceptor,
  FilesInterceptor,
  AnyFilesInterceptor,
} from '@nestjs/platform-express';

import type { Request } from 'express';
import {
  fileFieldValidation,
  localMulter,
  cloudMulter,
} from 'src/common/utils/index';
import { UploadedFiles } from '@nestjs/common';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Auth([RoleEnum.USER, RoleEnum.ADMIN])
  @Get()
  profile(@Req() req, @User() user: UserDocument): UserDocument {
    return user;
  }
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Auth([RoleEnum.USER, RoleEnum.ADMIN])
  @Patch('profile-image')
  async profileImage(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
      }),
    )
    file: IFile,
    @Req() req,
    @User() user: UserDocument,
  ): Promise<IUser> {
    return await this.userService.profileImage(file, user);
  }
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      2,
      cloudMulter({
        validation: fileFieldValidation.image,
      }),
    ),
  )
  @Auth([RoleEnum.USER, RoleEnum.ADMIN])
  @Patch('profile-cover-image')
  profileCoverImage(
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({
            maxSize: 2 * 1024 * 1024,
          }),
        ],
      }),
    )
    files: Array<IFile>,
    @Req() req,
    @User() user: UserDocument,
  ) {
    return files;
  }
  @UseInterceptors(
    AnyFilesInterceptor(
      cloudMulter({
        validation: fileFieldValidation.image,
      }),
    ),
  )
  @Auth([RoleEnum.USER, RoleEnum.ADMIN])
  @Patch('uploads')
  uploads(
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: true,
      }),
    )
    files: Array<IFile>,
    @Req() req,
    @User() user: UserDocument,
  ) {
    return files;
  }
}

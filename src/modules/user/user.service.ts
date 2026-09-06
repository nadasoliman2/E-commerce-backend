import { Injectable } from '@nestjs/common';
import { IFile, IUser } from 'src/common/interfaces';
import { UserDocument } from 'src/common/model';
import { S3Service } from 'src/common/services';

@Injectable()
export class UserService {
  constructor(private readonly s3service: S3Service) {}
  profile() {
    return { id: 1, username: 'nada', email: 'nadaemad271@gmail.com' };
  }
  async profileImage(file: IFile, user: UserDocument): Promise<IUser> {
    const oldImage = user.profilepicture;
    user.profilepicture = await this.s3service.uploadAsset({
      file,
      path: `${user._id.toString()}`,
    });
    await user.save();
    if (oldImage) {
      await this.s3service.deleteAsset({ Key: oldImage });
    }
    return user.toJSON();
  }
}

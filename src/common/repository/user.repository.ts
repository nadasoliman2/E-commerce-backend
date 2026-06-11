import { DatabaseRepository } from './database.repository.js';
import { IUser } from '../../common/interfaces/index';
import { Model } from 'mongoose';
import { User } from '../../common/model/index';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
@Injectable()
export class UserRepository extends DatabaseRepository<IUser> {
  constructor(@InjectModel(User.name) protected readonly model: Model<IUser>) {
    super(model);
  }
}

import { DatabaseRepository } from './database.repository.js';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../common/model/index';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
@Injectable()
export class UserRepository extends DatabaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name) protected readonly model: Model<UserDocument>,
  ) {
    super(model);
  }
}

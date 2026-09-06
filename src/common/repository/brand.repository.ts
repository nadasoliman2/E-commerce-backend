import { DatabaseRepository } from './database.repository.js';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from '../../common/model/index';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
@Injectable()
export class BrandRepository extends DatabaseRepository<BrandDocument> {
  constructor(
    @InjectModel(Brand.name) protected readonly model: Model<BrandDocument>,
  ) {
    super(model);
  }
}

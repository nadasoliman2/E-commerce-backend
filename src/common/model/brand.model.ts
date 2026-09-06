import { MongooseModule, SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { IBrand, IUser } from '../interfaces/index';
import { generateSlug } from '../utils/index';
import { HydratedDocument, Types } from 'mongoose';
@Schema({
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
  strict: true,
  strictQuery: true,
})
export class Brand implements IBrand {
  @Prop({
    type: String,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 50,
  })
  name!: string;
  @Prop({ type: String })
  slug!: string;
  @Prop({ type: String })
  image!: string;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId | IUser;
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  updatedBy?: Types.ObjectId | IUser;
  @Prop({ type: Date, required: false })
  createdAt?: Date;
  @Prop({ type: Date, required: false })
  updatedAt?: Date;
  @Prop({ type: Date, required: false })
  deletedAt?: Date;
  @Prop({ type: Date, required: false })
  restoredAt?: Date;
}
export const brandSchema = SchemaFactory.createForClass(Brand);

export const brandModel = MongooseModule.forFeatureAsync([
  {
    name: Brand.name,
    useFactory: () => {
      brandSchema.pre('save', function () {
        if (this.isModified('name')) {
          this.slug = generateSlug(this.name);
        }
      }
      );
      brandSchema.pre(['findOne', 'find'], function () {
        console.log(this.getFilter());
        const query = this.getQuery();
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ ...query, deletedAt: null });
        }
      });
      brandSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
        const update = this.getUpdate() as HydratedDocument<IBrand>;
        console.log(update);

        if (update.restoredAt) {
          this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
          this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
        }
        if (update.deletedAt) {
          this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
        }
        const query = this.getQuery();
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ ...query, deletedAt: { $exists: false } });
        }
        console.log(this.getQuery());
      });
      brandSchema.pre(['deleteOne', 'findOneAndDelete'], function () {
        const query = this.getQuery();
        console.log(query.force);
        if (query.force === true) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ ...query, deletedAt: { $exists: true } });
        }
        console.log(this.getQuery());
      });
      return brandSchema;
    },
  },
]);
export type BrandDocument = HydratedDocument<IBrand>;

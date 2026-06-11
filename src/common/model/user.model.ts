import {
  MongooseModule,
  SchemaFactory,
  Schema,
  Prop,
  Virtual,
} from '@nestjs/mongoose';
import { IUser } from '../interfaces/index';
import { RoleEnum, GenderEnum, ProviderEnum } from '../enums/index';
import { HydratedDocument } from 'mongoose';
import { generateHash, encrypt } from '../modules/security/index';
@Schema({
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
  strict: true,
  strictQuery: true,
})
export class User implements IUser {
  @Prop({ type: String, required: true })
  firstName!: string;
  @Prop({ type: String, required: true })
  lastName!: string;
  @Prop({ type: String, required: true, unique: true })
  email!: string;
  @Prop({ type: String, required: false })
  phone?: string;
  @Prop({
    required: function (this: User) {
      return this.provider === ProviderEnum.SYSTEM;
    },
  })
  password?: string;
  @Prop({ type: String, required: false })
  profilepicture?: string;
  @Prop({ type: [String], required: false })
  profilecoverpicture?: string[];

  @Prop({ type: Number, enum: GenderEnum, default: GenderEnum.MALE })
  gender!: GenderEnum;
  @Prop({ type: Number, enum: RoleEnum, default: RoleEnum.USER })
  role!: RoleEnum;
  @Prop({ type: Number, enum: ProviderEnum, default: ProviderEnum.SYSTEM })
  provider!: ProviderEnum;
  @Prop({ type: Date, required: false })
  changeCredentialsTime?: Date;
  @Prop({ type: Date, required: false })
  DOB?: Date;

  @Prop({ type: Date, required: false })
  confirmEmail?: Date;
  @Prop({ type: Date, required: false })
  deletedAt?: Date;
  @Prop({ type: Date, required: false })
  restoredAt?: Date;

  @Virtual({
    set: function (this: HydratedDocument<User>, value: string) {
      const [firstName, lastName] = value.split(' ');
      this.firstName = firstName;
      this.lastName = lastName;
    },
    get: function (this: HydratedDocument<User>) {
      return `${this.firstName} ${this.lastName}`;
    },
  })
  username?: string;
}
export const userSchema = SchemaFactory.createForClass(User);

export const UserModel = MongooseModule.forFeatureAsync([
  {
    name: User.name,
    useFactory: () => {
      userSchema.pre('save', async function () {
        if (this.isModified('password') && this.password) {
          this.password = await generateHash({ plaintext: this.password });
        }
        if (this.phone && this.isModified('phone')) {
          this.phone = await encrypt(this.phone);
        }
      });
      userSchema.pre(['findOne', 'find'], function () {
        console.log(this.getFilter());
        const query = this.getQuery();
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ ...query, deletedAt: null });
        }
      });
      userSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
        const update = this.getUpdate() as HydratedDocument<IUser>;
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
      userSchema.pre(['deleteOne', 'findOneAndDelete'], function () {
        const query = this.getQuery();
        console.log(query.force);
        if (query.force === true) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ ...query, deletedAt: { $exists: true } });
        }
        console.log(this.getQuery());
      });
      return userSchema;
    },
  },
]);

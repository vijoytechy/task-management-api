import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Query } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id?: Types.ObjectId; 

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true ,index: true})
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  role: Types.ObjectId;

  @Prop({ default: false })
  isActive: boolean;
  static _id: any;
  static email: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<Query<any, User>>(/^find/, function (next) {
  this.populate('role', 'name description');
  next();
});


UserSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.password;
    return ret;
  },
});

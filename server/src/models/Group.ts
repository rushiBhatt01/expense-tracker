import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  members: string[]; // Clerk User IDs
  creatorId: string; // Clerk User ID
  createdAt: Date;
}

const GroupSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  members: { type: [String], required: true },
  creatorId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
export default Group;

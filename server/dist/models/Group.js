import mongoose, { Schema } from 'mongoose';
const GroupSchema = new Schema({
    name: { type: String, required: true, trim: true },
    members: { type: [String], required: true },
    creatorId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
export const Group = mongoose.model('Group', GroupSchema);
export default Group;

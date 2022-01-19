import Mongoose from "mongoose";

const { Schema } = Mongoose;

const leaveSchema = new Schema(
	{
		userID: {
			type: Schema.Types.ObjectId,
			required: true,
		},
		date: {
			type: Date,
			required: true,
		},
		reason: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const Leave = Mongoose.model("Leave", leaveSchema);
export default Leave;

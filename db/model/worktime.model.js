import Mongoose from "mongoose";

const { Schema } = Mongoose;

const worktimeSchema = new Schema(
	{
		userID: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		date: {
			type: Date,
			required: true,
		},
		checkIn: {
			type: Date,
		},
		checkOut: {
			type: Date,
		},
		location: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const Worktime = Mongoose.model("Worktime", worktimeSchema);
export default Worktime;

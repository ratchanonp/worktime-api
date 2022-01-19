import Mongoose from "mongoose";

const { Schema } = Mongoose;

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			isUnique: true,
		},
		password: { type: String, required: true },
		title: { type: String, required: true },
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		role: [{ type: String, required: true }],
		permissions: [{ type: String, required: true }],
		lastlogin: { type: Date },
		isActive: { type: Boolean, required: true },
	},
	{ timestamps: true, versionKey: false }
);

const userModel = Mongoose.model("user", userSchema);

export default userModel;

<<<<<<< HEAD
import User from "../db/model/user.model.js";
import Worktime from "../db/model/worktime.model.js";
import Leave from "../db/model/leave.model.js";

import { createModule, gql } from "graphql-modules";

import moment from "moment-timezone";

export const worktimeModule = createModule({
	id: "worktimeModule",
	dirname: "worktime",
	typeDefs: gql`
		type Query {
			worktime: [Worktime]

			worktimeByUserID(userID: ID!, duration: duration): [Worktime]
			worktimeByDates(duration: duration): [Worktime]

			todayCheckedIns: [Worktime]
			todayCheckedOuts: [Worktime]

			todayNotCheckedIn: [User]
			todayNotCheckedOut: [User]

			meStatus: Worktime
			meWorktimes: [Worktime]

			getServerTime: String
		}

		type Mutation {
			# User Action
			checkIn(location: String!): Worktime
			checkOut: Worktime

			leave(reason: String!): Leave

			# Admin Action
			addWorktime(_id: ID!, worktime: WorktimeInput): Worktime
			updateWorktime(_id: ID!, worktime: WorktimeInput): Worktime
			deleteWorktime(_id: ID!): Worktime

			#Bulk Actions
			addWorktimes(worktimes: [WorktimeInput]): [Worktime]
			updateWorktimes(_ids: [ID!], worktime: WorktimeInput): bulkResult
			deleteWorktimes(_ids: [ID!]): bulkResult
		}

		type Subscription {
			checkedIn: checkedSubscription
			checkedOut: checkedSubscription
		}

		type checkedSubscription {
			user: User
			time: String
		}

		type bulkResult {
			ok: Int
			n: Int
		}

		input duration {
			startDate: String!
			endDate: String!
		}

		input WorktimeInput {
			userID: ID
			date: String
			location: String
			checkIn: String
			checkOut: String
		}

		type Worktime {
			_id: ID
			user: User
			location: String
			date: String
			checkIn: String
			checkOut: String
			note: String
			createdAt: String
			updatedAt: String
		}

		type Leave {
			_id: ID
			user: User
			date: String
			reason: String
		}
	`,
	resolvers: {
		Query: {
			async todayCheckedIns() {
				const now = new Date();
				const currentDate = now.toISOString().slice(0, 10);

				return await Worktime.find({
					date: currentDate,
					checkIn: { $ne: null },
				}).sort({ checkIn: -1 });
			},
			async todayCheckedOuts() {
				const now = new Date();
				const currentDate = now.toISOString().slice(0, 10);

				return await Worktime.find({
					date: currentDate,
					checkOut: { $ne: null },
				}).sort({ checkOut: -1 });
			},
			async todayNotCheckedIn() {
				const now = new Date();
				const currentDate = now.toISOString().slice(0, 10);
				const checkedIn = await Worktime.find({
					date: currentDate,
					checkIn: { $ne: null },
				});
				const users = User.find({
					_id: {
						$not: {
							$in: checkedIn.map((item) => item.userID),
						},
					},
				});
				return users;
			},
			async todayNotCheckedOut() {
				const now = new Date();
				const currentDate = now.toISOString().slice(0, 10);
				const checkedIn = await Worktime.find({
					date: currentDate,
					checkIn: { $ne: null },
				});
				const checkedOut = await Worktime.find({
					date: currentDate,
					checkOut: { $ne: null },
				});

				
				const users = User.find({
					_id: {
						$nin: checkedOut.map((item) => item.userID),
						$in: checkedIn.map((item) => item.userID),
					},
				});
				return users;
			},
			async worktime() {
				return await Worktime.find();
			},
			async worktimeByUserID(root, { userID, duration }) {
				return await Worktime.find({ userID, duration });
			},
			async worktimeByDates(root, { duration }) {
				const { startDate, endDate } = duration;
				
				const start = new Date(startDate * 1000);
				const end = new Date(endDate * 1000);

				return await Worktime.find({
					date: {
						$gte: start,
						$lte: end,
					},
				});
			},
			async meStatus(root, arg, { user }) {
				if (!user) {
					throw new Error("Not Logged in");
				}
				const { _id } = user;

				const currentTime = new Date();
				const currentDate = currentTime.toISOString().slice(0, 10);

				//console.log(_id);
				//console.log(currentDate);

				const res = await Worktime.findOne({
					userID: _id,
					date: currentDate,
				});

				//console.log(res);
				return res || {};
			},
			async meWorktimes(root, arg, { user }) {
				if (!user) {
					throw new Error("Not Logged in");
				}
				const { _id } = user;

				return await Worktime.find({ userID: _id });
			},
			async getServerTime() {
				console.log(moment.tz(Date.now(), "Asia/Bangkok"));
				return moment.tz(Date.now(), "Asia/Bangkok");
			},
		},
		Mutation: {
			// Check in
			async checkIn(root, { location }, { user }) {
				if (!user) {
					throw new Error("User not found");
				}

				const { _id } = user;

				const currentTime = new Date();
				const Hour = currentTime.getHours();
				const currentDate = currentTime.toISOString().slice(0, 10);

				console.log(Hour);

				if (Hour > 10 || Hour < 7) {
					throw new Error("นอกเหนือเวลาลงชื่อ");
				}

				const CheckedIn = await Worktime.findOne({
					userID: _id,
					date: currentDate,
					checkIn: { $ne: null },
				});

				if (CheckedIn) {
					throw new Error("Already Checked In");
				}

				if (!location) {
					throw new Error("Location not provided");
				}

				//console.log(location);

				const result = await Worktime.create({
					userID: _id,
					location: location,
					date: currentDate,
					checkIn: currentTime,
				});

				return result;
			},
			// Check out
			async checkOut(root, arg, { user }) {
				if (!user) {
					throw new Error("User not found");
				}

				const { _id } = user;

				const currentTime = new Date();
				const Hour = currentTime.getHours();
				const currentDate = currentTime.toISOString().slice(0, 10);
				const CheckedIn = await Worktime.findOne({
					userID: _id,
					date: currentDate,
					checkIn: { $ne: null },
				});

				if (!CheckedIn) {
					throw new Error("ยังไม่ได้ลงชื่อเข้า");
				}

				if (Hour < 16 || Hour > 19) {
					throw new Error("นอกเหนือเวลาลงชื่อ");
				}

				const checkedOut = await Worktime.findOne({
					userID: _id,
					date: currentDate,
					checkOut: { $ne: null },
				});

				if (checkedOut) {
					throw new Error("Already Checked Out");
				}

				const result = await Worktime.findOneAndUpdate(
					{
						userID: _id,
						date: currentDate,
					},
					{
						$set: {
							checkOut: currentTime,
						},
					},
					{
						new: true,
					}
				);
				return result;
			},
			// Leave
			async leave(root, { reason }, { user }) {
				if (!user) {
					throw new Error("User not found");
				}

				const { _id } = user;

				const currentTime = new Date();
				const currentDate = currentTime.toISOString().slice(0, 10);

				const CheckedIn = await Worktime.findOne({
					userID: _id,
					date: currentDate,
					checkIn: { $ne: null },
				});

				if (CheckedIn) {
					throw new Error("ลงชื่อเข้าแล้วไม่สามารถลาได้");
				}
				
				return await Leave.create({
					userID: _id,
					date: currentDate,
					reason: reason,
				});

			},	
			async addWorktime(root, { worktime }) {
				return await Worktime.create(worktime);
			},
			async updateWorktime(root_, { _id, worktime }) {
				return await Worktime.findOneAndUpdate({ _id }, worktime);
			},
			async deleteWorktime(root, { _id }) {
				return await Worktime.findOneAndRemove({ _id });
			},
			async addWorktimes(root, { worktimes }) {
				return await Worktime.insertMany(worktimes);
			},
			async updateWorktimes(root, { _ids, worktime }) {
				return await Worktime.updateMany(
					{ _id: { $in: _ids } },
					worktime
				);
			},
			async deleteWorktimes(root, { _ids }) {
				return await Worktime.deleteMany({ _id: { $in: _ids } });
			},
		},
		Worktime: {
			user: async (root) => {
				return await User.findOne({ _id: root.userID });
			},
			date: async (root) => {
				if (root.date) {
					return root.date / 1000 - (root.date % 1000) / 1000;
				}
			},
			checkIn: async (root) => {
				if (root.checkIn) {
					return root.checkIn / 1000 - (root.checkIn % 1000) / 1000;
				}
			},
			checkOut: async (root) => {
				if (root.checkOut) {
					return root.checkOut / 1000 - (root.checkOut % 1000) / 1000;
				}
			},
		},
	},
});
=======
import User from "../db/model/user.model.js";
import Worktime from "../db/model/worktime.model.js";

import { createModule, gql } from "graphql-modules";

import moment from "moment-timezone";

export const worktimeModule = createModule({
	id: "worktimeModule",
	dirname: "worktime",
	typeDefs: gql`
		type Query {
			worktime: [Worktime]

			worktimeByUserID(userID: ID!, duration: duration): [Worktime]
			worktimeByDates(duration: duration): [Worktime]

			todayCheckedIns: [Worktime]
			todayCheckedOuts: [Worktime]

			todayNotCheckedIn: [User]
			todayNotCheckedOut: [User]

			meStatus: Worktime
			meWorktimes: [Worktime]

			getServerTime: String
		}

		type Mutation {
			# User Action
			checkIn(location: String!): Worktime
			checkOut: Worktime

			# Admin Action
			addWorktime(_id: ID!, worktime: WorktimeInput): Worktime
			updateWorktime(_id: ID!, worktime: WorktimeInput): Worktime
			deleteWorktime(_id: ID!): Worktime

			#Bulk Actions
			addWorktimes(worktimes: [WorktimeInput]): [Worktime]
			updateWorktimes(_ids: [ID!], worktime: WorktimeInput): bulkResult
			deleteWorktimes(_ids: [ID!]): bulkResult
		}

		type Subscription {
			checkedIn: checkedSubscription
			checkedOut: checkedSubscription
		}

		type checkedSubscription {
			user: User
			time: String
		}

		type bulkResult {
			ok: Int
			n: Int
		}

		input duration {
			startDate: String!
			endDate: String!
		}

		input WorktimeInput {
			userID: ID
			date: String
			location: String
			checkIn: String
			checkOut: String
		}

		type Worktime {
			_id: ID
			user: User
			location: String
			date: String
			checkIn: String
			checkOut: String
			createdAt: String
			updatedAt: String
		}
	`,
	resolvers: {
		Query: {
			async todayCheckedIns() {
				const now = new Date();
				const currentDate = now.toISOString().slice(0, 10);

				return await Worktime.find({
					date: currentDate,
					checkIn: { $ne: null },
				}).sort({ checkIn: -1 });
			},
			async todayCheckedOuts() {
				const now = new Date();
				const currentDate = now.toISOString().slice(0, 10);

				return await Worktime.find({
					date: currentDate,
					checkOut: { $ne: null },
				}).sort({ checkOut: -1 });
			},
			async todayNotCheckedIn() {
				const now = new Date();
				const currentDate = now.toISOString().slice(0, 10);
				const checkedIn = await Worktime.find({
					date: currentDate,
					checkIn: { $ne: null },
				});
				const users = User.find({
					_id: {
						$not: {
							$in: checkedIn.map((item) => item.userID),
						},
					},
				});
				return users;
			},
			async todayNotCheckedOut() {
				const now = new Date();
				const currentDate = now.toISOString().slice(0, 10);
				const checkedIn = await Worktime.find({
					date: currentDate,
					checkIn: { $ne: null },
				});
				const checkedOut = await Worktime.find({
					date: currentDate,
					checkOut: { $ne: null },
				});

				
				const users = User.find({
					_id: {
						$nin: checkedOut.map((item) => item.userID),
						$in: checkedIn.map((item) => item.userID),
					},
				});
				return users;
			},
			async worktime() {
				return await Worktime.find();
			},
			async worktimeByUserID(root, { userID, duration }) {
				return await Worktime.find({ userID, duration });
			},
			async worktimeByDates(root, { duration }) {
				const { startDate, endDate } = duration;
				
				const start = new Date(startDate * 1000);
				const end = new Date(endDate * 1000);

				return await Worktime.find({
					date: {
						$gte: start,
						$lte: end,
					},
				});
			},
			async meStatus(root, arg, { user }) {
				if (!user) {
					throw new Error("Not Logged in");
				}
				const { _id } = user;

				const currentTime = new Date();
				const currentDate = currentTime.toISOString().slice(0, 10);

				//console.log(_id);
				//console.log(currentDate);

				const res = await Worktime.findOne({
					userID: _id,
					date: currentDate,
				});

				//console.log(res);
				return res || {};
			},
			async meWorktimes(root, arg, { user }) {
				if (!user) {
					throw new Error("Not Logged in");
				}
				const { _id } = user;

				return await Worktime.find({ userID: _id });
			},
			async getServerTime() {
				console.log(moment.tz(Date.now(), "Asia/Bangkok"));
				return moment.tz(Date.now(), "Asia/Bangkok");
			},
		},
		Mutation: {
			// Check in
			async checkIn(root, { location }, { user }) {
				if (!user) {
					throw new Error("User not found");
				}

				const { _id } = user;

				const currentTime = new Date();
				const Hour = currentTime.getHours();
				const currentDate = currentTime.toISOString().slice(0, 10);

				console.log(Hour);

				if (Hour > 10 || Hour < 7) {
					throw new Error("นอกเหนือเวลาลงชื่อ");
				}

				const CheckedIn = await Worktime.findOne({
					userID: _id,
					date: currentDate,
					checkIn: { $ne: null },
				});

				if (CheckedIn) {
					throw new Error("Already Checked In");
				}

				if (!location) {
					throw new Error("Location not provided");
				}

				//console.log(location);

				const result = await Worktime.create({
					userID: _id,
					location: location,
					date: currentDate,
					checkIn: currentTime,
				});

				return result;
			},
			// Check out
			async checkOut(root, arg, { user }) {
				if (!user) {
					throw new Error("User not found");
				}

				const { _id } = user;

				const currentTime = new Date();
				const Hour = currentTime.getHours();
				const currentDate = currentTime.toISOString().slice(0, 10);
				const CheckedIn = await Worktime.findOne({
					userID: _id,
					date: currentDate,
					checkIn: { $ne: null },
				});

				if (!CheckedIn) {
					throw new Error("ยังไม่ได้ลงชื่อเข้า");
				}

				if (Hour < 16 || Hour > 19) {
					throw new Error("นอกเหนือเวลาลงชื่อ");
				}

				const checkedOut = await Worktime.findOne({
					userID: _id,
					date: currentDate,
					checkOut: { $ne: null },
				});

				if (checkedOut) {
					throw new Error("Already Checked Out");
				}

				const result = await Worktime.findOneAndUpdate(
					{
						userID: _id,
						date: currentDate,
					},
					{
						$set: {
							checkOut: currentTime,
						},
					},
					{
						new: true,
					}
				);
				return result;
			},

			async addWorktime(root, { worktime }) {
				return await Worktime.create(worktime);
			},
			async updateWorktime(root_, { _id, worktime }) {
				return await Worktime.findOneAndUpdate({ _id }, worktime);
			},
			async deleteWorktime(root, { _id }) {
				return await Worktime.findOneAndRemove({ _id });
			},
			async addWorktimes(root, { worktimes }) {
				return await Worktime.insertMany(worktimes);
			},
			async updateWorktimes(root, { _ids, worktime }) {
				return await Worktime.updateMany(
					{ _id: { $in: _ids } },
					worktime
				);
			},
			async deleteWorktimes(root, { _ids }) {
				return await Worktime.deleteMany({ _id: { $in: _ids } });
			},
		},
		Worktime: {
			user: async (root) => {
				return await User.findOne({ _id: root.userID });
			},
			date: async (root) => {
				if (root.date) {
					return root.date / 1000 - (root.date % 1000) / 1000;
				}
			},
			checkIn: async (root) => {
				if (root.checkIn) {
					return root.checkIn / 1000 - (root.checkIn % 1000) / 1000;
				}
			},
			checkOut: async (root) => {
				if (root.checkOut) {
					return root.checkOut / 1000 - (root.checkOut % 1000) / 1000;
				}
			},
		},
	},
});
>>>>>>> be1d8b9623b9fc63168bb44657a073fc2d7aa3b5

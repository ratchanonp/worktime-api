import User from "../db/model/user.model.js";
import Worktime from "../db/model/worktime.model.js";

import { createModule, gql } from "graphql-modules";

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
		}

		type Mutation {
			# User Action
			checkIn(userID: ID!): Worktime
			checkOut(userID: ID!): Worktime

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
			checkIn: String
			checkOut: String
		}

		type Worktime {
			_id: ID!
			user: User!
			date: String!
			checkIn: String!
			checkOut: String
			createdAt: String!
			updatedAt: String!
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
				});
			},
			async todayCheckedOuts() {
				const now = new Date();
				const currentDate = now.toISOString().slice(0, 10);

				return await Worktime.find({
					date: currentDate,
					checkOut: { $ne: null },
				});
			},
			async worktime() {
				return await Worktime.find();
			},
			async worktimeByUserID(root, { userID, duration }) {
				return await Worktime.find({ userID, duration });
			},
			async worktimeByDates(root, { duration }) {
				return await Worktime.find({ duration });
			},
		},
		Mutation: {
			// Check in
			async checkIn(root, { userID }) {
				const user = await User.findOne({ _id: userID });
				if (!user) {
					throw new Error("User not found");
				}
				const currentTime = new Date();
				const currentDate = currentTime.toISOString().slice(0, 10);

				const CheckedIn = await Worktime.findOne({
					userID: userID,
					date: currentDate,
					checkIn: { $ne: null },
				});

				if (CheckedIn) {
					throw new Error("Already Checked In");
				}
				const result = await Worktime.create({
					userID: userID,
					date: currentDate,
					checkIn: currentTime,
				});

				return result;
			},
			// Check out
			async checkOut(root, { userID }) {
				const user = await User.findOne({ _id: userID });

				if (!user) {
					throw new Error("User not found");
				}
				const currentTime = new Date();
				const currentDate = currentTime.toISOString().slice(0, 10);
				const CheckedIn = await Worktime.findOne({
					userID: userID,
					date: currentDate,
					checkIn: { $ne: null },
				});

				if (!CheckedIn) {
					throw new Error("Not CheckedIn");
				}

				const checkedOut = await Worktime.findOne({
					userID: userID,
					date: currentDate,
					checkOut: { $ne: null },
				});

				if (checkedOut) {
					throw new Error("Already Checked Out");
				}

				const result = await Worktime.findOneAndUpdate(
					{
						userID: userID,
						date: currentDate,
					},
					{
						$set: {
							checkOut: currentTime,
						},
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
		},
	},
});

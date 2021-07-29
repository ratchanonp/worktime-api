import User from "../db/model/user.model.js";
import Worktime from "../db/model/worktime.model.js";

import { createModule, gql } from "graphql-modules";

export const userModule = createModule({
	id: "userModule",
	dirname: "user",
	typeDefs: gql`
		extend type Query {
			users: [User]
			user(_id: ID!): User
			userBylevel(level: Int!): [User]
			userByRoles(roles: [String]!): [User]
		}

		extend type Mutation {
			createUser(user: UserInput!): User
			updateUser(_id: ID!, user: UserInput!): User
			deleteUser(_id: ID!): User

			# Bulk operations
			bulkUpsertUsers(users: [UserInput]): [User]
			bulkDeleteUsers(_ids: [ID!]): [User]
		}

		enum userRoles {
			ADMIN
			DIRECTOR
			TEACHER
		}

		input UserInput {
			username: String!
			password: String!
			title: String!
			firstName: String!
			lastName: String!
			role: [String]!
			permissions: [String!]!
			isActive: Boolean!
		}

		type User {
			_id: ID!
			username: String!
			password: String!
			title: String!
			firstName: String!
			lastName: String!
			role: [String]!
			permissions: [String]!
			worktimes: [Worktime]!
			createdAt: String
			updatedAt: String
			lastlogin: String
			isActive: Boolean
		}
	`,
	resolvers: {
		Query: {
			async users() {
				return await User.find();
			},
			async user(root, { _id }) {
				return await User.findById(_id);
			},
		},
		Mutation: {
			async createUser(root, { user }) {
				return await User.create(user);
			},
			async updateUser(root, { _id, user }) {
				return await User.findByIdAndUpdate(_id, user, {
					returnOriginal: false,
				});
			},
			async deleteUser(root, { _id }) {
				return await User.findByIdAndRemove(_id);
			},
		},
		User: {
			worktimes: async (root) => {
				return await Worktime.find({ userID: root._id });
			},
		},
	},
});

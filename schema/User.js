import User from "../db/model/user.model.js";
import Worktime from "../db/model/worktime.model.js";

import { createModule, gql } from "graphql-modules";

import { AuthenticationError, ForbiddenError } from "apollo-server-express";

import jwt from "jsonwebtoken";

export const userModule = createModule({
	id: "userModule",
	dirname: "user",
	typeDefs: gql`
		extend type Query {
			users: [User]
			user(_id: ID!): User
			userBylevel(level: Int!): [User]
			userByRoles(roles: [String]!): [User]

			me: User
		}

		extend type Mutation {
			login(input: userLogin!): String

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

		input userLogin {
			username: String!
			password: String!
		}

		input UserInput {
			username: String
			password: String
			title: String
			firstName: String
			lastName: String
			role: [String]
			permissions: [String]
			isActive: Boolean
		}

		type User {
			_id: ID!
			username: String!
			password: String!
			title: String!
			firstName: String!
			lastName: String!
			fullName: String!
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
			async me(root, arg, { user }) {
				if (!user) {
					throw new AuthenticationError("Not logged in");
				}

				const { _id } = user;

				console.log(user);

				return await User.findById(_id);
			},
			async users(root, arg, { user }) {
				if (!user) {
					throw new AuthenticationError("Not logged in");
				}

				console.log(user.role);

				
				return await User.find();
			},
			async user(root, { _id }, { user }) {
				if (!user) {
					throw new AuthenticationError("Not logged in");
				}
				if( _id !== user._id || !user.role.contains("ADMIN")) {
					throw new ForbiddenError("Not allowed");
				}
				

				return await User.findById(_id);
			},
		},
		Mutation: {
			async login(root, { input }) {
				const { username, password } = input;

				const user = await User.findOne({ username: username });
				if (!user) {
					throw new Error("User not found");
				}
				if (user.password !== password) {
					throw new Error("Password is wrong");
				}

				return jwt.sign(
					{
						_id: user._id,
						role: user.role,
					},
					process.env.JWT_SECRET,
					{
						algorithm: "HS256",
						subject: process.env.JWT_SUBJECT,
						expiresIn: "1d",
					}
				);
			},

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
			fullName: async (root) => {
				return `${root.title}${root.firstName} ${root.lastName}`;
			}
		},
	},
});

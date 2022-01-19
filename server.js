import express from "express";

import { ApolloServer } from "apollo-server-express";

import { application } from "./schema/index.js";

import jwt from "express-jwt";

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const mongodb_uri = process.env.DB_URI;

(async () => {
	await mongoose.connect(mongodb_uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	});
	console.log("🟢  MongoDB");

	const app = express();

	app.use(
		jwt({
			secret: process.env.JWT_SECRET,
			algorithms: ["HS256"],
			credentialsRequired: false,
		})
	);

	const schema = application.createSchemaForApollo();

	const server = new ApolloServer({
		schema,
		context: ({ req }) => {
			const user = req.user || null;

			return { user };
		},
	});

	server.applyMiddleware({ app });

	await app.listen({ port: process.env.PORT || 4000 }, () => {
		console.log(
			`🚀  Server ready at http://localhost:4000${server.graphqlPath}`
		);
	});
})();

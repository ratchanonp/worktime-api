import express from "express";

import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginInlineTrace } from "apollo-server-core";

import { application } from "./schema/index.js";

import { createServer } from "http";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";

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

	const httpServer = createServer(app);

	const schema = application.createSchemaForApollo();

	const server = new ApolloServer({
		schema,
		tracing: true,
		plugins: [ApolloServerPluginInlineTrace()],
	});

	await server.start();
	server.applyMiddleware({ app });

	const subscriptionServer = SubscriptionServer.create(
		{
			schema,
			execute,
			subscribe,
			onConnect() {
				console.log("Connected!");
			},
			onDisconnect() {
				console.log("Disconnected!");
			},
		},
		{ server: httpServer, path: server.graphqlPath }
	);

	["SIGINT", "SIGTERM"].forEach((signal) => {
		process.on(signal, () => subscriptionServer.close());
	});

	await httpServer.listen({ port: 4000 }, () => {
		console.log(
			`🚀  Server ready at http://localhost:4000${server.graphqlPath}`
		);
	});
})();

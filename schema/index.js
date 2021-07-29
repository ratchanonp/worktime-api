import { createApplication } from "graphql-modules";
import { userModule } from "./User.js";
import { worktimeModule} from "./Worktime.js";

// This is your application, it contains your GraphQL schema and the implementation of it.
export const application = createApplication({
	modules: [userModule, worktimeModule],
});

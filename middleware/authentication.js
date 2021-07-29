// Express JWT MiddleWare

import JWT from "jsonwebtoken";

export default function (req, res, next) {
	if (req.headers.authorization) {
		const token = req.headers.authorization.split(" ")[1];
		JWT.verify(token, process.env.JWT_SECRET, (err, decoded) => {
			if (err) {
				return res.status(403).send({
					success: false,
					message: "Failed to authenticate token.",
				});
			} else {
				req.decoded = decoded;
				next();
			}
		});
	} else {
		return res.status(403).send({
			success: false,
			message: "No token provided.",
		});
	}
}

import { IncomingMessage, ServerResponse } from "http";
import { Status } from "../status";

export async function MethodNotAllowed(
	_req: IncomingMessage,
	res: ServerResponse,
): Promise<void> {
	res.writeHead(Status.MethodNotAllowed, {
		"Content-Type": "application/json",
	});
	res.end(JSON.stringify({ error: "Method not allowed." }));
}

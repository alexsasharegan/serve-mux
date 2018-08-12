import { IncomingMessage, ServerResponse } from "http";
import { Status } from "../status";

export async function PageNotFound(
	_req: IncomingMessage,
	res: ServerResponse,
): Promise<void> {
	res.statusCode = Status.NotFound;
	res.writeHead(Status.NotFound, { "Content-Type": "text/html" });
	res.end(`<p><code>404:</code> Page not found.</p>`);
}

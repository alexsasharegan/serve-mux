import { IncomingMessage, ServerResponse } from "http";

export async function FinalHandler(req:IncomingMessage, res:ServerResponse):Promise<void> {
	if (res.headersSent) {
		req.socket.destroy()
		return
	}

	if (req.unpipe()) {
		//
	}
	req.unpipe()
}

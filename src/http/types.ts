import { IncomingMessage, ServerResponse } from "http";
import { HttpError } from "./error";
import { Route } from "./mux/index";

/**
 * The HandlerFunc type is an adapter to allow the use of
 * ordinary functions as HTTP handlers. If f is a function
 * with the appropriate signature, HandlerFunc(f) is a
 * Handler that calls f.
 */
export type HandlerFunc = (
	req: IncomingMessage,
	res: ServerResponse,
	ctx: RequestContext,
) => Promise<void>;

export type ErrHandlerFunc = (
	err: Error,
	req: IncomingMessage,
	res: ServerResponse,
	ctx: RequestContext,
) => Promise<void>;

/**
 * Middleware can read the request/response to perform pre-processing
 * so as to reuse functionality across routes.
 *
 * Altering the request/response for parsing and adding variables is discouraged.
 * Middleware should add to the RequestContext object instead.
 *
 * Instead of passing a `next()` callback to middleware à la expressjs,
 * middleware is required to return a promise that resolves upon completion.
 * If middleware terminates a request early,
 * **it must invoke the `Terminate` method on the RequestContext**.
 */
export interface Middleware {
	Handle(
		req: IncomingMessage,
		res: ServerResponse,
		ctx: RequestContext,
	): Promise<void>;

	[key: string]: any;
}

/**
 * MiddlewareRunner is an object that can register and apply middleware.
 */
export interface MiddlewareRunner {
	Use(middleware: Middleware): void;
	ApplyMiddleware(
		req: IncomingMessage,
		res: ServerResponse,
		ctx: RequestContext,
	): Promise<void>;

	[key: string]: any;
}

/**
 * A Handler responds to an HTTP request.
 *
 * ServeHTTP should write reply headers and data to the ServerResponse
 * and then return.
 *
 * Except for reading the body, handlers should not modify the
 * provided Request.
 */
export interface Handler {
	ServeHTTP: HandlerFunc;

	[key: string]: any;
}

/**
 * RequestContext is an object with a null prototype
 * that serves two main purposes:
 * - it enables terminating the request early in the case of middleware
 * 	_(done via the `Terminate()` method)_
 * - it enables adding request-scoped variables to a central object
 * 	that will be passed to request handlers in the request/response lifecycle.
 */
export interface RequestContext {
	prototype: undefined;
	/**
	 * Terminate is a mechanism to end a request/response cycle early.
	 * This is for Middleware
	 */
	Terminate(): void;
	IsTerminated(): boolean;
	[key: string]: any;
}

export type MatcherType = "Router" | "Method" | "Path" | "Header" | "Host";
export interface Matcher {
	Match(req: IncomingMessage, match: RouteMatch, ctx: RequestContext): boolean;

	[key: string]: any;
}

export interface RouteMatch extends MiddlewareRunner {
	Route: Route;
	Handler: HandlerFunc;
	Vars: { [key: string]: string };
	MatchErr: HttpError | null;
}

export interface ParentRoute {
	getBuildScheme(): string;
	getNamedRoutes(): { [key: string]: Route };
	getRegexpGroup(): RouteRegexpGroup | null;
	buildVars(map: { [key: string]: string }): { [key: string]: string };
}

export interface Path {
	//
}

export interface RouteRegexpGroup {
	host: RouteRegexp;
	path: RouteRegexp;
	queries: RouteRegexp[];
}

interface RouteRegexp {
	// The unmodified template.
	template: string;
	// True for host match, false for path or query string match.
	matchHost: boolean;
	// True for query string match, false for path and host match.
	matchQuery: boolean;
	// The strictSlash value defined on the route, but disabled if PathPrefix was used.
	strictSlash: boolean;
	// Determines whether to use encoded req.URL.EscapedPath() or unencoded
	// req.URL.Path for path matching
	useEncodedPath: boolean;
	// Expanded regexp.
	regexp: RegExp;
	// Reverse template.
	reverse: string;
	// Variable names.
	varsN: string[];
	// Variable regexps (validators).
	varsR: RegExp[];
}
export type HttpMethod =
	| "ACL"
	| "BIND"
	| "CHECKOUT"
	| "CONNECT"
	| "COPY"
	| "DELETE"
	| "GET"
	| "HEAD"
	| "LINK"
	| "LOCK"
	| "M-SEARCH"
	| "MERGE"
	| "MKACTIVITY"
	| "MKCALENDAR"
	| "MKCOL"
	| "MOVE"
	| "NOTIFY"
	| "OPTIONS"
	| "PATCH"
	| "POST"
	| "PROPFIND"
	| "PROPPATCH"
	| "PURGE"
	| "PUT"
	| "REBIND"
	| "REPORT"
	| "SEARCH"
	| "SUBSCRIBE"
	| "TRACE"
	| "UNBIND"
	| "UNLINK"
	| "UNLOCK"
	| "UNSUBSCRIBE";

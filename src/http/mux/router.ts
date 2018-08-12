import { IncomingMessage, ServerResponse, IncomingHttpHeaders } from "http";
import { Route } from "./route";
import { MethodNotAllowed, PageNotFound } from "../handler";
import { Server } from "net";
import { format } from "util";
import { Status } from "../status";
import { Bind } from "../../util/bind";
import {
	HttpMethod,
	Middleware,
	HandlerFunc,
	RequestContext,
	ErrHandlerFunc,
	RouteMatch,
	ParentRoute,
	RouteRegexpGroup,
} from "../types";

export function NewRouter(): Router {
	return new Router();
}

export class Router {
	// 🌎 Public
	public MethodNotAllowedHandler: HandlerFunc = MethodNotAllowed;
	public NotFoundHandler: HandlerFunc = PageNotFound;
	public InternalServerErrHandler: ErrHandlerFunc =
		Router.InternalServerErrHandler;
	// ⚠️ Private
	private parentRoute: ParentRoute | null = null;
	private routes: Route[] = [];
	private middleware: Middleware[] = [];
	private namedRoutes: { [key: string]: Route } = Object.create(null);
	private buildScheme: string = "";
	private strictSlash: boolean = false;
	// private skipClean: boolean = false

	public static async InternalServerErrHandler(
		err: Error,
		_req: IncomingMessage,
		res: ServerResponse,
	) {
		if (res.headersSent) {
			res.end();
			return;
		}

		res.writeHead(Status.InternalServerError, err.message);
		res.end();
	}

	public Listen(server: Server, https: boolean = false) {
		server.on("request", this.ServeHTTP);
		server.on("error", this.HandleError);
		server.on("close", this.Shutdown);
		server.on("listening", () => {
			let { address, family, port } = server.address();
			console.info(
				format(
					`Listening on http%s://%s:%d [%s]`,
					https ? "s" : "",
					address,
					port,
					family,
				),
			);
		});
	}

	/**
	 * ServeHTTP dispatches the handler registered in the matched route.
	 *
	 * When there is a match, the route variables can be retrieved calling mux.Vars(request).
	 */
	@Bind
	public async ServeHTTP(
		req: IncomingMessage,
		res: ServerResponse,
	): Promise<void> {
		let match = NewRouteMatch();
		let ctx = NewRequestContext();

		if (!this.Match(req, match, ctx)) {
			this.NotFoundHandler(req, res, ctx);
			return;
		}

		if (
			match.MatchErr != null &&
			match.MatchErr.code == Status.MethodNotAllowed
		) {
			this.MethodNotAllowedHandler(req, res, ctx);
			return;
		}

		try {
			await this.ApplyMiddleware(req, res, ctx);
			if (ctx.IsTerminated) {
				return;
			}

			await match.ApplyMiddleware(req, res, ctx);
			if (ctx.IsTerminated) {
				return;
			}

			match.Handler(req, res, ctx);
		} catch (err) {
			this.InternalServerErrHandler(err, req, res, ctx);
		}
	}

	public Use(middleware: Middleware): void {
		this.middleware.push(middleware);
	}

	public async ApplyMiddleware(
		req: IncomingMessage,
		res: ServerResponse,
		ctx: RequestContext,
	): Promise<void> {
		let mw: Middleware;
		for (mw of this.middleware) {
			await mw.Handle(req, res, ctx);
			if (ctx.IsTerminated) {
				return;
			}
		}
	}

	/**
	 * Match attempts to match the given request against the router's registered routes.
	 *
	 * If the request matches a route of this router or one of its subrouters the Route,
	 * Handler, and Vars fields of the the match argument are filled and this function
	 * returns `true`.
	 *
	 * If the request does not match any of this router's or its subrouters' routes
	 * then this function returns `false`. If available, a reason for the match failure
	 * will be filled in the match argument's MatchErr field. If the match failure type
	 * (eg: not found) has a registered handler, the handler is assigned to the Handler
	 * field of the match argument.
	 *
	 * @see RouteMatch
	 */
	public Match(
		req: IncomingMessage,
		match: RouteMatch,
		ctx: RequestContext,
	): boolean {
		for (const route of this.routes) {
			if (route.Match(req, match, ctx)) {
				return true;
			}
		}

		return false;
	}

	@Bind
	public HandleError(err: Error): void {
		if (process.env.NODE_ENV == "production") {
			console.error(err);
		}
	}

	/**
	 * StrictSlash defines the trailing slash behavior for new routes. The initial value is false.
	 *
	 * When true, if the route path is `/path/`, accessing `/path` will redirect
	 * to the former and vice versa. In other words, your application will always
	 * see the path as specified in the route.
	 *
	 * When false, if the route path is `/path`, accessing `/path/` will not match
	 * this route and vice versa.
	 *
	 * Special case: when a route sets a path prefix using the PathPrefix() method,
	 * strict slash is ignored for that route because the redirect behavior can't
	 * be determined from a prefix alone. However, any subrouters created from that
	 * route inherit the original StrictSlash setting.
	 */
	public StrictSlash(value: boolean): void {
		this.strictSlash = value;
	}

	/**
	 * Handle registers a new route with a matcher for the URL path.
	 */
	public Handle(tpl: string, handler: HandlerFunc): Route {
		return this.NewRoute()
			.Path(tpl)
			.Handler(handler);
	}

	// Queries(...pairs: string[]): Route
	// SkipClean(value: boolean): Router
	// UseEncodedPath(): Router

	/**
	 * Headers adds a matcher for request header values.
	 * It accepts a sequence of key/value pairs to be matched. For example:
	 * ```js
	 * let r = mux.NewRouter()
	 * r.Headers({
	 *  "Content-Type": "application/json",
	 *  "X-Requested-With": "XMLHttpRequest"
	 * })
	 * ```
	 * The above route will only match if both request header values match.
	 * If the value is an empty string, it will match any value if the key is set.
	 */
	public Headers(headers: IncomingHttpHeaders): Route {
		return this.NewRoute().Headers(headers);
	}

	/**
	 * Host adds a matcher for the URL host.
	 * It accepts a template with zero or more URL variables enclosed by {}.
	 * Variables can define an optional regexp pattern to be matched:
	 * - {name} matches anything until the next dot.
	 * - {name:pattern} matches the given regexp pattern.
	 * For example:
	 * ```js
	 * r = mux.NewRouter()
	 * r.Host("www.example.com")
	 * r.Host("{subdomain}.domain.com")
	 * r.Host("{subdomain:[a-z]+}.domain.com")
	 * ```
	 * Variable names must be unique in a given route. They can be retrieved
	 * calling mux.Vars(request).
	 */
	public Host(tpl: string): Route {
		return this.NewRoute().Host(tpl);
	}

	/**
	 * Path adds a matcher for the URL path.
	 * It accepts a template with zero or more URL variables enclosed by {}. The
	 * template must start with a "/".
	 * Variables can define an optional regexp pattern to be matched:
	 * - {name} matches anything until the next slash.
	 * - {name:pattern} matches the given regexp pattern.
	 * For example:
	 * ```js
	 * r = mux.NewRouter()
	 * r.Path("/products/").Handler(ProductsHandler)
	 * r.Path("/products/{key}").Handler(ProductsHandler)
	 * r.Path("/articles/{category}/{id:[0-9]+}").Handler(ArticleHandler)
	 * ```
	 * Variable names must be unique in a given route. They can be retrieved calling mux.Vars(request).
	 */
	public Path(tpl: string): Route {
		return this.NewRoute().Path(tpl);
	}

	/**
	 * PathPrefix adds a matcher for the URL path prefix. This matches if the given
	 * template is a prefix of the full URL path. See Route.Path() for details on
	 * the tpl argument.
	 *
	 * Note that it does not treat slashes specially ("/foobar/" will be matched by
	 * the prefix "/foo") so you may want to use a trailing slash here.
	 *
	 * Also note that the setting of Router.StrictSlash() has no effect on routes with a PathPrefix matcher.
	 */
	public PathPrefix(tpl: string): Route {
		return this.NewRoute().PathPrefix(tpl);
	}

	/**
	 * Methods registers a new route with a matcher for HTTP methods.
	 * @see Route.Methods
	 */
	public Methods(...methods: HttpMethod[]): Route {
		return this.NewRoute().Methods(...methods);
	}

	/**
	 * NewRoute registers an empty route.
	 */
	public NewRoute(): Route {
		let r = new Route(this);
		this.routes.push(r);
		return r;
	}

	public getBuildScheme() {
		if (!this.parentRoute) {
			return this.buildScheme;
		}
		return this.parentRoute.getBuildScheme();
	}
	public getRegexpGroup(): RouteRegexpGroup | null {
		if (!this.parentRoute) {
			return null;
		}
		return this.parentRoute.getRegexpGroup();
	}
	public getNamedRoutes(): { [key: string]: Route } {
		return this.namedRoutes;
	}
	public buildVars(map: { [key: string]: string }): { [key: string]: string } {
		return map;
	}

	@Bind
	public Shutdown(): void {
		console.info("Shutting down.");
	}
}

export function NewRouteMatch(): RouteMatch {
	let m: RouteMatch = Object.create(null);
	m.Vars = Object.create(null);
	m.MatchErr = null;
	m.ApplyMiddleware = async () => undefined;

	return m;
}

export function NewRequestContext(): RequestContext {
	let terminated = false;

	return Object.defineProperties(Object.create(null), {
		IsTerminated: {
			configurable: false,
			enumerable: true,
			get() {
				return terminated;
			},
			set: undefined,
		},
		Terminate: {
			configurable: false,
			enumerable: false,
			writable: false,
			value() {
				terminated = true;
			},
		},
	});
}

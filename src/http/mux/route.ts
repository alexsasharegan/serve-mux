import { IncomingMessage, IncomingHttpHeaders, ServerResponse } from "http";
import { Router } from "./router";
import {
	HandlerFunc,
	HttpMethod,
	RouteMatch,
	Matcher,
	Middleware,
	RequestContext,
	ParentRoute,
	RouteRegexpGroup,
} from "../types";
import { HttpError } from "../error";
import { Status } from "../status";
import { hasOwn } from "../../util/object";

export class Route {
	/**
	 * Request handler for the route.
	 */
	public handler: HandlerFunc;

	private matchers: Matcher[] = [];
	private middleware: Middleware[] = [];
	private buildScheme: string = "";
	private regexp: RouteRegexpGroup | null = null;
	/**
	 * If true, when the path pattern is "/path/", accessing "/path" will
	 * redirect to the former and vice versa.
	 */
	private strictSlash: boolean = false;
	/**
	 * If true, when the path pattern is "/path//to", accessing "/path//to" will not redirect
	 */
	private skipClean: boolean = false;

	constructor(private parentRoute: ParentRoute) {}

	public Handler(h: HandlerFunc): Route {
		this.handler = h;
		return this;
	}

	/**
	 * Match matches the route against the request.
	 */
	public Match(
		req: IncomingMessage,
		match: RouteMatch,
		ctx: RequestContext,
	): boolean {
		let m: Matcher;

		for (m of this.matchers) {
			if (!m.Match(req, match, ctx)) {
				if (m.Type == "Method") {
					// Method matchers write an error to the match
					continue;
				}
				match.MatchErr = null;
				return false;
			}
		}

		if (match.MatchErr != null) {
			return false;
		}

		if (!match.Vars) {
			match.Vars = Object.create(null);
		}
		match.Route = this;
		match.Handler = this.handler;
		match.ApplyMiddleware = this.ApplyMiddleware.bind(this);

		return true;
	}

	public SubRouter(): Router {
		let sr = new Router();
		this.matchers.push(sr);
		return sr;
	}

	public Use(middleware: Middleware) {
		this.middleware.push(middleware);
	}

	public async ApplyMiddleware(
		req: IncomingMessage,
		res: ServerResponse,
		ctx: RequestContext,
	) {
		let mw: Middleware;
		for (mw of this.middleware) {
			await mw.Handle(req, res, ctx);
			if (ctx.IsTerminated) {
				return;
			}
		}
	}

	public Methods(...methods: HttpMethod[]): Route {
		this.matchers.push({
			Type: "Method",
			Match(req: IncomingMessage, match: RouteMatch) {
				let m: HttpMethod;
				for (m of methods) {
					if (m == req.method) {
						return true;
					}
				}
				match.MatchErr = new HttpError(
					Status.MethodNotAllowed,
					"method not allowed",
				);

				return false;
			},
		});

		return this;
	}
	/**
	 * Path adds a matcher for the URL path.
	 * It accepts a template with zero or more URL variables prefixed width `:`.
	 * The template must start with a "/".
	 *
	 * For example:
	 * ```js
	 * r = mux.NewRouter()
	 * r.Path("/products/").Handler(ProductsHandler)
	 * r.Path("/products/:key").Handler(ProductsHandler)
	 * r.Path("/articles/:category/:id").Handler(ArticleHandler)
	 * ```
	 * Variable names must be unique in a given route. They can be retrieved calling mux.Vars(request).
	 */
	public Path(tpl: string): Route {
		if (tpl.indexOf("/") != 0) {
			throw new TypeError(`Path template must begin with a '/'`);
		}

		this.matchers.push({
			Type: "Path",
			Match(req: IncomingMessage, _match: RouteMatch, _ctx: RequestContext) {
				return req.url == tpl;
			},
		});

		return this;
	}

	public PathPrefix(tpl: string): Route {
		if (tpl.indexOf("/") != 0) {
			throw new TypeError(`Path template must begin with a '/'`);
		}

		this.matchers.push({
			Type: "Path",
			Match(req: IncomingMessage, _match: RouteMatch, _ctx: RequestContext) {
				if (!req.url) {
					return false;
				}

				return req.url.indexOf(tpl) == 0;
			},
		});

		return this;
	}

	public Headers(headers: IncomingHttpHeaders): Route {
		this.matchers.push({
			Type: "Method",
			Match(req: IncomingMessage, _match: RouteMatch, _ctx: RequestContext) {
				let k: keyof IncomingHttpHeaders;
				for (k in Object.keys(headers)) {
					if (!hasOwn(req.headers, k)) {
						return false;
					}
					if (req.headers[k] != headers[k]) {
						return false;
					}
				}

				return true;
			},
		});

		return this;
	}

	public Host(tpl: string): Route {
		this.matchers.push({
			Type: "Host",
			Match(req: IncomingMessage, _match: RouteMatch, _ctx: RequestContext) {
				return req.headers.host == tpl;
			},
		});

		return this;
	}

	public addRegexpMatcher(
		tpl: string,
		matchHost: boolean,
		matchPrefix: boolean,
		matchQuery: boolean,
	): Error | null {
		// if this.err != null {
		// 	return this.err
		// }
		this.regexp = this.getRegexpGroup();
		if (!this.regexp) {
			throw new Error("💥");
		}
		if (!matchHost && !matchQuery) {
			if (tpl.length > 0 && tpl[0] !== "/") {
				return new Error(`mux: path must start with a slash, got ${tpl}`);
			}
			if (this.regexp.path != null) {
				tpl = trimEnd(this.regexp.path.template, "/") + tpl;
			}
		}
		// rr, err = newRouteRegexp(tpl, matchHost, matchPrefix, matchQuery, this.strictSlash)
		// if err != null {
		// 	return err
		// }
		// for _, q := range this.regexp.queries {
		// 	if err = uniqueVars(rr.varsN, q.varsN); err != null {
		// 		return err
		// 	}
		// }
		// if matchHost {
		// 	if this.regexp.path != null {
		// 		if err = uniqueVars(rr.varsN, this.regexp.path.varsN); err != null {
		// 			return err
		// 		}
		// 	}
		// 	this.regexp.host = rr
		// } else {
		// 	if this.regexp.host != null {
		// 		if err = uniqueVars(rr.varsN, this.regexp.host.varsN); err != null {
		// 			return err
		// 		}
		// 	}
		// 	if matchQuery {
		// 		this.regexp.queries = append(this.regexp.queries, rr)
		// 	} else {
		// 		this.regexp.path = rr
		// 	}
		// }
		// this.addMatcher(rr)
		return null;
	}

	public getRegexpGroup() {
		if (!this.regexp) {
			let regexp: RouteRegexpGroup | null = this.parentRoute.getRegexpGroup();
			if (regexp == null) {
				this.regexp = Object.create(null);
			} else {
				this.regexp = Object.assign(Object.create(null), regexp);
			}
		}
		return this.regexp;
	}

	public getBuildScheme() {
		return this.parentRoute.getBuildScheme() + this.buildScheme;
	}

	// buildVarsFunc: BuildVarsFunc
}

import { Router, NewRouter } from "./router";

it("NewRouter should return instance of Router", () => {
	expect(NewRouter()).toBeInstanceOf(Router);
});

it("MethodNotAllowedHandler should implement HandlerFunc", () => {
	//
});

it("NotFoundHandler should implement HandlerFunc", () => {
	//
});

it("InternalServerErrHandler should implement ErrHandlerFunc", () => {
	//
});

it("parentRoute should work", () => {
	//
});

it("routes should work", () => {
	//
});

it("middleware should work", () => {
	//
});

it("namedRoutes should work", () => {
	//
});

it("buildScheme should work", () => {
	//
});

it("strictSlash should work", () => {
	//
});

/**
 * newRouteRegexp parses a route template and returns a routeRegexp,
 * used to match a host, a path or a query string.
 *
 * It will extract named variables, assemble a regexp to be matched, create
 * a "reverse" template to build URLs and compile regexps to validate variable
 * values used in URL building.
 *
 * Previously we accepted only Python-like identifiers for variable
 * names (`[a-zA-Z_][a-zA-Z0-9_]*`), but currently the only restriction is that
 * name and pattern can't be empty, and names can't contain a colon.
 */
export class RouteRegExp {
	// The unmodified template.
	private template: string;
	// True for host match, false for path or query string match.
	private matchHost: boolean;
	// True for query string match, false for path and host match.
	private matchQuery: boolean;
	// The strictSlash value defined on the route, but disabled if PathPrefix was used.
	private strictSlash: boolean;
	// Determines whether to use encoded req.URL.EscapedPath() or unencoded
	// req.URL.Path for path matching
	private useEncodedPath: boolean;
	// Expanded regexp.
	private regexp: RegExp;
	// Reverse template.
	private reverse: string;
	// Variable names.
	private varsN: string[];
	// Variable regexps (validators).
	private varsR: RegExp[];

	constructor(
		tpl: string,
		matchHost: boolean,
		matchPrefix: boolean,
		matchQuery: boolean,
		strictSlash: boolean,
	) {
		// Check if it is well-formed.
		// idxs, errBraces := braceIndices(tpl)
		// if errBraces != nil {
		// 	return nil, errBraces
		// }
		// // Backup the original.
		// template := tpl
		// // Now let's parse it.
		// defaultPattern := "[^/]+"
		// if matchQuery {
		// 	defaultPattern = ".*"
		// } else if matchHost {
		// 	defaultPattern = "[^.]+"
		// 	matchPrefix = false
		// }
		// // Only match strict slash if not matching
		// if matchPrefix || matchHost || matchQuery {
		// 	strictSlash = false
		// }
		// // Set a flag for strictSlash.
		// endSlash := false
		// if strictSlash && strings.HasSuffix(tpl, "/") {
		// 	tpl = tpl[:len(tpl)-1]
		// 	endSlash = true
		// }
		// varsN := make([]string, len(idxs)/2)
		// varsR := make([]*regexp.Regexp, len(idxs)/2)
		// pattern := bytes.NewBufferString("")
		// pattern.WriteByte('^')
		// reverse := bytes.NewBufferString("")
		// var end int
		// var err error
		// for i := 0; i < len(idxs); i += 2 {
		// 	// Set all values we are interested in.
		// 	raw := tpl[end:idxs[i]]
		// 	end = idxs[i+1]
		// 	parts := strings.SplitN(tpl[idxs[i]+1:end-1], ":", 2)
		// 	name := parts[0]
		// 	patt := defaultPattern
		// 	if len(parts) == 2 {
		// 		patt = parts[1]
		// 	}
		// 	// Name or pattern can't be empty.
		// 	if name == "" || patt == "" {
		// 		return nil, fmt.Errorf("mux: missing name or pattern in %q",
		// 			tpl[idxs[i]:end])
		// 	}
		// 	// Build the regexp pattern.
		// 	fmt.Fprintf(pattern, "%s(?P<%s>%s)", regexp.QuoteMeta(raw), varGroupName(i/2), patt)
		// 	// Build the reverse template.
		// 	fmt.Fprintf(reverse, "%s%%s", raw)
		// 	// Append variable name and compiled pattern.
		// 	varsN[i/2] = name
		// 	varsR[i/2], err = regexp.Compile(fmt.Sprintf("^%s$", patt))
		// 	if err != nil {
		// 		return nil, err
		// 	}
		// }
		// // Add the remaining.
		// raw := tpl[end:]
		// pattern.WriteString(regexp.QuoteMeta(raw))
		// if strictSlash {
		// 	pattern.WriteString("[/]?")
		// }
		// if matchQuery {
		// 	// Add the default pattern if the query value is empty
		// 	if queryVal := strings.SplitN(template, "=", 2)[1]; queryVal == "" {
		// 		pattern.WriteString(defaultPattern)
		// 	}
		// }
		// if !matchPrefix {
		// 	pattern.WriteByte('$')
		// }
		// reverse.WriteString(raw)
		// if endSlash {
		// 	reverse.WriteByte('/')
		// }
		// // Compile full regexp.
		// reg, errCompile := regexp.Compile(pattern.String())
		// if errCompile != nil {
		// 	return nil, errCompile
		// }
		// // Check for capturing groups which used to work in older versions
		// if reg.NumSubexp() != len(idxs)/2 {
		// 	panic(fmt.Sprintf("route %s contains capture groups in its regexp. ", template) +
		// 		"Only non-capturing groups are accepted: e.g. (?:pattern) instead of (pattern)")
		// }
		// // Done!
		// return &routeRegexp{
		// 	template:       template,
		// 	matchHost:      matchHost,
		// 	matchQuery:     matchQuery,
		// 	strictSlash:    strictSlash,
		// 	useEncodedPath: useEncodedPath,
		// 	regexp:         reg,
		// 	reverse:        reverse.String(),
		// 	varsN:          varsN,
		// 	varsR:          varsR,
		// }, nil
	}
}

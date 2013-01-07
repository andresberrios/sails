var express = require('express');
var ejs = require('ejs');
var _ = require('underscore');

// Configure express server
exports.configure = function configure() {

	// Define housing object for Express in the Sails namespace
	sails.express = {};

	// Configure express HTTP server
	sails.config.express.serverOptions ? 
		sails.express.app = express.createServer(sails.config.express.serverOptions)
	:	sails.express.app = express.createServer();

	sails.express.app.enable("jsonp callback");
	sails.express.app.configure(function() {
		sails.express.app.set('views', sails.config.viewPath);
		sails.express.app.set('view engine', sails.config.viewEngine);
		sails.express.app.set('view options', {
			layout: sails.config.layout
		});

		if(sails.config.express.bodyParser) {
			sails.express.app.use(sails.config.express.bodyParser);
		}

		if(sails.config.environment === 'development') {
			// Allow access to static dirs
			sails.express.app.use(express['static'](sails.config.staticPath));

			// Allow access to compiled and uncompiled rigging directories
			sails.express.app.use('/rigging_static', express['static'](sails.config.rigging.outputPath));
			_.each(sails.config.rigging.sequence, function(item) {
				sails.express.app.use('/rigging_static', express['static'](item));
			});

			// Set up error handling
			sails.express.app.use(express.errorHandler({
				dumpExceptions: true,
				showStack: true
			}));

		} else if(sails.config.environment === 'production') {
			var oneYear = sails.config.cache.maxAge;
			sails.express.app.use(express['static'](sails.config.staticPath, {
				maxAge: oneYear
			}));
			sails.express.app.use('/rigging_production', express['static'](sails.config.rigging.outputPath, {
				maxAge: oneYear
			}));

			// ignore errors
			sails.express.app.use(express.errorHandler());
		}

		if(sails.config.express.cookieParser) {
			sails.express.app.use(sails.config.express.cookieParser);
		}

		// Connect session to express
		sails.express.app.use(express.session(sails.config.session));

		// Add annoying Sails header instead of annoying Express header
		sails.express.app.use(function(req, res, next) {
			res.header("X-Powered-By", 'Sails <sailsjs.org>)');
			next();
		});

		// Allow usage of custom express middleware
		if(sails.config.express.customMiddleware) {
			sails.config.express.customMiddleware(sails.express.app);
		}

		// Allow full REST simulation for clients which don't support it natively
		// (by using _method parameter)
		if(sails.config.express.methodOverride) {
			sails.express.app.use(sails.config.express.methodOverride);
		}

		// Set up express router
		sails.express.app.use(sails.express.app.router);
	});

	// By convention, serve .json files using the ejs engine
	sails.express.app.register('.json', ejs);
}
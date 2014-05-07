var index = require(__dirname + '/controllers/index')
    , user = require(__dirname + '/controllers/user')
    , dashboard = require(__dirname + '/controllers/dashboard')
    , user = require(__dirname + '/controllers/user')
    , application = require(__dirname + '/controllers/application')
    , bakbakjs = require(__dirname + '/controllers/bakbakjs');

module.exports = function(app) {
	app.get('/', index.index);
	app.get('/dashboard',user.authenticated,dashboard.index);
	app.get('/login',user.login);
	app.post('/application/create',user.authenticated,application.create);
	app.get('/application/create',user.authenticated,application.create);
	app.get('/application/edit',user.authenticated,application.edit);
	app.get('/application',user.authenticated,application.index);
	app.get('/application/offline',user.authenticated,application.offline);
	app.get('/user',user.authenticated,user.index);	
	app.get('/user/logout',user.authenticated,user.logout);	
	app.get('/js/bakbak.js',bakbakjs.index);	
}
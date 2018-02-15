const routes = require('./bitcoin_routes');

//export the routes to server
module.exports = function(app, db){
	routes(app, db);
}
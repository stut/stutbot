// var fs = require('fs');
// var sqlite = require('../lib/sqlite/sqlite');
// var db = new sqlite.Database();

// Simple logging
// var logging = false;
// var log = function(what) { if (logging) console.log(what); }
// exports.enableLogging = function(enabled) { logging = enabled; }

// var statementSelect = null;
// var statementUpdate = null;
// var statementDelete = null;

// Gets the specified key, callback(error, value)
exports.get = function(mod, key, callback, counter) {
	callback(null);
	// var fullkey = mod + '_' + key;
	// log('Getting "' + fullkey + '"');
	// if (statementSelect == null) {
	// 	if (counter > 5) {
	// 		callback('Timed out waiting for init to complete');
	// 	} else {
	// 		counter = (counter == undefined ? 1 : counter + 1);
	// 		log('Select statement not ready (' + counter + ')');
	// 		setTimeout(function() { exports.get(mod, key, callback, counter); }, 1000);
	// 	}
	// } else {
	// 	statementSelect.bindArray([fullkey], function() {
	// 		statementSelect.fetchAll(function(error, rows) {
	// 			if (error) {
	// 				callback(error.message);
	// 			} else {
	// 				var retval = null;
	// 				if (rows.length > 0) {
	// 					retval = rows[0].v;
	// 				}
	// 				statementSelect.reset();
	// 				callback(null, retval);
	// 			}
	// 		});
	// 	});
	// }
}

// Sets the specified key, callback(error)
exports.set = function(mod, key, val, callback, counter) {
	callback(null);
	// var fullkey = mod + '_' + key;
	// log('Setting "' + fullkey + '" to "' + val + '"');
	// if (statementUpdate == null) {
	// 	if (counter > 5) {
	// 		callback('Timed out waiting for init to complete');
	// 	} else {
	// 		counter = (counter == undefined ? 1 : counter + 1);
	// 		log('Update statement not ready (' + counter + ')');
	// 		setTimeout(function() { exports.set(mod, key, val, callback, counter); }, 1000);
	// 	}
	// } else {
	// 	statementUpdate.bindArray([fullkey, val.toString()], function() {
	// 		statementUpdate.step(function(error, row) {
	// 			if (error) {
	// 				callback(error.message);
	// 			} else {
	// 				statementUpdate.reset();
	// 				callback(null);
	// 			}
	// 		});
	// 	});
	// }
}

// Deletes the specified key, callback(error)
exports.del = function(mod, key, callback, counter) {
	callback(null);
	// var fullkey = mod + '_' + key;
	// log('Deleting "' + fullkey + '"');
	// if (statementDelete == null) {
	// 	if (counter > 5) {
	// 		callback('Timed out waiting for init to complete');
	// 	} else {
	// 		counter = (counter == undefined ? 1 : counter + 1);
	// 		log('Delete statement not ready (' + counter + ')');
	// 		setTimeout(function() { exports.set(mod, key, callback, counter); }, 1000);
	// 	}
	// } else {
	// 	statementDelete.bindArray([fullkey], function() {
	// 		statementDelete.step(function(error, row) {
	// 			if (error) {
	// 				callback(error.message);
	// 			} else {
	// 				statementDelete.reset();
	// 				callback(null);
	// 			}
	// 		});
	// 	});
	// }
}

// Initialise the DB, callback(error)
exports.init = function(db_filename, callback) {
	callback(null);
	// fs.stat(db_filename, function(is_new, stats) {
	// 	db.open(db_filename, function (error) {
	// 		if (error) {
	// 			callback(error.message);
	// 		} else {
	// 			if (is_new) {
	// 				// Got an error from fstat. Assume the file didn't exist, so now init the schema
	// 				initSchema(function(error) {
	// 					if (error) {
	// 						callback(error);
	// 					} else {
	// 						// Now try preparing the statements again
	// 						prepareStatements(function(error, which_statement) {
	// 							if (error) {
	// 								callback(error);
	// 							} else {
	// 								// Yay, we're done
	// 								callback(null);
	// 							}
	// 						});
	// 					}
	// 				});
	// 			} else {
	// 				prepareStatements(function(error, which_statement) {
	// 					if (error) {
	// 						callback(error);
	// 					} else {
	// 						// Yay, we're done
	// 						callback(null);
	// 					}
	// 				});
	// 			}
	// 		}
	// 	});
	// });
}

var initSchema = function(callback) {
	callback(null);
	// log('Initialising schema');
	// db.executeScript('CREATE TABLE state (k varchar(50) primary key, v varchar(250));' +
	// 	'INSERT INTO state VALUES ("schema version", "0");', function (error) {
	// 		if (error) {
	// 			callback(error.message);
	// 		} else {
	// 			// Done
	// 			callback(null);
	// 		}
	// 	});
}

var prepareStatements = function(callback) {
	callback(null);
	// // Prepare the statements this module uses
	// log('Preparing statements');
	// db.prepare('SELECT v FROM state WHERE k = ?', function (error, statement) {
	// 	if (error) {
	// 		callback(error.message, 'select');
	// 	} else {
	// 		statementSelect = statement;

	// 		db.prepare('INSERT OR REPLACE INTO state (k, v) VALUES (?, ?)', function (error, statement) {
	// 			if (error) {
	// 				callback(error.message, 'insert');
	// 			} else {
	// 				statementUpdate = statement;

	// 				db.prepare('DELETE FROM state WHERE k = ?', function (error, statement) {
	// 					if (error) {
	// 						callback(error.message, 'delete');
	// 					} else {
	// 						statementDelete = statement;

	// 						// All done
	// 						callback(null, null);
	// 					}
	// 				});
	// 			}
	// 		});
	// 	}
	// });
}

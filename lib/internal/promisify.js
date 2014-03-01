/* Takes an object with a bunch of fns on it, and returns an object with
 * promisified versions of those functions */
module.exports = function (object) {
	var promise = {};
	for(var fn in object) {
		promise[fn] = function () {
			var deferred = when.defer();
			var args = Array.prototype.slice.call(arguments, 0);
			args.push(function (err, result) {
				if(err) {
					deferred.reject(err);
				}
				else {
					deferred.resolve(result);
				}
			});
			object[fn](args)
			return deferred.promise;
		}
	};
	return promise;
}
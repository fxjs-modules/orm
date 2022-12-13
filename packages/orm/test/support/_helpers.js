exports.lowerCaseColumn = function (column) {
  const newCol = {}
  Object.entries(column).forEach(function ([key, value]) {
      newCol[key.toLocaleLowerCase()] = value;
      return newCol;
  });
  return newCol;
}

exports.runProcAndCatch = function (proc) {
	let errMsg = '';
	let error = null;

	try {
		proc();
	} catch (e) {
		error = e;
		errMsg = e.message;
	}

	return { errMsg, error }
}
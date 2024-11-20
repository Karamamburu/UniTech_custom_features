function Log(message, ex) {
    if(ex == null || ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Exception: ' + ex));
    }
}

EnableLog(Param.log_file_name, true);

Log("Начало работы агента");

counter = 0


function getDataFromConstants(lib, method, param) {
    _data = tools.call_code_library_method(lib, method, [param])
    return _data
}

function getReadableFullDate(date) {
    _day = Day(date)
    _month = Month(date)
    _year = Year(date)
    _monthsArray = getDataFromConstants("get_constants", "getMonthsArray")
    _monthName = _monthsArray[_month - 1]; 
    _readableFullDate = _day + " " + _monthName + " " + _year + " года"

    return _readableFullDate
}

function getReadableShortDate(date) {
    _fullDate = getReadableFullDate(date)
    _fullDateArray = _fullDate.split(" ")
    _readableShortDate = _fullDateArray[0] + " " +  _fullDateArray[1]

    return _readableShortDate
}

function normalizeString(word) {
	_lowerCaseWord = StrLowerCase(word);
	_wordWithoutApostrof = StrReplace(_lowerCaseWord, "'", "");
	_firstLetter = _wordWithoutApostrof.slice(0, 1);
	_capitalizedFirstLetter = StrUpperCase(_firstLetter);

	return _capitalizedFirstLetter + _wordWithoutApostrof.slice(1);
}

function getReadableShortName(fullname) {
	_fullnameStr = '' + fullname
	_fullnameArray = _fullnameStr.split(" ")
	_newFullnameArray = []

	for (string in _fullnameArray) {
		_newFullnameArray.push(normalizeString(string))
	}

	_name = _newFullnameArray[1]
	_lastName = _newFullnameArray[0]
	_readableShortName = _name + " " + _lastName 

	return _readableShortName
}

function getOnlyName(fullname) {
    return getReadableShortName(fullname).split(" ")[0]
}

function getOnlyCyrillicName(fullname) {
    _name = getOnlyName(fullname)
    _namesMapObject = getDataFromConstants("get_constants", "getNamesMapObject")
    //_cyrillicName = _namesMapObject.HasProperty(_name) ? _namesMapObject[_name] : _name
    //counter++

    if (_namesMapObject.HasProperty(_name)) {
        _cyrillicName = _namesMapObject[_name]
        counter++
    } else {
        _cyrillicName = _name
    }

    return _cyrillicName
}

queryOfficeCols = "sql:
                        SELECT fullname
                        FROM collaborators
                        WHERE position_parent_name IN (
                            'RSC (Restaurants Support Center)', 
                            'FZ_RSC (Restaurants Support Center)'
                        )
"
officeCols = ArraySelectAll(XQuery(queryOfficeCols))

Log("Всего офисных сотрудников: " + ArrayCount(officeCols))

for (col in officeCols) {
    cyrName = getOnlyCyrillicName(col.fullname)
}

percentage = Math.round(OptReal(counter) * 100 / OptReal(ArrayCount(officeCols)))
Log(DataType(counter))
Log(DataType(ArrayCount(officeCols)))
Log("counter: " + counter + ", ArrayCount: " + ArrayCount(officeCols));
Log("Справочник позволяет русифицировать " + counter + " имён")
Log("Это " + percentage + "% от общего числа")



Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
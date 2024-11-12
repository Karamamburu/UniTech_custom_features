function getReadableShortDate(date) {
    _monthsArray = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

    _day = Day(date)
    _month = Month(date)
    _monthName = _monthsArray[_month - 1]; 
    _readableShortDate = _day + " " + _monthName

    return _readableShortDate
}

function getReadableFullDate(date) {
    _monthsArray = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

    _day = Day(date)
    _month = Month(date)
    _year = Year(date)
    _monthName = _monthsArray[_month - 1]; 
    _readableFullDate = _day + " " + _monthName + " " + _year + " года"

    return _readableFullDate
}

function normalizeString(word) {
	_lowerCaseWord = StrLowerCase(word);
	_wordWithoutApostrof = StrReplace(_lowerCaseWord, "'", "");
	_firstLetter = _wordWithoutApostrof.slice(0, 1);
	_capitalizedFirstLetter = StrUpperCase(_firstLetter);

	return _capitalizedFirstLetter + _wordWithoutApostrof.slice(1);
}

function getReadableShortName(fullname) {

	_fullnameArray = fullname.split(" ")
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

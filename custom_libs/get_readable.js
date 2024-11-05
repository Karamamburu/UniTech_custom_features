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

function getReadableShortName(fullname) {
    _lowerCaseFullname = StrLowerCase(fullname)
    _fullnameArray = _lowerCaseFullname.split(" ")
    _newFullnameArray = []

    for (string in _fullnameArray) {
        _firstLetter = string.slice(0, 1)
        _capitalizedFirstLetter = StrUpperCase(_firstLetter)
        _newString = _capitalizedFirstLetter + string.slice(1)
        _newFullnameArray.push(_newString)
    }

    _name = _newFullnameArray[1]
    _lastName = _newFullnameArray[0]
    _readableShortName = _name + " " + _lastName 

return _readableShortName
}

function getOnlyName(fullname) {
	_newFullnameArray = []
	_fullnameArray = fullname.split(" ")

	for (string in _fullnameArray) {
		_firstLetter = string.slice(0, 1)
		_capitalizedFirstLetter = StrUpperCase(_firstLetter)
		_newString = _capitalizedFirstLetter + string.slice(1)
		_newFullnameArray.push(_newString)
	}

	_name = _newFullnameArray[1]

    return _name
}

function convertNameToNormalCase(word) {
    _normalCaseWord = StrLowerCase(word)

    _firstLetter = _normalCaseWord.slice(0, 1)
    _capitalizedFirstLetter = StrUpperCase(_firstLetter)
    _normalWord = _capitalizedFirstLetter + _normalCaseWord.slice(1)

    return _normalWord
}
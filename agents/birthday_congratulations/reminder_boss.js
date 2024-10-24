var daysBeforeBirthday = Param.days_before_birthday

function getReadableShortDate(date) {
	var monthsArray = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

        var day = Day(date);
        var month = Month(date);
        var monthName = monthsArray[month - 1];
        var readableShortDate = day + " " + monthName

	return readableShortDate
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

var queryBirthdayInfo = "sql:
					SELECT 
						fm.person_id AS boss_id, 
						c.fullname AS col_name, 
						c.birth_date
					FROM group_collaborators gc
					LEFT JOIN collaborators c ON c.id = gc.collaborator_id
					LEFT JOIN func_managers fm ON c.id = fm.object_id
					WHERE gc.group_id = " + Param.group_id + "
					AND 
						CONVERT(DATE, CONCAT(YEAR(GETDATE()), '-', MONTH(c.birth_date), '-', DAY(c.birth_date))) 
						= CONVERT(DATE, DATEADD(DAY, " + daysBeforeBirthday + ", GETDATE()))
					AND c.is_dismiss = 0
					AND c.position_name IN ('RGM', 'RGM Trainee', 'Area Coach', 'Region Coach', 
							'Market Coach', 'RSC', 'RSC Contractor')
"

var birthdayInfo = ArraySelectAll(XQuery(queryBirthdayInfo))

if (!ArrayCount(birthdayInfo)) {
	alert("сегодня уведомлять некого")

} else {
	
	for (object in birthdayInfo) {

		_readableShortName = "<div style='padding: 4px; margin-top: 8px;'><b>" + 
			getReadableShortName(object.col_name) + 
			"</b></div>" + 
			"<style>" +
			"@media (max-width: 600px) {" +
			"  p { font-size: 0.4em;}" +
			"}" +
			"</style>"

		_dateText = "<p style='font-weight: normal; font-size: 0.6em; margin: 0 0 30px 0; '> Совсем скоро, <b>" + getReadableShortDate(object.birth_date) + "</b>,"
				

		_notificationText = "<p style='font-weight: normal; font-size: 0.6em; margin: 0 0 30px 0; '>" + 
			"отмечает свой День рождения!<br>
			Одна из наших ценностей – Командная работа, и День рождения – отличный повод признать вклад именинника в общее дело. Поздравь своего коллегу от всей команды Rostics!</p>"

		_fullText = _dateText + "<br>" + _readableShortName + "<br>" + _notificationText
		tools.create_notification("boss_birthday_notification_type", 7138424178183920544, _fullText)
	}

}

//tools.create_notification("log_notification_type", 7138424178183920544, _text)


/*

if (!ArrayCount(birthdayCols)) {
	alert("сегодня именинников в ресторанах нет")

} else {
	
	for (col in birthdayCols) {
		tools.create_notification("personal_birthday_notification_type", col.person_id)
	}
	alert("notifications sent")
}
*/
function getReadableShortDate(date) {
	var monthsArray = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

        var day = Day(date);
        var month = Month(date);
        var monthName = monthsArray[month - 1];
        var readableShortDate = day + " " + monthName

	return readableShortDate
}

//ищем сотрудников subdivision_corporate_rsc и корпоративных директоров, у которых сегодня день рождения
var queryBirthdayCollaborators = "sql: 
						WITH birth_today AS (
							SELECT id, fullname, position_parent_id, position_name
							FROM collaborators 
							WHERE DAY(birth_date) = DAY(GETDATE()) 
							AND MONTH(birth_date) = MONTH(GETDATE()) 
							AND is_dismiss = 0
							AND LEN(login) = 7
						)
							SELECT id
							FROM birth_today
							WHERE position_parent_id = 7174468763328728044
							AND position_name IN ('RSC', 'RSC Contractor', 'Area Coach', 'Region Coach')

							UNION

							SELECT bt.id
							FROM birth_today bt
							JOIN subdivisions s ON bt.position_parent_id = s.id
							WHERE s.parent_object_id = 7174468764482109387
							AND bt.position_name IN ('RGM', 'RGM Trainee')
"


var birthdayCollaborators = ArraySelectAll(XQuery(queryBirthdayCollaborators))
alert(ArrayCount(birthdayCollaborators))

if(!ArrayCount(birthdayCollaborators)) {

	alert("сегодня именинников нет")

} else {

	var colsArray = []

	for (col in birthdayCollaborators) {

		_teColDoc = tools.open_doc(col.id).TopElem
		_colShortName = "<p style='font-size: 1.2em; padding: 0; margin: 0;'>" + _teColDoc.firstname + " " + _teColDoc.lastname + "</p>"
		_colPositionName = "<p style='font-size: 0.7em; font-weight: normal; margin: 0;'>" + _teColDoc.position_name + "</p></br style='margin=1em;'>"

		colsArray.push(_colShortName)
		colsArray.push(_colPositionName)

	}

	//собираем разметку сообщения из двух блоков
	var birthdaysColsBlock = "<div style='padding: 10px; margin-top: 20px;'>" + 
		colsArray.join(" ") + 
		"</div>" + 
		"<style>" +
		"@media (max-width: 600px) {" +
		"  p { font-size: 0.8em; }" +
		"}" +
		"</style>"

	var congratulationText = "<p style='font-weight: normal; font-size: 0.6em; margin: -50px 0 30px 0; '>сегодня, <b>" + getReadableShortDate(Date()) + "</b>, " + 
		(birthdayCollaborators.length == 1 ? "отмечает" : "отмечают") + 
		" свой День Рождения!<br/><br/>" +
		"Поздравляем от всей команды Rostics, желаем развиваться лично и профессионально, " + 
		"ставить перед собой смелые цели, добиваться крутых результатов и жить полной, насыщенной жизнью!</p>"

	var fullText = birthdaysColsBlock + congratulationText

	alert(fullText)

	tools.create_notification("rsc_unirest_birthday_notification_type", 7281405151477773727, fullText)

	//находим сотрудников, которым отправить уведомление
	
	var groupToSendNotificationId = Int(Param.group_id)

	var queryColsToSendNotification = "sql:
								SELECT collaborator_id, collaborator_fullname FROM group_collaborators
								WHERE group_id = " + groupToSendNotificationId

	var colsToSendNotifications = ArraySelectAll(XQuery(queryColsToSendNotification))

	//отправляем уведомления
	for (col in colsToSendNotifications) {
		tools.create_notification("rsc_unirest_birthday_notification_type", col.collaborator_id, fullText)
		alert("notification for " + col.collaborator_fullname + " successfully created")
	}

}

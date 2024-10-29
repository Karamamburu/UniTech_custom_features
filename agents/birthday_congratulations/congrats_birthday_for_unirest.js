function Log(message, ex) {
    if(ex == null || ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Exception: ' + ex));
    }
}

EnableLog(Param.log_file_name, true);

Log("Начало работы агента");

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
Log("Именинников сегодня: " + ArrayCount(birthdayCollaborators));

if(!ArrayCount(birthdayCollaborators)) {

	alert("сегодня именинников нет")

} else {

	var colsArray = []

	for (col in birthdayCollaborators) {

		_teColDoc = tools.open_doc(col.id).TopElem
		_colShortName = "<p style='font-size: 1em; padding: 0; margin: 0;'>" + _teColDoc.firstname + " " + _teColDoc.lastname + "</p>"
		_colPositionName = "<p style='font-size: 0.5em; font-weight: normal; margin: 0;'>" + _teColDoc.position_name + "</p></br style='margin=0.2em;'>"

		colsArray.push(_colShortName)
		colsArray.push(_colPositionName)

	}

	//собираем разметку сообщения из двух блоков
	var birthdaysColsBlock = "<div style='padding: 4px; margin-top: 8px;'>" + 
		colsArray.join(" ") + 
		"</div>" + 
		"<style>" +
		"@media (max-width: 600px) {" +
		"  p { font-size: 0.4em;}" +
		"}" +
		"</style>"

        var congratulationText0 = "<p style='font-weight: normal; font-size: 0.6em; margin: -50px 0 30px 0; '>Сегодня, <b>" + 
		tools.call_code_library_method('get_readable', 'getReadableShortDate', [Date()]) + "</b>, " + 
		(birthdayCollaborators.length == 1 ? "отмечает свой День Рождения" : "отмечают свой День Рождения:") + 
		"<br/></p>"

	var congratulationText = "<p style='font-weight: normal; font-size: 0.6em; margin: 0 0 30px 0; '>" + 
		"от&nbsp;всей команды&nbsp;Rostics, желаем развиваться&nbsp;лично и&nbsp;профессионально, " + 
		"ставить перед&nbsp;собой смелые&nbsp;цели, добиваться крутых&nbsp;результатов и&nbsp;жить&nbsp;полной, насыщенной&nbsp;жизнью!</p>"

	var fullText = congratulationText0 + birthdaysColsBlock + congratulationText

	//находим сотрудников, которым отправить уведомление
	var groupToSendNotificationId = Int(Param.group_id)

	var queryColsToSendNotification = "sql:
								SELECT collaborator_id, collaborator_fullname FROM group_collaborators
								WHERE group_id = " + groupToSendNotificationId

	var colsToSendNotifications = ArraySelectAll(XQuery(queryColsToSendNotification))

	//отправляем уведомления
	for (col in colsToSendNotifications) {
		try {
			tools.create_notification("rsc_unirest_birthday_notification_type", col.collaborator_id, fullText)
		} catch(ex) {
			 Log("Ошибка при выполнении агента: " + ex);
		}
		
	}
	Log("Уведомления отправлены " + ArrayCount(colsToSendNotifications) + " сотрудникам");
}

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
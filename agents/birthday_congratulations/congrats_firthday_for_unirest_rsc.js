function Log(message, ex) {
    if(ex == null || ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Exception: ' + ex));
    }
}

EnableLog(Param.log_file_name, true);
Log("Начало работы агента");

var curAgentId = 7413751107204682747 //id текущего агента
var teCurAgentDoc = tools.open_doc(curAgentId).TopElem

if (StrLongDate(teCurAgentDoc.last_run_date) != StrLongDate(Date())) {

	UniTools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/uni_tools.js"))
	GetReadable = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/getReadable.js"));

	//ищем сотрудников subdivision_corporate_rsc и корпоративных директоров, у которых сегодня день рождения
	var queryBirthdayCollaborators = "sql: 
							WITH birth_today AS (
								SELECT id, fullname, position_parent_id, position_name
								FROM collaborators 
								WHERE DAY(birth_date) = DAY(GETDATE())
								AND MONTH(birth_date) = MONTH(GETDATE()) 
								AND is_dismiss = 0
								AND LEN(login) = 7
								AND email LIKE '%@uni.rest'
								AND email NOT IN ('ru-bosstest@uni.rest')
								AND id NOT IN (
									SELECT collaborator_id 
									FROM group_collaborators
									WHERE group_id = " + Param.birthday_guys_exception_group_id + "
									)
								)
								SELECT bt.id
								FROM birth_today bt
								JOIN subdivisions s ON bt.position_parent_id = s.id
								WHERE s.parent_object_id = " + Param.rsc_subdivision_id + "
								AND bt.position_name IN ('RSC', 'RSC Contractor', 'Area Coach', 'Region Coach', 'Other')

								UNION

								SELECT bt.id
								FROM birth_today bt
								JOIN subdivisions s ON bt.position_parent_id = s.id
								WHERE s.parent_object_id = " + Param.restaurants_subdivision_id + "
								AND bt.position_name IN ('RGM', 'RGM Trainee')
	"

	var birthdayCollaborators = ArraySelectAll(XQuery(queryBirthdayCollaborators))

	if(!ArrayCount(birthdayCollaborators)) {

		Log("сегодня именинников нет")

	} else {
		Log("Именинников сегодня: " + ArrayCount(birthdayCollaborators));
		Log("Сегодня день рождения отмечают:")
		var colsArray = new Array()

		for (col in birthdayCollaborators) {

			_teColDoc = tools.open_doc(col.id).TopElem
			_normalizedName = GetReadable.normalizeString(_teColDoc.firstname) + " " + GetReadable.normalizeString(_teColDoc.lastname)
		//костыль с проверками должностей в следующей строке убрать после фикса проблем с получением корректных должностей из ГЕМ
			_colPositionName = GetReadable.getReadablePositionName(col.id) == "Менеджер смены" ? "Исполнительный директор ресторана" : GetReadable.getReadablePositionName(col.id) == "Заместитель директора ресторана" ? "Директор ресторана" : GetReadable.getReadablePositionName(col.id)
			_colShortNameTag = "<p style='font-size: 0.75em; padding: 0; margin:0;'>" + _normalizedName + "</p>";
			_colPositionNameTag = "<p style='font-size: 0.35em; font-weight: normal; margin: 0;'>" + _colPositionName + "</p>"

			Log(_normalizedName + " - " + _colPositionName)

			colsArray.push(_colShortNameTag)
			colsArray.push(_colPositionNameTag)

		}

		//собираем разметку сообщения из двух блоков
		var birthdaysColsBlock = "<div style='padding: 4px; margin-top: 4px;'>" + 
			colsArray.join(" ") + 
			"</div>" + 
			"<style>" +
			"@media (max-width: 600px) {" +
			"  p { font-size: 0.4em;}" +
			"}" +
			"</style>"

		var preTextWithDate = "<p style='font-weight: normal; font-size: 0.6em; margin: 0.25em 0 0.5em 0; '>Сегодня, <b>" + 
			GetReadable.getReadableShortDate(Date()) + "</b>, " + 
			(birthdayCollaborators.length == 1 ? "отмечает свой День Рождения" : "отмечают свой День Рождения:") + 
			"</p>"
			
		var aTextVariants = GetReadable.getDataFromConstants("get_constants", "getCongratsTextVariantsArray")
		var randomText = UniTools.getRandomArrayElement(aTextVariants)

		var congratulationText = "<p style='font-weight: normal; font-size: 0.5em; margin: 1em 0 0.5em 0; '>" + randomText + "</p>"

		var fullText = preTextWithDate + birthdaysColsBlock + congratulationText

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

} else {
	Log("Данный агент уже запускался сегодня")
}

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
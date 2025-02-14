function Log(message, ex) {
    if(ex == null || ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Exception: ' + ex));
    }
}

EnableLog(Param.log_file_name, true);

Log("Начало работы агента");

GetReadable = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/getReadable.js"));

var targetDate = tools.AdjustDate(Date(), Param.days_before_birthday)
var targetDay = Day(targetDate);
var targetMonth = Month(targetDate);

var queryBirthdayInfo = "sql:
					SELECT 
						fm.person_id AS boss_id,
						fm.person_fullname AS boss_name,
						c.fullname AS col_name, 
						c.birth_date
					FROM group_collaborators gc
					LEFT JOIN collaborators c ON c.id = gc.collaborator_id
					LEFT JOIN func_managers fm ON c.id = fm.object_id
					WHERE gc.group_id = " + Param.group_id + "
					AND DAY(c.birth_date) = " + targetDay + " 
					AND MONTH(c.birth_date) = " + targetMonth + " 
					AND c.is_dismiss = 0
					AND c.position_name IN ('RGM', 'RGM Trainee', 'Area Coach', 'Region Coach', 
							'Market Coach', 'RSC', 'RSC Contractor', 'Other')
					AND c.id NOT IN (
						SELECT collaborator_id
						FROM group_collaborators
						WHERE group_id = " + Param.exceptions_group_id + "
					)
"

var birthdayInfo = ArraySelectAll(XQuery(queryBirthdayInfo))
Log(tools.object_to_text(birthdayInfo, "json"))
if (!ArrayCount(birthdayInfo)) {

	Log("Через " + Param.days_before_birthday + " дня никто не празднует день рождения")

} else {

	Log("Количество именинников через " + Param.days_before_birthday + " дня, то есть " + GetReadable.getReadableShortDate(birthdayInfo[0].birth_date) + ": " + ArrayCount(birthdayInfo))
	
	for (object in birthdayInfo) {

		_colName = GetReadable.getReadableShortName(object.col_name)
		_bossName = GetReadable.getReadableShortName(object.boss_name)
		Log("Именинник: " + _colName)
		Log("Его руководитель: " + _bossName)
		Log("_________")
		_readableShortName = "<div style='padding: 4px; margin-top: 8px;'><b>" + 
			_colName + 
			"</b></div>" + 
			"<style>" +
			"@media (max-width: 600px) {" +
			"  p { font-size: 0.4em;}" +
			"}" +
			"</style>"

            _dateText = "<p style='font-weight: normal; font-size: 0.8em; margin: 0 0 30px 0; '>" + GetReadable.getOnlyCyrillicName(object.boss_name) + ", привет! Совсем скоро, <b style='color:#a020c2;'>" + 
            GetReadable.getReadableShortDate(object.birth_date) + "</b>,"
		
		_notificationText = "<p style='font-weight: normal; font-size: 0.8em; margin: 0 0 30px 0; '>" + 
			"отмечает свой День рождения!<br><br>Одна из наших ценностей – Командная&nbsp;работа, и&nbsp;День&nbsp;рождения – отличный&nbsp;повод признать вклад именинника в&nbsp;общее дело. Поздравь своего коллегу от&nbsp;всей&nbsp;команды&nbsp;Rostic's!</p>"

		_fullText = _dateText + "<br>" + _readableShortName + "<br>" + _notificationText

		tools.create_notification("boss_birthday_notification_type", OptInt(object.boss_id), _fullText)
	}
}

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
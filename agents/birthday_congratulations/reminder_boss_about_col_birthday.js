function Log(message, ex) {
    if(ex == null || ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Exception: ' + ex));
    }
}

EnableLog(Param.log_file_name, true);

Log("Начало работы агента");

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
					AND 
						CONVERT(DATE, CONCAT(YEAR(GETDATE()), '-', MONTH(c.birth_date), '-', DAY(c.birth_date))) 
						= CONVERT(DATE, DATEADD(DAY, " + Param.days_before_birthday + ", GETDATE()))
					AND c.is_dismiss = 0
					AND c.position_name IN ('RGM', 'RGM Trainee', 'Area Coach', 'Region Coach', 
							'Market Coach', 'RSC', 'RSC Contractor')
"

var birthdayInfo = ArraySelectAll(XQuery(queryBirthdayInfo))
Log("Количество именинников " + 
tools.call_code_library_method('get_readable', 'getReadableShortDate', [birthdayInfo[0].birth_date]) + 
": " + ArrayCount(birthdayInfo)
)

if (!ArrayCount(birthdayInfo)) {
	Log("сегодня уведомлять некого")

} else {
	
	for (object in birthdayInfo) {

		_colName = tools.call_code_library_method('get_readable', 'getReadableShortName', [object.col_name])
		_bossName = tools.call_code_library_method('get_readable', 'getReadableShortName', [object.boss_name])
		Log("Именинник: " + _colName)
		Log("Его руководитель: " + _bossName)

		_readableShortName = "<div style='padding: 4px; margin-top: 8px;'><b>" + 
			_colName + 
			"</b></div>" + 
			"<style>" +
			"@media (max-width: 600px) {" +
			"  p { font-size: 0.4em;}" +
			"}" +
			"</style>"

		_dateText = "<p style='font-weight: normal; font-size: 0.6em; margin: 0 0 30px 0; '> Совсем скоро, <b>" + 
				tools.call_code_library_method('get_readable', 'getReadableShortDate', [object.birth_date]) + 
				"</b>,"
				

		_notificationText = "<p style='font-weight: normal; font-size: 0.6em; margin: 0 0 30px 0; '>" + 
			"отмечает свой День рождения!<br>
			Одна из наших ценностей – Командная работа, и День рождения – отличный повод признать вклад именинника в общее дело. Поздравь своего коллегу от всей команды Rostics!</p>"

		_fullText = _dateText + "<br>" + _readableShortName + "<br>" + _notificationText
//чтобы отправить боссу, в следующей строке просто передать boss_id вторым агрументом
		tools.create_notification("boss_birthday_notification_type", 7138424178183920544, _fullText)
	}

}

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
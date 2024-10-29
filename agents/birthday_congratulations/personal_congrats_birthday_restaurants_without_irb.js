function Log(message, ex) {
    if(ex == null || ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Exception: ' + ex));
    }
}

EnableLog(Param.log_file_name, true);
Log("Начало работы агента");

var queryBirthdayCollaborators = "sql:
			SELECT c.id, c.fullname, c.position_parent_name FROM group_collaborators gc
			LEFT JOIN collaborators c ON c.id = gc.collaborator_id
			WHERE gc.group_id = " + Param.group_id + "
			AND DAY(c.birth_date) = DAY(GETDATE())
			AND MONTH(c.birth_date) = MONTH(GETDATE())
			AND c.is_dismiss = 0
			AND c.position_name IN ('FOH TM', 'MOH TM', 'BOH TM', 'Team Trainer', 
							'Shift Supervisor', 'Assistant Manager', 'RGM', 
							'RGM Trainee', 'Area Coach', 'Region Coach', 'Market Coach')
			
"

var birthdayCols = XQuery(queryBirthdayCollaborators)

if (!ArrayCount(birthdayCols)) {
	Log("сегодня именинников в ресторанах нет")

} else {
	Log("Именинников в ресторанах сегодня: " + ArrayCount(birthdayCols));

	for (col in birthdayCols) {
		tools.create_notification("personal_birthday_notification_type", col.id)

		Log("Поздравления получили:")
		Log(tools.call_code_library_method('get_readable', 'getReadableShortName', [col.fullname]) + 
		" из ресторана " + col.position_parent_name);
	}

}

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
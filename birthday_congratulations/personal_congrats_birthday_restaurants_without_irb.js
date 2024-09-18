var queryBirthdayCollaborators = "sql:
			SELECT c.id FROM group_collaborators gc
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
	alert("сегодня именинников в ресторанах нет")

} else {
	
	for (col in birthdayCols) {
		tools.create_notification("personal_birthday_notification_type", col.id, "")
	}

}


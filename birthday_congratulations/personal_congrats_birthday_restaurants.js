var queryBirthdayCollaborators = "sql:
			SELECT id, fullname FROM collaborators
			WHERE DAY(birth_date) = DAY(GETDATE())
			AND MONTH(birth_date) = MONTH(GETDATE())
			AND is_dismiss = 0
			AND position_name IN ('FOH TM', 'MOH TM', 'BOH TM', 'Team Trainer', 
							'Shift Supervisor', 'Assistant Manager', 'RGM', 
							'RGM Trainee', 'Area Coach', 'Region Coach', 'Market Coach')
"

var birthdayCols = XQuery(queryBirthdayCollaborators)

alert(ArrayCount(birthdayCols))

if (!ArrayCount(birthdayCols)) {
	alert("сегодня именинников в ресторанах нет")
} else {
	
	for (col in birthdayCols) {
		tools.create_notification("personal_birthday_notification_type", col.id, "")
		alert("notification for " + col.fullname + " created successfully")
	}

}
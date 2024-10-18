var daysBeforeBirthday = Param.days_before_birthday

var queryBirthdayCollaborators = "sql:
						SELECT fm.person_id, c.login, fm.object_id 
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

var birthdayCols = XQuery(queryBirthdayCollaborators)

_count = "<p>Количество руководителей: " + ArrayCount(birthdayCols) + "</p>"
_bossLogin = "<p>Логин первого руководителя: " + birthdayCols[0].login + "</p>"




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
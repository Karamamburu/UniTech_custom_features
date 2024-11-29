function Log(message, ex) {
	if (ex == undefined) {
		LogEvent(Param.log_file_name, message);
	} else {
		LogEvent(Param.log_file_name, (message + ' Message: ' + ex));
	}
}

EnableLog(Param.log_file_name, true);
Log("начало работы агента");

var queryCollaborators = "sql:
				    SELECT gc.collaborator_id, gc.collaborator_fullname 
				    FROM group_collaborators gc
				    LEFT JOIN cc_assign_icons ai ON gc.collaborator_id = ai.collaborator_id AND ai.icon_id = " + Param.icon_id + "
				    WHERE gc.group_id = " + Param.group_id + " AND ai.icon_id IS NULL
"

var colsToAssignIcons = ArraySelectAll(XQuery(queryCollaborators))

if (!ArrayCount(colsToAssignIcons)) {

	Log("У всех сотрудников из выбранной группы уже есть этот значок")

} else {
	
	Log("Сотрудников, не имеющих значок: " + ArrayCount(colsToAssignIcons))

	for (col in colsToAssignIcons) {
		try {
			assignedIconDoc = tools.new_doc_by_name("cc_assign_icon", false)
			assignedIconDoc.BindToDb()
			assignedIconDoc.TopElem.collaborator_id = col.collaborator_id
			assignedIconDoc.TopElem.icon_id = Param.icon_id
			assignedIconDoc.TopElem.assign_date = Date()
			assignedIconDoc.Save()

			Log("Значок для сотрудника " + col.collaborator_fullname + " успешно создан")
		} catch (ex) {
			Log('Ошибка: ', ex);
			}	
		}	
	}


Log("завершение работы агента");
EnableLog(Param.log_file_name, false);
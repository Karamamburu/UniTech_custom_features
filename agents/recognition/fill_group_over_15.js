function Log(message, ex) {
	if (ex == undefined) {
		LogEvent(Param.log_file_name, message);
	} else {
		LogEvent(Param.log_file_name, (message + ' Message: ' + ex));
	}
}

EnableLog(Param.log_file_name, true);
Log("начало работы агента");

dynamicGroupDoc = tools.open_doc(Param.group_id);
dynamicGroupDoc.TopElem.collaborators.Clear();

//для остальных групп со стажем 1, 5 и 10 лет используем BETWEEN DATEADD(YEAR, -15, GETDATE()) AND DATEADD(YEAR, -10, GETDATE())
var queryCollaborators = "sql: 
			SELECT c.id, c.fullname FROM collaborators c
			WHERE c.hire_date <= DATEADD(YEAR, -15, GETDATE())
			AND c.is_dismiss = 0
"

var collaborators = XQuery(queryCollaborators)
if(!ArrayCount(collaborators)) {
	Log("сотрудников для добавления в группу " + dynamicGroupDoc.TopElem.name + " нет")
} else {
	Log("Количество сотрудников: " + ArrayCount(collaborators))

	for(col in collaborators) {

	    try {
		Log("сотрудник " + col.fullname + " успешно добавлен в группу \'" + dynamicGroupDoc.TopElem.name + "\'")
		_child = dynamicGroupDoc.TopElem.collaborators.AddChild();
		_child.collaborator_id = col.id;
	    }
	    catch (ex) {
		alert('Ошибка: ' + ex)
	    }
	}

	dynamicGroupDoc.Save();
}

Log("завершение работы агента");
EnableLog(Param.log_file_name, false);
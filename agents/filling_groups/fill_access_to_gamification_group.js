function Log(message, ex) {
    if(ex == null || ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Exception: ' + ex));
    }
}

EnableLog(Param.log_file_name, true);
Log("Начало работы агента");

dinamicGroupDoc = tools.open_doc(Param.group_id)
dinamicGroupDoc.TopElem.collaborators.Clear()

var queryCollaborators = "sql: 
					SELECT c.id
					FROM collaborators c
					WHERE c.is_dismiss = 0
					AND c.email NOT LIKE ('%@irb.rest')
					AND c.email NOT LIKE ('%@myrest.team')
"

var collaborators = ArraySelectAll(XQuery(queryCollaborators))
Log("Количество сотрудников: " + ArrayCount(collaborators))

try {
	for(col in collaborators) {
		_child = dinamicGroupDoc.TopElem.collaborators.AddChild()
		_child.collaborator_id = col.id
	}
} catch (ex) {
	Log('Ошибка: ' + ex)
}

dinamicGroupDoc.Save()

Log("Динамическая группа доступа к функционалу геймификации успешно обновлена")

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
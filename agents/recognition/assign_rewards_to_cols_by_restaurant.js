function Log(message, ex) {
	if (ex == undefined) {
		LogEvent(Param.log_file_name, message);
	} else {
		LogEvent(Param.log_file_name, (message + ' Message: ' + ex));
	}
}

EnableLog(Param.log_file_name, true);
Log("начало работы агента");

var CustomGameTools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_game_tools.js"));

var queryCollaborators = "sql:
							SELECT 
								id, 
								fullname, 
								position_id,
								position_name,
								position_parent_id,
								position_parent_name,
								org_id,
								org_name
							FROM collaborators
							WHERE position_parent_id = " + Param.restaurant_id + " 
							AND is_dismiss = 0
"

var colsToAssignRewards = ArraySelectAll(XQuery(queryCollaborators))

if (!ArrayCount(colsToAssignRewards)) {

	Log("В ресторане " + ArrayOptFirstElem(colsToAssignRewards).position_parent_name + " не найдено сотрудников")

} else {
	
	Log("Сотрудников в ресторане " + ArrayOptFirstElem(colsToAssignRewards).position_parent_name + " - " + ArrayCount(colsToAssignRewards))

	for (col in colsToAssignRewards) {
		try {

			CustomGameTools.giveTrophyToUser(col.id, Param.reward_id, Param.sender_id)

			Log("Награда для сотрудника " + col.fullname + " успешно присвоена")
		} catch (ex) {
			Log('Ошибка: ', ex);
			}	
		}	
	}

Log("завершение работы агента");
EnableLog(Param.log_file_name, false);
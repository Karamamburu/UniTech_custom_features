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

var subdivisionGroupDoc = tools.open_doc(Param.subdivision_group_id)
var aSubdivisions = subdivisionGroupDoc.TopElem.subdivisions
var aSubdivisionsIds = new Array()

for (oSubdivision in aSubdivisions) {
	try {
		aSubdivisionsIds.push("" + oSubdivision.subdivision_id)
	} catch(ex) {
		Log("Error: " + ex)
	}
}

for (subdivision in aSubdivisionsIds) {
	queryCollaborators = "sql:
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
					WHERE position_parent_id = " + OptInt(subdivision) + " 
					AND is_dismiss = 0
	"

	colsToAssignRewards = ArraySelectAll(XQuery(queryCollaborators))

	if (!ArrayCount(colsToAssignRewards)) {

		Log("В ресторане " + ArrayOptFirstElem(colsToAssignRewards).position_parent_name + " не найдено сотрудников")

	} else {
		
		Log("Обработка ресторана " + ArrayOptFirstElem(colsToAssignRewards).position_parent_name + ", количество сотрудников: " + ArrayCount(colsToAssignRewards))

		for (col in colsToAssignRewards) {
			try {

				CustomGameTools.giveTrophyToUser(col.id, Param.reward_id, Param.sender_id)

				Log("--- награда для сотрудника " + col.fullname + " успешно присвоена")
			} catch (ex) {
				Log('Ошибка: ', ex);
			}	
		}
		Log("Завершение обработки ресторана " + ArrayOptFirstElem(colsToAssignRewards).position_parent_name)
	}
}

Log("завершение работы агента");
EnableLog(Param.log_file_name, false);
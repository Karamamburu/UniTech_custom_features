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
			assignedRewardDoc = tools.new_doc_by_name("qualification_assignment", false)
			assignedRewardDoc.BindToDb()
			assignedRewardDoc.TopElem.assignment_date = Date()
			assignedRewardDoc.TopElem.status = "assigned"
			assignedRewardDoc.TopElem.qualification_id = Param.reward_id
			assignedRewardDoc.TopElem.person_id = col.id
			assignedRewardDoc.TopElem.person_fullname = col.fullname
            assignedRewardDoc.TopElem.person_position_id = col.position_id
			assignedRewardDoc.TopElem.person_position_name = col.position_name
            assignedRewardDoc.TopElem.person_org_id = col.org_id
            assignedRewardDoc.TopElem.person_org_name = col.org_name
            assignedRewardDoc.TopElem.person_subdivision_id = col.position_parent_id
            assignedRewardDoc.TopElem.person_subdivision_name = col.position_parent_name
            assignedRewardDoc.TopElem.is_reward = 1
			assignedRewardDoc.Save()

			Log("Награда для сотрудника " + col.fullname + " успешно присвоена")
		} catch (ex) {
			Log('Ошибка: ', ex);
			}	
		}	
	}


Log("завершение работы агента");
EnableLog(Param.log_file_name, false);
function Log(message, ex) {
	if (ex == undefined) {
	  LogEvent(Param.log_file_name, message)
	} else {
	  LogEvent(Param.log_file_name, message + " Message: " + ex)
	}
  }
  
  EnableLog(Param.log_file_name, true)
  Log("начало работы агента")
  
  var CustomGameTools = OpenCodeLib(
	FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_game_tools.js")
  );
  Log("Вручаемый объект: " + Param.item_type);
  
  var query = "sql:
			  SELECT gc.collaborator_id, gc.collaborator_fullname 
			  FROM group_collaborators gc
			  WHERE gc.group_id = " + Param.group_id
  
  var colsToAssignItems = ArraySelectAll(XQuery(query));
  
  if (!ArrayCount(colsToAssignItems)) {
	Log(
	  "У всех сотрудников из выбранной группы уже есть " +
		(Param.item_type == "icon" ? "этот значок" : "эта награда")
	);
  } else {
	Log(
	  "Найдено сотрудников в группе: " +
		ArrayCount(colsToAssignItems)
	);
  
	for (col in colsToAssignItems) {
	  try {
		Param.item_type == "icon"
		  ? CustomGameTools.giveIconToUser(col.collaborator_id, Param.icon_id, Param.sender_id)
		  : CustomGameTools.giveTrophyToUser(col.collaborator_id, Param.reward_id, Param.sender_id)
  
		Log(
		  (Param.item_type == "icon" ? "Значок" : "Награда") +
			" для сотрудника " +
			col.collaborator_fullname +
			" успешно " +
			(Param.item_type == "icon" ? "присвоен" : "присвоена")
		);
	  } catch (ex) {
		Log("Ошибка при вручении награды сотруднику: " + col.collaborator_fullname, ex)
	  }
	}
  }
  
  Log("завершение работы агента")
  EnableLog(Param.log_file_name, false)
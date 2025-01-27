function Log(message, ex) {
  if (ex == null || ex == undefined) {
    LogEvent(Param.log_file_name, message);
  } else {
    LogEvent(Param.log_file_name, message + " Exception: " + ex);
  }
}

EnableLog(Param.log_file_name, true);
Log("Начало работы агента");

var queryGoalmaps = "sql: 
                      SELECT DISTINCT
                          gm.id AS goalmap_id,
			                    gm.manager_id,
                          fm.object_name AS col_fullname,
                          fm.person_fullname AS boss_fullname,
                          fm.person_id AS boss_id,
			                    c.id AS col_id,
                          c.position_name AS col_position_name
                      FROM
                          cc_goalmaps gm
                          LEFT JOIN func_managers fm ON gm.collaborator_id = fm.object_id
                          LEFT JOIN collaborators c ON gm.collaborator_id = c.id
                      WHERE
                          gm.period_id = " + Param.period_id + "
                          AND (
                            gm.manager_id IS null
                            OR 
                            c.position_name IN ('Shift Supervisor', 'Assistant Manager', 'RGM', 'Area Coach')
                          )
"

var goalmapsInfo = ArraySelectAll(XQuery(queryGoalmaps));

if (!ArrayCount(goalmapsInfo)) {
	Log("Карт целей не найдено")
} else {
	Log("Найдено карт целей: " + ArrayCount(goalmapsInfo));
	Log(tools.object_to_text(goalmapsInfo, 'json'))

	try {
	  for (goalmap in goalmapsInfo) {
	    if (goalmap.manager_id == goalmap.boss_id) {
		continue
	    }
      else if (
        !goalmap.manager_id ||
        goalmap.col_position_name == 'Shift Supervisor' ||
        goalmap.col_position_name == 'Assistant Manager' ||
        goalmap.col_position_name == 'RGM' ||
        goalmap.col_position_name == 'Area Coach'
      ) {
        Log("Обработка карты целей с id: " + goalmap.goalmap_id)
        goalmapDoc = tools.open_doc(goalmap.goalmap_id)
        goalmapDoc.TopElem.manager_id = goalmap.boss_id
        goalmapDoc.Save()
        Log(goalmap.boss_fullname + " установлен руководителем для " + tools.call_code_library_method("get_readable", "getReadablePositionName", [goalmap.col_id]) + " " + goalmap.col_fullname + ", партнёр " + tools.call_code_library_method("get_data_for_lpe", "getPartnerName", [goalmap.col_id]))
      }
	    
	  }
	} catch (ex) {
	  Log("Произошла ошибка: " + ex)
	}

}

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
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
                          fm.object_name AS col_fullname,
                          fm.person_fullname AS boss_fullname,
                          fm.person_id AS boss_id
                      FROM
                          cc_goalmaps gm
                          LEFT JOIN group_collaborators gc ON gm.collaborator_id = gc.collaborator_id
                          LEFT JOIN func_managers fm ON gm.collaborator_id = fm.object_id
                      WHERE
                          gm.period_id = " + Param.period_id + "
                          AND gm.manager_id IS null
"

var goalmapsInfo = ArraySelectAll(XQuery(queryGoalmaps));

if (!ArrayCount(goalmapsInfo)) {
	Log("Карт целей не найдено")
} else {
	Log("Найдено карт целей: " + ArrayCount(goalmapsInfo));
	Log(tools.object_to_text(goalmapsInfo, 'json'))

try {
  for (goalmap in goalmapsInfo) {
    Log("Обработка карты целей с id: " + goalmap.goalmap_id)
    goalmapDoc = tools.open_doc(goalmap.goalmap_id)
    goalmapDoc.TopElem.manager_id = goalmap.boss_id
    goalmapDoc.Save()
    Log(goalmap.boss_fullname + " установлен руководителем для карты целей сотрудника " + goalmap.col_fullname)
  }
} catch (ex) {
  Log("Произошла ошибка: " + ex)
}

}

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
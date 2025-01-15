function Log(message, ex) {
    if(ex == null || ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Exception: ' + ex));
    }
}

goal_tools = OpenCodeLib(FilePathToUrl(AppDirectoryPath()+"/custom_tools/custom_goal_tools.js"));

EnableLog(Param.log_file_name, true);

Log("Начало работы агента");

sQuery = "sql: 
		SELECT gm.id AS id 
		FROM cc_goalmaps gm 
		JOIN cc_goalmap_states gs ON gs.id = gm.state_id 
		JOIN collaborators c ON c.id = gm.collaborator_id
		WHERE gs.code = '0' 
		AND DATEDIFF(day, c.hire_date, GETDATE()) < " + Param.days_from_hire_date + " 
		AND c.position_parent_id = " + Param.subdivision_id + "
		AND c.position_name != 'EXT Contractor'
		AND c.login = 'tsu5602'
"
goalMaps = ArraySelectAll(XQuery(sQuery));

Log("Найдено записей: " + ArrayCount(goalMaps));



for(goalMap in goalMaps) {
    try {
        var data = goal_tools.getGoalmapData(OptInt(goalMap.id));

        tools.create_notification("notification_fill_goalmap", data.workerId, tools.object_to_text(data,"json"));

        _notification_doc = tools.new_doc_by_name('cc_notification', false);
        _notification_doc.TopElem.object_id = OptInt(goalMap.id);
        _notification_doc.TopElem.object_type = 'cc_goalmap';
        _notification_doc.TopElem.collaborator_id = data.workerId;
        _notification_doc.TopElem.description = 'Необходимо внести годовые цели и отправить на согласование руководителю';
        _notification_doc.TopElem.link = UrlAppendPath(global_settings.settings.portal_base_url, '/_wt/goal_setting_col?goalmap_id=' + goalMap.id);
        _notification_doc.TopElem.is_info = false;
        _notification_doc.BindToDb();
        _notification_doc.Save();

    }
    catch (ex) {
        Log("Ошибка при выполнении агента. goalMap.id: " + goalMap.id, ex);
    }
}


Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);

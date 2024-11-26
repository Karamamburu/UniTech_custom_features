function Log(message, ex) {
    if (ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Message: ' + ex));
    }
}

EnableLog(Param.log_file_name);

Log("Create period and goalmaps started.");

try {
    //DEBUG
    //DropFormsCache(FilePathToUrl(AppDirectoryPath()+"/custom_tools/custom_goal_tools.js"));
    goal_tools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_goal_tools.js"));

    targetYear = OptInt(Param.target_year);

    if (targetYear == undefined) {
        targetYear = Year(Date()) + 1;
    }

    period_doc = goal_tools.get_period_doc(targetYear);
	
    if (period_doc == undefined) {
        period_doc = tools.new_doc_by_name('cc_period', false);
        period_doc.TopElem.year = targetYear;
        period_doc.BindToDb();
        period_doc.Save();

        Log("Create new period. Year - " + period_doc.TopElem.year);
    }

    if (Date() >= Date('1.12.' + Year(Date())) || Param.ignore_current_date == '1') {
      queryColobarators = "sql: " +
          " DECLARE " +
          " @period_id BIGINT = " + period_doc.DocID + "; " +
          "  " +
          " SELECT cls.id, cls.login FROM collaborators cls " +
          " LEFT JOIN cc_goalmaps gms ON gms.collaborator_id = cls.id AND gms.period_id = @period_id " +
          " WHERE ISNull(cls.position_name,'') NOT IN ('Team Trainer', 'FOH', 'MOH', 'BOH') " +
          " AND gms.id IS NULL AND ISNULL(cls.is_dismiss, 0) = 0 ";

        if (Param.group_id) {
          queryColobarators = queryColobarators + " AND cls.id IN (SELECT collaborator_id FROM group_collaborators WHERE group_id = " + OptInt(Param.group_id) + ") AND cls.id NOT IN (SELECT collaborator_id FROM group_collaborators WHERE group_id = " + OptInt(Param.exceptions_group_id) + ")";
        }

        arrColoboratorsToCreateGoalMaps = ArraySelectAll(XQuery(queryColobarators));

        for (oColoboratorToCreateGoalMapElem in arrColoboratorsToCreateGoalMaps) {
          goalmap_doc = goal_tools.get_or_create_goalmap_doc(period_doc.DocID, oColoboratorToCreateGoalMapElem.id);
		  goalmap_doc.TopElem.without_okr = OptInt(Param.without_okr) == 1;
		  goalmap_doc.Save()
          Log('Create new goalmap for collaborator. Year - ' + period_doc.TopElem.year + '. Login - ' + oColoboratorToCreateGoalMapElem.login);
        }
    }
} catch (ex) {
    Log('Processing error.', ex);
}


Log("Create period and goalmaps finished.");
EnableLog(Param.log_file_name, false);
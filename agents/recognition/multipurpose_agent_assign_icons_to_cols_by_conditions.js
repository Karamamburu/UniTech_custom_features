function Log(message, ex) {
    if (ex == undefined) {
      LogEvent(Param.log_file_name, message);
    } else {
      LogEvent(Param.log_file_name, (message + ' Message: ' + ex));
    }
}
  
EnableLog(Param.log_file_name, true);
Log("Начало работы универсального агента");

var CustomGameTools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_game_tools.js"));

var groups = [
  {
    name: "cols_15_years",
    icon_id: Param.icon_15_id,
    years_to: null,
    years_from: 15
  },
  {
    name: "cols_10_years",
    icon_id: Param.icon_10_id,
    years_to: 15,
    years_from: 10
  },
  {
    name: "cols_5_years",
    icon_id: Param.icon_5_id,
    years_to: 10,
    years_from: 5
  },
  {
    name: "cols_1_years",
    icon_id: Param.icon_1_id,
    years_to: 5,
    years_from: 1
  }
];

function buildQuery(years_from, years_to) {
  var query = "sql: 
      SELECT c.id, c.fullname 
      FROM collaborators c 
      WHERE c.is_dismiss = 0 
      AND c.position_name != 'Ext Contractor' 
      AND c.hire_date <= DATEADD(YEAR, -" + years_from + ", GETDATE()) 
  "

  if (years_to != null) {
    query += "AND c.hire_date >= DATEADD(YEAR, -" + years_to + ", GETDATE()) ";
  }

  return query;
  }

  for (group in groups) {
    Log("Обработка группы: " + group.name);
    _counter = 0;
    _query = buildQuery(group.years_from, group.years_to);
    _collaborators = ArraySelectAll(XQuery(_query));

    if (!ArrayCount(_collaborators)) {
        Log("Сотрудников не найдено")
    } else {
        Log("Собрано сотрудников для группы '" + group.name + "': " + ArrayCount(_collaborators));

        for (col in _collaborators) {
            _checkIconQuery = "sql:
                                    SELECT ai.icon_id
                                    FROM cc_assign_icons ai
                                    WHERE ai.collaborator_id = " + col.id + " 
                                    AND ai.icon_id = " + group.icon_id 
            
            _hasIcon = ArrayCount(XQuery(_checkIconQuery)) > 0;
        
            if (!_hasIcon) {
                CustomGameTools.giveIconToUser(col.id, group.icon_id, Param.sender_id);
                _counter += 1;
                Log("Значок " + group.name + " для сотрудника " + col.fullname + " успешно создан");
            }
        }
    }   
    Log("Сотрудникам из группы " + group.name + " присвоено " + _counter + " значков")
}

Log("Завершение работы универсального агента");
EnableLog(Param.log_file_name, false);

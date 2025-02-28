function Log(message, ex) {
    if(ex == null || ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Exception: ' + ex));
    }
}

EnableLog(Param.log_file_name, true);
Log("Начало работы агента");

// _clear_list - признак очищения списка сотрудников перед добавлением сотрудников по условию. 
// Чтобы сотрудники добавлялись к существующему списку, необходимо установить _clear_list = false;
_clear_list = true;

dynamyc_groupArray = ArraySelectAll(XQuery("sql:
						SELECT id, name
						FROM groups
						WHERE is_dynamic = 1
						AND code IN (
							'gamification_all_acs',
							'gamification_all_mms',
							'gamification_all_rgms',
							'access_to_game',
							'group_arl_report',
							'all_active_cols_for_recert'
						)
"
))
Log("Количество групп для перенаполнения: " + ArrayCount(dynamyc_groupArray))

max_attempts = 10

for(_group in dynamyc_groupArray) {
    Log("Началось наполнение группы " + _group.name)
    attempts = 0
    success = false

    while (!success && attempts < max_attempts) {
        try {
            attempts++
	    Log("Попытка №" + attempts)
            doc_group = tools.open_doc(_group.id)
            doc_group.TopElem.dynamic_select_person(_clear_list)
            doc_group.Save()
            success = true
            Log("Группа " + _group.name + " успешно обновлена с попытки №" + attempts)
        } catch(ex) {
            Log("Попытка №" + attempts + " для группы " + _group.name + " завершилась ошибкой: " + ex)
            if (attempts >= max_attempts) {
                Log("Достигнуто максимальное количество попыток для группы " + _group.name);
            }
        }
    }
}

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
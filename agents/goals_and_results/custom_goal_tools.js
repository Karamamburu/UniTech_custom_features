function isNull(value) {
    if (value == null || value == undefined) {
        return true;
    }
    return false;
}

function isNullOrEmpty(value) {
    if (value == '' || value == null || value == undefined) {
        return true;
    }
    return false;
}

//Получение последнего периода
function get_last_period() {
    return ArrayOptFirstElem(XQuery("sql: SELECT TOP(1) * FROM cc_periods ORDER BY year DESC"));
}

//Получение Периода по году
function get_period(year) {
    return ArrayOptFirstElem(XQuery("sql: SELECT * FROM cc_periods WHERE year = " + OptInt(year, 0)));
}

//Получение Периода по году, возвращает документ
function get_period_doc(year) {
    period = ArrayOptFirstElem(XQuery("sql: SELECT id FROM cc_periods WHERE year = " + OptInt(year, 0)), {id: 0});
    period_doc = tools.open_doc(period.id);
    return period_doc;
}

//Получение всех Периодов
function get_periods() {
    return ArraySelectAll(XQuery("sql: SELECT * FROM cc_periods"));
}

//Получение или создание Периода по году, возвращает документ
function get_or_create_period_doc(year) {
    period_doc = get_period_doc(year);
    if (!isNull(period_doc)) {
        return period_doc;
    }

    period_doc = tools.new_doc_by_name("cc_period", false);
    period_doc.BindToDb();
    period_doc.TopElem.year = OptInt(year, 0);
    period_doc.Save();
    return period_doc;
}

//Получение статуса карты целей по коду
function get_goalmap_state_by_code(code) {
    state = ArrayOptFirstElem(XQuery("sql: SELECT * FROM cc_goalmap_states WHERE code = '" + code + "'"));
    if (isNull(state)) {
        throw "Goalmap state with code '" + code + "' not found";
    }
    return state;
}

//Получение всех карт целей организации
function get_goalmaps_by_org(period_id) {
    query = "sql: " +
        " SELECT gms.*, pds.year  " +
        " FROM cc_goalmaps gms  " +
        " INNER JOIN cc_periods pds ON pds.id = gms.period_id  " +
        " WHERE ISNULL(for_org, 0) = 1 ";

    if (!isNullOrEmpty(period_id)) {
        query += " AND gms.period_id = " + period_id;
    }
    return ArraySelectAll(XQuery(query));
}

//Получение всех карт целей пользователя
function get_goalmaps_by_user_id(user_id) {
    return ArraySelectAll(XQuery("sql: " +
        " SELECT gms.*, pds.year " +
        " FROM cc_goalmaps gms " +
        " INNER JOIN cc_periods pds ON pds.id = gms.period_id " +
        " WHERE gms.collaborator_id = " + OptInt(user_id, 0)
    ));
}

//Получение всех карт целей пользователя, возвращает документы
function get_goalmaps_doc_by_user_id(user_id) {
    result = [];
    goalmaps = get_goalmaps_by_user_id(user_id);
    for (goalmap in goalmaps) {
        goalmap_doc = tools.open_doc(goalmap.id);
        if (isNull(goalmap_doc)) {
            continue;
        }

        result.push(goalmap_doc);
    }

    return result;
}

//Получение всех карт целей руководителя
function get_goalmaps_by_manager_id(manager_id) {
    return ArraySelectAll(XQuery("sql: SELECT * FROM cc_goalmaps WHERE manager_id = " + OptInt(manager_id, 0)));
}

//Получение всех карт целей руководителя, возвращает документы
function get_goalmaps_doc_by_manager_id(manager_id) {
    result = [];
    goalmaps = get_goalmaps_by_manager_id(manager_id);
    for (goalmap in goalmaps) {
        goalmap_doc = tools.open_doc(goalmap.id);
        if (isNull(goalmap_doc)) {
            continue;
        }

        result.push(goalmap_doc);
    }

    return result;
}

//Получение карты целей
function get_goalmap(period_id, collaborator_id) {
    if (isNullOrEmpty(collaborator_id)) {
        goalmap = ArrayOptFirstElem(XQuery("sql: " +
            " SELECT id FROM cc_goalmaps  " +
            " WHERE period_id = " + period_id +
            " AND ISNULL(for_org, 0) = 1 "
        ));
    } else {
        goalmap = ArrayOptFirstElem(XQuery("sql: " +
            " SELECT id FROM cc_goalmaps  " +
            " WHERE period_id = " + period_id +
            " AND collaborator_id = " + collaborator_id
        ));
    }
    return goalmap;
}

//Получение карты целей, возвращает документ
function get_goalmap_doc(period_id, collaborator_id) {
    if (isNullOrEmpty(collaborator_id)) {
        goalmap = ArrayOptFirstElem(XQuery("sql: " +
            " SELECT id FROM cc_goalmaps  " +
            " WHERE period_id = " + period_id +
            " AND ISNULL(for_org, 0) = 1 "
        ), {id: 0});
    } else {
        goalmap = ArrayOptFirstElem(XQuery("sql: " +
            " SELECT id FROM cc_goalmaps  " +
            " WHERE period_id = " + period_id +
            " AND collaborator_id = " + collaborator_id
        ), {id: 0});
    }
    goalmap_doc = tools.open_doc(goalmap.id);
    return goalmap_doc;
}

//Получение или создание карты целей, возвращает документ
function get_or_create_goalmap_doc(period_id, collaborator_id) {
    goalmap_doc = get_goalmap_doc(period_id, collaborator_id);

    if (!isNull(goalmap_doc)) {
        return goalmap_doc;
    }

    period = ArrayOptFirstElem(XQuery("sql: SELECT * FROM cc_periods WHERE id = " + period_id));

    goalmap_doc = tools.new_doc_by_name("cc_goalmap", false);
    goalmap_doc.BindToDb();
    goalmap_doc.TopElem.state_id = get_goalmap_state_by_code(0).id;
    goalmap_doc.TopElem.period_id = period_id;

    if (isNullOrEmpty(collaborator_id)) {
        goalmap_doc.TopElem.name = period.year + " - Организация";
        goalmap_doc.TopElem.for_org = true;
    } else {
        collaborator = ArrayOptFirstElem(XQuery("sql: SELECT * FROM collaborators WHERE id = " + collaborator_id));
        if (isNull(collaborator)) {
            throw 'Collaborator with id ' + collaborator_id + ' not found';
        }
        goalmap_doc.TopElem.name = period.year + " - " + collaborator.fullname;
        goalmap_doc.TopElem.collaborator_id = collaborator_id;
    }
    goalmap_doc.Save();

    if (!isNullOrEmpty(collaborator_id)) {
        sendCreateGoalmapNotification(goalmap_doc.DocID);
    }

    return goalmap_doc;
}

//Обновление карты целей
function update_goalmap(goalmap) {
    goalmap_doc = tools.open_doc(OptInt(goalmap.GetOptProperty('id'), 0));
    if (isNull(goalmap_doc)) {
        throw 'Incorrent id';
    }

    goalmap_doc.TopElem.LoadData('<x>' + tools.object_to_text(goalmap, 'xml') + '</x>');
    goalmap_doc.Save();

    return goalmap_doc;
}

//Обновление статуса карты целей
function update_goalmap_state(goalmap_id, new_state_code) {
    goalmap_doc = tools.open_doc(goalmap_id);
    if (isNull(goalmap_doc)) {
        throw 'Goalmap with ID ' + goalmap_id + ' not found';
    }

    goalmap_doc.TopElem.state_id = get_goalmap_state_by_code(new_state_code).id;
    goalmap_doc.TopElem.last_change_state_date = Date();
    goalmap_doc.Save();
}

//Обновление должности карты целей
function update_goalmap_position(goalmap_id, new_position_id) {
    goalmap_doc = tools.open_doc(goalmap_id);
    if (isNull(goalmap_doc)) {
        throw 'Goalmap with ID ' + goalmap_id + ' not found';
    }

    goalmap_doc.TopElem.fake_position_id = new_position_id;
    goalmap_doc.Save();
}


//Получение всех целей по карте целей
function get_goals(goalmap_id, include_non_actual) {
    if (include_non_actual) {
        condition = '';
    } else {
        condition = "AND ISNULL(y1_grs.code, '') <> 'n' AND ISNULL(y2_grs.code, '') <> 'n' ";
    }
	query = "sql: " +
        " SELECT DISTINCT " +
        " 	gs.number,  " +
        " 	CONCAT ('Цель №',isNull(gs.number,'')) 'goal_name',  " +
        " 	gs.*, " +
        " 	g.data.value('(//description)[1]', 'nvarchar(max)') 'description', " +
        " 	g.data.value('(//y1_comment)[1]', 'nvarchar(max)') 'y1_comment', " +
        " 	g.data.value('(//y2_comment)[1]', 'nvarchar(max)') 'y2_comment', " +
        " 	g.data.value('(//desc_what_done)[1]', 'nvarchar(max)') 'desc_what_done', " +
        " 	g.data.value('(//desc_how_done)[1]', 'nvarchar(max)') 'desc_how_done', " +
		" 	g.data.value('(//desc_comment_coll)[1]', 'nvarchar(max)') 'desc_comment_coll', " +
		" 	g.data.value('(//desc_comment_manager)[1]', 'nvarchar(max)') 'desc_comment_manager', " +
        " 	ISNULL(FORMAT(gs.plan_date, 'dd.MM.yyyy'), 'Не указан') 'plan_date_str', " +
        " 	y1_grs.name 'y1_result_name', " +
        " 	y2_grs.name 'y2_result_name' FROM cc_goals gs " +
        " INNER JOIN cc_goal g ON g.id = gs.id " +
        " LEFT JOIN cc_goal_results y1_grs ON y1_grs.id = gs.y1_result " +
        " LEFT JOIN cc_goal_results y2_grs ON y2_grs.id = gs.y2_result " +
        " WHERE gs.goalmap_id = " + OptInt(goalmap_id, 0) + " " + condition + " " +
		" ORDER BY gs.number "

    return ArraySelectAll(XQuery(query));
}

//Получение всех целей по карте целей, возвращает документы
function get_goals_doc(goalmap_id) {
    result = [];
    goals = get_goals(goalmap_id);
    for (goal in goals) {
        goal_doc = tools.open_doc(goal.id);
        if (isNull(goal_doc)) {
            continue;
        }

        result.push(goal_doc);
    }

    return result;
}

//Получение всех типов целей
function get_goal_types() {
    return ArraySelectAll(XQuery("sql: SELECT * FROM cc_goal_types"));
}

//Получение нового номера цели по карте целей
function get_new_goal_number(goalmap_id) {
    current_goals = ArraySelectAll(XQuery("sql: " +
        " SELECT number FROM cc_goals " +
        " WHERE goalmap_id = " + OptInt(goalmap_id, 0) + " " +
        " ORDER BY number; "
    ));

    count = 1;
    for (goal in current_goals) {
        if (count != goal.number) {
            return count;
        }
        count++;
    }

    return count;
}

//Создание и обновление цели
function create_or_update_goal(goal) {
    is_new_goal = isNullOrEmpty(goal.GetOptProperty('id'));

    if (is_new_goal) {
        goal_doc = tools.new_doc_by_name("cc_goal", false);
        if (isNullOrEmpty(goal.GetOptProperty('goalmap_id'))) {
            throw 'Missing required fields: goalmap_id';
        }
    } else {
        goal_doc = tools.open_doc(goal.GetOptProperty('id'));
    }

    if (!is_new_goal) {
        if (goal.GetOptProperty('y1_result') != undefined) {
            if (OptInt(goal_doc.TopElem.y1_result) != OptInt(goal.y1_result)) {
                goalmap_doc = tools.open_doc(goal_doc.TopElem.goalmap_id);
                if (isNull(goalmap_doc)) {
                    throw 'Goalmap with ID ' + goal_doc.TopElem.goalmap_id + ' not found';
                }

                if (goalmap_doc.TopElem.is_approved_y1 == true && goalmap_doc.TopElem.is_ready_approved_y2 != true) {
                    goalmap_doc.TopElem.is_approved_y1 = false;
                    goalmap_doc.Save();
                }
            }
        }
    }

    goal_doc.TopElem.LoadData('<x>' + tools.object_to_text(goal, 'xml') + '</x>');
	if(!isNullOrEmpty(goal.GetOptProperty('description'))) {
		goal_doc.TopElem.description = goal.description;
	}

    if(!isNull(goal.GetOptProperty('desc_what_done'))) {
		goal_doc.TopElem.desc_what_done = goal.desc_what_done;
	}

    if(!isNull(goal.GetOptProperty('desc_how_done'))) {
		goal_doc.TopElem.desc_how_done = goal.desc_how_done;
	}

    if (!isNull(goal.GetOptProperty('y1_comment'))) {
        if(goal_doc.TopElem.y1_comment != goal.y1_comment) {
            goal_doc.TopElem.y1_comment = goal.y1_comment;
        }
    }

    if (!isNull(goal.GetOptProperty('y2_comment'))) {
        if(goal_doc.TopElem.y2_comment != goal.y2_comment) {
            goal_doc.TopElem.y2_comment = goal.y2_comment;
        }
    }

	if(!isNull(goal.GetOptProperty('desc_comment_coll'))) {
		goal_doc.TopElem.desc_comment_coll = goal.desc_comment_coll;
	}

    if(!isNull(goal.GetOptProperty('desc_comment_manager'))) {
		goal_doc.TopElem.desc_comment_manager = goal.desc_comment_manager;
	}

    if (is_new_goal) {
        goal_doc.TopElem.number = get_new_goal_number(goal.goalmap_id);

        if (isNullOrEmpty(goal.GetOptProperty('name'))) {
            goalmap_doc = tools.open_doc(goal.goalmap_id);
            if (isNull(goalmap_doc)) {
                throw 'Goalmap with ID ' + goal.goalmap_id + ' not found';
            }

            collaborator = ArrayOptFirstElem(XQuery("sql: SELECT * FROM collaborators WHERE id = " + goalmap_doc.TopElem.collaborator_id));
            if (isNull(collaborator)) {
                throw 'Collaborator with ID ' + goalmap_doc.TopElem.collaborator_id + ' not found';
            }

            period_doc = tools.open_doc(goalmap_doc.TopElem.period_id);
            if (isNull(period_doc)) {
                throw 'Period with ID ' + goalmap_doc.TopElem.period_id + ' not found';
            }

            goal_doc.TopElem.name = period_doc.TopElem.year + ' - ' + collaborator.fullname  + ' №' + goal_doc.TopElem.number;
        }

        goal_doc.BindToDb();
    }
    goal_doc.Save();

    return goal_doc;
}

//Создание всех целей по всем типам целей
function create_all_goals(goalmap_id) {
    goalmap_doc = tools.open_doc(goalmap_id);
    if (isNull(goalmap_doc)) {
        throw 'Goalmap with ID ' + goalmap_id + ' not found';
    }
	goal_numbers = [1,2,3,4];
    period_doc = tools.open_doc(goalmap_doc.TopElem.period_id);
    if (isNull(period_doc)) {
        throw 'Period with ID ' + goalmap_doc.TopElem.period_id + ' not found';
    }

    if (goalmap_doc.TopElem.for_org) {
        for (goal_number in goal_numbers) {
            create_or_update_goal({
                name: period_doc.TopElem.year + ' - ' + 'Организация' + ' №' + goal_number,
                goalmap_id: goalmap_id,
            });
        }
    } else {
        collaborator = ArrayOptFirstElem(XQuery("sql: SELECT * FROM collaborators WHERE id = " + goalmap_doc.TopElem.collaborator_id));
        if (isNull(collaborator)) {
            throw 'Collaborator with ID ' + goalmap_doc.TopElem.collaborator_id + ' not found';
        }

        for (goal_number in goal_numbers) {
            create_or_update_goal({
                name: period_doc.TopElem.year + ' - ' + collaborator.fullname  + ' №' + goal_number,
                goalmap_id: goalmap_id,
				number: goal_number,
            });
        }

		create_or_update_ipr({
                name: period_doc.TopElem.year + ' - ' + collaborator.fullname  + ' - ИПР',
                goalmap_id: goalmap_id,
            });

        create_or_update_okr({
                name: period_doc.TopElem.year + ' - ' + collaborator.fullname  + ' - OKR',
                goalmap_id: goalmap_id,
            });
    }

}

function exist_hr_group(collaborator_id) {
    return ArrayOptFirstElem(XQuery("sql: " +
        " SELECT TOP(1) gcls.id FROM group_collaborators gcls " +
        " INNER JOIN groups gs ON gs.id = gcls.group_id " +
        " WHERE gs.code = 'group_lt' AND gcls.collaborator_id = " + collaborator_id
    )) != undefined;
}

function goalmap_is_editable(goalmap_id) {
    goalmap_doc = tools.open_doc(OptInt(goalmap_id, 0));

    if (isNull(goalmap_doc)) {
        throw 'Goalmap with ID ' + goalmap_id + ' not found';
    }

    current_goalmap_state_doc = tools.open_doc(goalmap_doc.TopElem.state_id);

    switch(current_goalmap_state_doc.TopElem.code) {
        case '7':
            return false;
    }

    return true;
}

function get_fake_positions_by_department(department) {
    return ArraySelectAll(XQuery("sql: " +
        " SELECT * FROM cc_position_to_departments " +
        " WHERE department = '" + department + "'"
    ));
}

function get_collaborator_info(collaborator_id) {
    result = {};
    collaborator = ArrayOptFirstElem(XQuery("sql: " +
        " SELECT cls.*, cl.data.value('(//custom_elems/custom_elem[name=\"department\"]/value)[1]','varchar(50)') department " +
        " FROM collaborators cls INNER JOIN collaborator cl ON cls.id = cl.id " +
        " WHERE cls.id = " + OptInt(collaborator_id, 0)));

    if (isNull(collaborator)) {
        throw 'Collaborator with ID ' + collaborator_id + ' not found';
    }

    return {
        fullname: RValue(collaborator.fullname),
        position: RValue(collaborator.position_name),
        subdivision: RValue(collaborator.position_parent_name),
        department: RValue(collaborator.department)
    }
}

function get_education_program_info() {
    result = ArraySelectAll(XQuery("sql: " +
        " SELECT id, code, name" +
        " FROM cc_education_programs educ "
    ))

    return result;
}

function get_goal_result_types() {
    return ArraySelectAll(XQuery("sql: SELECT * FROM cc_goal_results ORDER BY code ASC"));
}

function getGoalmapData(goalmapid){
	var data = {
        goalmapId: goalmapid,
		workerFio:"",
		workerId:null,
		bossFio:"",
		bossComment:"",
		bossId:null
	};

	stringQuery="sql: "+
        "SELECT "+
            "worker.id AS workerId, "+
            "worker.fullname AS workerFio, "+
            "manager_id AS bossId, "+
            "manager.fullname AS bossFio, "+
            "data.value('(//comment_coll)[1]', 'nvarchar(max)') 'comment_coll', "+
            "data.value('(//comment_manager)[1]', 'nvarchar(max)') 'bossComment' "+
        "FROM cc_goalmaps "+
            "inner join cc_goalmap AS goalmap ON goalmap.id = cc_goalmaps.id "+
            "left join collaborators AS worker ON cc_goalmaps.collaborator_id = worker.id "+
            "left join collaborators AS manager ON cc_goalmaps.manager_id = manager.id "+
        "WHERE "+
            "cc_goalmaps.id = "+goalmapid;
	var elemData = ArrayOptFirstElem(XQuery(stringQuery));

	data.workerFio = String(elemData.workerFio);
	data.workerId = OptInt(elemData.workerId);
	data.bossFio = String(elemData.bossFio);
	data.bossId = OptInt(elemData.bossId);
	data.bossComment = String(elemData.bossComment);
	return data
}
// отправка уведомления Карта целей согласована для карты целей
function sendConfirmedGoalmapNotification(goalmapId){
	var data = getGoalmapData(goalmapId);
    collTe = tools.open_doc(data.workerId).TopElem;
    if (collTe.position_name != "Shift Supervisor" && collTe.position_name != "Assistant Manager" && collTe.position_name != "RGM Trainee")
        tools.create_notification("confirmed_goalmap",data.workerId,tools.object_to_text(data,"json"));
	_notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = goalmapId;
	_notification_doc.TopElem.object_type = 'cc_goalmap';
	_notification_doc.TopElem.collaborator_id = data.workerId;
	_notification_doc.TopElem.description = 'Твоя форма годовых целей согласована, подтверди ознакомление с ней.';
    _notification_doc.TopElem.link = UrlAppendPath(global_settings.settings.portal_base_url, '/_wt/goal_setting_col?goalmap_id=' + goalmapId);
	_notification_doc.TopElem.is_info = false;
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

// отправка уведомления Карта целей согласована (промежуточная оценка) для карты целей
function sendConfirmedIntermediateGoalmapNotification(goalmapId){
    var data = getGoalmapData(goalmapId);
    collTe = tools.open_doc(data.workerId).TopElem;
    if (collTe.position_name != "Shift Supervisor" && collTe.position_name != "Assistant Manager" && collTe.position_name != "RGM Trainee")
        tools.create_notification("confirmed_intermediate_goalmap",data.workerId,tools.object_to_text(data,"json"));
	_notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = goalmapId;
	_notification_doc.TopElem.object_type = 'cc_goalmap';
	_notification_doc.TopElem.collaborator_id = data.workerId;
	_notification_doc.TopElem.description = 'Ознакомься с промежуточной оценкой твоих результатов руководителем';
    _notification_doc.TopElem.link = UrlAppendPath(global_settings.settings.portal_base_url, '/_wt/goal_setting_col?goalmap_id=' + goalmapId);
	_notification_doc.TopElem.is_info = false;
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

// отправка уведомления Карта целей согласована (итоговая оценка) для карты целей
function sendConfirmedFinalGoalmapNotification(goalmapId){
    var data = getGoalmapData(goalmapId);
    collTe = tools.open_doc(data.workerId).TopElem;
    if (collTe.position_name != "Shift Supervisor" && collTe.position_name != "Assistant Manager" && collTe.position_name != "RGM Trainee")
        tools.create_notification("confirmed_intermediate_goalmap",data.workerId,tools.object_to_text(data,"json"));
	_notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = goalmapId;
	_notification_doc.TopElem.object_type = 'cc_goalmap';
	_notification_doc.TopElem.collaborator_id = data.workerId;
	_notification_doc.TopElem.description = 'Ознакомься с годовой оценкой твоих результатов руководителем.';
    _notification_doc.TopElem.link = UrlAppendPath(global_settings.settings.portal_base_url, '/_wt/goal_setting_col?goalmap_id=' + goalmapId);
	_notification_doc.TopElem.is_info = false;
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

// отправка уведомления Карта целей требует доработки для карты целей
function sendReturnToWorkGoalmapNotification(goalmapId){
    var data = getGoalmapData(goalmapId);
    collTe = tools.open_doc(data.workerId).TopElem;
    if (collTe.position_name != "Shift Supervisor" && collTe.position_name != "Assistant Manager" && collTe.position_name != "RGM Trainee")
        tools.create_notification("return_to_work_goalmap",data.workerId,tools.object_to_text(data,"json"));
	_notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = goalmapId;
	_notification_doc.TopElem.object_type = 'cc_goalmap';
	_notification_doc.TopElem.collaborator_id = data.workerId;
	_notification_doc.TopElem.description = 'Руководитель вернул твою форму годовых целей на доработку.';
    _notification_doc.TopElem.link = UrlAppendPath(global_settings.settings.portal_base_url, '/_wt/goal_setting_col?goalmap_id=' + goalmapId);
	_notification_doc.TopElem.is_info = false;
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

// отправка уведомления Карта целей требует доработки (промежуточная оценка) для карты целей
function sendReturnToIntermediateWorkGoalmapNotification(goalmapId){
    var data = getGoalmapData(goalmapId);
    collTe = tools.open_doc(data.workerId).TopElem;
    if (collTe.position_name != "Shift Supervisor" && collTe.position_name != "Assistant Manager" && collTe.position_name != "RGM Trainee")
        tools.create_notification("return_to_intermediate_work_goalmap",data.workerId,tools.object_to_text(data,"json"));
	_notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = goalmapId;
	_notification_doc.TopElem.object_type = 'cc_goalmap';
	_notification_doc.TopElem.collaborator_id = data.workerId;
    _notification_doc.TopElem.link = UrlAppendPath(global_settings.settings.portal_base_url, '/_wt/goal_setting_col?goalmap_id=' + goalmapId)
	_notification_doc.TopElem.description = 'Руководитель вернул оценку твоих результатов на доработку.';
	_notification_doc.TopElem.is_info = false;
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

// отправка уведомления Карта целей требует согласования (промежуточная оценка) для карты целей
function sendReceiveToIntermediateConfirmGoalmapNotification(goalmapId){
    var data = getGoalmapData(goalmapId);
    collTe = tools.open_doc(data.bossId).TopElem;
    if (collTe.position_name != "Shift Supervisor" && collTe.position_name != "Assistant Manager" && collTe.position_name != "RGM Trainee")
        tools.create_notification("receive_to_intermediate_confirm_goalmap",data.bossId,tools.object_to_text(data,"json"));
	_notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = goalmapId;
	_notification_doc.TopElem.object_type = 'cc_goalmap';
	_notification_doc.TopElem.collaborator_id = data.bossId;
    _notification_doc.TopElem.link = UrlAppendPath( global_settings.settings.portal_base_url, '/_wt/goal_setting_col?col_id=' + data.workerId + '&goalmap_id=' + goalmapId);
	_notification_doc.TopElem.description = 'Оцени результаты сотрудника ' + data.workerFio;
	_notification_doc.TopElem.is_info = false;
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

// отправка уведомления Карты целей созданы для карты целей
function sendCreateGoalmapNotification(goalmapId){
    var data = getGoalmapData(goalmapId);
    collTe = tools.open_doc(data.workerId).TopElem;
    if (collTe.position_name != "Shift Supervisor" && collTe.position_name != "Assistant Manager" && collTe.position_name != "RGM Trainee")
        tools.create_notification("create_goalmap",data.workerId,tools.object_to_text(data,"json"));
	_notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = goalmapId;
	_notification_doc.TopElem.object_type = 'cc_goalmap';
	_notification_doc.TopElem.collaborator_id = data.workerId;
    _notification_doc.TopElem.link = UrlAppendPath(global_settings.settings.portal_base_url, '/_wt/goal_setting_col?goalmap_id=' + goalmapId);
	_notification_doc.TopElem.description = data.workerFio + ', заполни форму годовых целей';
	_notification_doc.TopElem.is_info = false;
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

// отправка уведомления Отзыв карты целей для карты целей
function sendCancelSendToConfirmGoalmapNotification(goalmapId){
    var data = getGoalmapData(goalmapId);
    collTe = tools.open_doc(data.bossId).TopElem;
    if (collTe.position_name != "Shift Supervisor" && collTe.position_name != "Assistant Manager" && collTe.position_name != "RGM Trainee")
        tools.create_notification("cancel_send_to_confirm_goalmap",data.bossId,tools.object_to_text(data,"json"));
	_notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = goalmapId;
	_notification_doc.TopElem.object_type = 'cc_goalmap';
	_notification_doc.TopElem.collaborator_id = data.bossId;
    _notification_doc.TopElem.link = UrlAppendPath( global_settings.settings.portal_base_url, '/_wt/goal_setting_col?col_id=' + data.workerId + '&goalmap_id=' + goalmapId);
	_notification_doc.TopElem.description = 'Форма годовых целей отозвана - ' + data.workerFio;
	_notification_doc.TopElem.is_info = false;
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

// отправка уведомления Оценки карты целей для карты целей
function sendNotificationFillGoalmapNotification(goalmapId){
    var data = getGoalmapData(goalmapId);
    collTe = tools.open_doc(data.workerId).TopElem;
    if (collTe.position_name != "Shift Supervisor" && collTe.position_name != "Assistant Manager" && collTe.position_name != "RGM Trainee")
        tools.create_notification("notification_fill_goalmap",data.workerId,tools.object_to_text(data,"json"));
	_notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = goalmapId;
	_notification_doc.TopElem.object_type = 'cc_goalmap';
	_notification_doc.TopElem.collaborator_id = data.workerId;
    _notification_doc.TopElem.link = UrlAppendPath(global_settings.settings.portal_base_url, '/_wt/goal_setting_col?goalmap_id=' + goalmapId);
	_notification_doc.TopElem.description = 'Напоминание о необходимости заполнить карту целей';
	_notification_doc.TopElem.is_info = false;
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

// отправка уведомления Согласование карты целей для карты целей
function sendReceiveToConfirmGoalmapNotification(goalmapId){
    var data = getGoalmapData(goalmapId);
    collTe = tools.open_doc(data.bossId).TopElem;
    if (collTe.position_name != "Shift Supervisor" && collTe.position_name != "Assistant Manager" && collTe.position_name != "RGM Trainee")
        tools.create_notification("receive_to_confirm_goalmap",data.bossId,tools.object_to_text(data,"json"));
	_notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = goalmapId;
	_notification_doc.TopElem.object_type = 'cc_goalmap';
	_notification_doc.TopElem.collaborator_id = data.bossId;
    _notification_doc.TopElem.link = UrlAppendPath( global_settings.settings.portal_base_url, '/_wt/goal_setting_col?col_id=' + data.workerId + '&goalmap_id=' + goalmapId);
	_notification_doc.TopElem.description = 'Согласуй годовые цели сотрудника ' + data.workerFio;
	_notification_doc.TopElem.is_info = false;
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

function move_goalmap_by_workflow(goalmap, action_name) {
    goalmap_doc = tools.open_doc(goalmap.id);
    if (isNull(goalmap_doc)) {
        throw 'Goalmap with ID ' + goalmap.id + ' not found';
    }

    current_goalmap_state_doc = tools.open_doc(goalmap_doc.TopElem.state_id);
    current_state_code = current_goalmap_state_doc.TopElem.code;

    switch(action_name) {
        case 'send_to_approve':
            if (current_state_code == '0') {
                update_goalmap(goalmap);
            }

            if (current_state_code == '0' || current_state_code == '2') {
                update_goalmap_state(goalmap.id, 1);
                sendReceiveToConfirmGoalmapNotification(goalmap.id);
            }

            if (current_state_code == '4' || current_state_code == '5') {
                update_goalmap_state(goalmap.id, 6);
                sendReceiveToIntermediateConfirmGoalmapNotification(goalmap.id);
            }
            break;

        case 'approve':
            if (current_state_code == '1') {
                update_goalmap_state(goalmap.id, 3);
                sendConfirmedGoalmapNotification(goalmap.id);
            }

            if (current_state_code == '6') {
                if ((goalmap.GetOptProperty('is_approved_y1',false) && goalmap_doc.TopElem.is_approved_y2)||
					(goalmap.GetOptProperty('is_approved_y2',false) && goalmap_doc.TopElem.is_approved_y1 )) {
                    update_goalmap(goalmap);
                    update_goalmap_state(goalmap.id, 8);
                    sendConfirmedFinalGoalmapNotification(goalmap.id);
                }
				else {
                    need_update_goalmap = false

					if (goalmap.GetOptProperty('is_approved_y1',false) != goalmap_doc.TopElem.is_approved_y1) {
                        need_update_goalmap = true;
                    }
					if (goalmap.GetOptProperty('is_approved_y2',false) != goalmap_doc.TopElem.is_approved_y2) {
                        need_update_goalmap = true;
                    }

                    if (need_update_goalmap) {
                        update_goalmap(goalmap);
                        update_goalmap_state(goalmap.id, 4);
                        sendConfirmedIntermediateGoalmapNotification(goalmap.id);
                    }
                }
            }
            break;

        case 'cancel_send_to_approve':
            if (current_state_code == '1') {
                update_goalmap_state(goalmap.id, 0);
                sendCancelSendToConfirmGoalmapNotification(goalmap.id);
            }

            if (current_state_code == '6') {
                update_goalmap_state(goalmap.id, 4);
                sendCancelSendToConfirmGoalmapNotification(goalmap.id);
            }
            break;

        case 'return_to_work':
            if (current_state_code == '1') {
                update_goalmap_state(goalmap.id, 2);
                update_goalmap(goalmap);
                sendReturnToWorkGoalmapNotification(goalmap.id);
            }

            if (current_state_code == '6') {
                update_goalmap_state(goalmap.id, 5);
                update_goalmap(goalmap);
                sendReturnToIntermediateWorkGoalmapNotification(goalmap.id);
            }
            break;

        case 'confirm':
            update_goalmap_state(goalmap.id, 4);
            break;
		case 'compleated':
            update_goalmap_state(goalmap.id, 7);
            break;
    }
}

function permissionRulesGoalmap(goalmap_id, cur_user_id) {
    goalmap_doc = tools.open_doc(goalmap_id);
    if (isNull(goalmap_doc)) {
        throw 'Goalmap with ID ' + goalmap_id + ' not found';
    }

    if (isNullOrEmpty(cur_user_id)) {
        throw 'Incorrect cur_user_id';
    }

    rules = {
        add: false,
		drop: false,
        edit_desc: false,
        edit_psr: false,
        edit_result_main: false,
        show_result_main: false,
		show_finish_mark: false,
        send_to_approve: false,
        send_to_approve_select_boss: false,
        available_bosses: [],
        approve: false,
        approve_by_halfyear: false,
        cancel_send_to_approve: false,
        return_to_work: false,
        confirm: false,
		final_confirm: false,
    }
    current_goalmap_state_doc = tools.open_doc(goalmap_doc.TopElem.state_id);
    current_state_code = current_goalmap_state_doc.TopElem.code;

    cur_user_doc = tools.open_doc(cur_user_id);
if (goalmap_doc.TopElem.collaborator_id == cur_user_id) {
        switch(current_state_code) {
            case '0':
                if (cur_user_doc.TopElem.position_name == 'RSC' || cur_user_doc.TopElem.position_name == 'RSC Contractor') {
                    rules.send_to_approve_select_boss = true;
                    rules.available_bosses = ArraySelectAll(XQuery("sql: " +
                        " SELECT id FROM collaborators WHERE id != " + goalmap_doc.TopElem.collaborator_id + " AND ISNULL(is_dismiss, 0) != 1 AND position_parent_id = " + cur_user_doc.TopElem.position_parent_id
                    ));
                }
                rules.edit_salary = true;
                rules.edit_psr = true;
            case '2':
                rules.add = true;
                rules.drop = true;
                rules.edit_psr = true;
                rules.edit_desc = true;
                rules.send_to_approve = true;
                rules.edit_salary = true;
                break;
            case '1':
                rules.cancel_send_to_approve = true;
                break;
            case '3':
				rules.confirm = true;
                break;
            case '4':
            case '5':
				rules.add = !goalmap_doc.TopElem.is_approved_y1 || goalmap_doc.TopElem.is_ready_approved_y2;
				rules.edit_desc = !goalmap_doc.TopElem.is_ready_approved_y2;
                rules.edit_salary = true;
                rules.edit_psr = true;
                rules.edit_result_main = true;
                rules.show_result_main = true;
                rules.send_to_approve = !goalmap_doc.TopElem.is_approved_y1 || (!goalmap_doc.TopElem.is_approved_y2 && goalmap_doc.TopElem.is_ready_approved_y2);
                break;
            case '6':
                rules.show_result_main = true;
                rules.show_finish_mark = true;
                rules.cancel_send_to_approve = true;
                break;
            case '7':
                rules.show_result_main = true;
                break;
			case '8':
                rules.confirm = true;
                rules.final_confirm = true;
                rules.show_result_main = true;
                rules.show_finish_mark = true;
                break;
        }
    } else if (goalmap_doc.TopElem.manager_id == cur_user_id) {
        switch(current_state_code) {
            case '1':
                rules.approve = true;
                rules.return_to_work = true;
                rules.edit_desc = true;
                rules.edit_salary = true;
                rules.edit_psr = true;
                break;
            case '4':
            case '5':
                rules.show_result_main = true;
                break;
            case '6':
				rules.show_result_main = true;
                rules.edit_result_main = true;
                rules.approve = true;
                rules.approve_by_halfyear = true;
                rules.return_to_work = true;
                rules.edit_salary = true;
                rules.edit_psr = true;
                break;
            case '7':
            case '8':
                rules.show_result_main = true;
                rules.show_result_main = true;
                rules.show_finish_mark = true;
                break;
        }
    }

    return rules;
}

function getApproveManagerId(cur_user_id) {
    return RValue(ArrayOptFirstElem(XQuery("sql: " +
        " DECLARE " +
        " @cur_user_id BIGINT = " + OptInt(cur_user_id, 0) + "; " +
        "  " +
        " SELECT TOP(1) fms.person_id FROM func_managers fms " +
        " WHERE fms.object_id = @cur_user_id " +
        " ORDER BY fms.person_id "
    ), {person_id: null}).person_id);
}

function getApproveManager(cur_user_id) {
    manager = ArrayOptFirstElem(XQuery("sql: " +
        " SELECT TOP(1) fms.person_id manager_id, fms.person_fullname fullname FROM func_managers fms " +
        " WHERE fms.object_id = " + cur_user_id +
        " ORDER BY fms.person_id "
    ));

    if (isNull(manager)) {
        throw 'Incorrect manager_id';
    }
    return manager;
}

function getGoalmapInfo(goalmap_id) {
    return ArrayOptFirstElem(XQuery("sql: " +
        " DECLARE " +
        " @goalmap_id BIGINT = " + OptInt(goalmap_id, 0) + "; " +
        " SELECT " +
		" 	gms.*, " +
        "   gmss.code 'state_code', " +
		" 	gmss.name 'state_name'," +
		" 	mcls.fullname 'manager_fullname'," +
		" 	ISNULL(res.name,'') 'finish_goals_mark_name'," +
        "   posdep.position_name, " +
        "   gm.data.value('(//comment_coll)[1]', 'nvarchar(max)') 'comment_coll', " +
		"   gm.data.value('(//comment_manager)[1]', 'nvarchar(max)') 'comment_manager' " +
		" FROM cc_goalmaps gms " +
        " 	INNER JOIN cc_goalmap gm ON gm.id = gms.id " +
		" 	INNER JOIN cc_goalmap_states gmss ON gmss.id = gms.state_id " +
		" 	LEFT JOIN collaborators mcls ON mcls.id = gms.manager_id" +
		" 	LEFT JOIN cc_goal_results res ON res.id = gms.finish_goals_mark" +
        "   LEFT JOIN cc_position_to_departments posdep ON gms.fake_position_id = posdep.id" +
        " WHERE gms.id = @goalmap_id "
    ));
}

//Создание и обновление okr
function create_or_update_okr(okr) {
    is_new_okr = isNullOrEmpty(okr.GetOptProperty('id'));

    if (is_new_okr) {
        okr_doc = tools.new_doc_by_name("cc_okr", false);
        if (isNullOrEmpty(okr.GetOptProperty('goalmap_id'))) {
            throw 'Missing required fields: goalmap_id';
        }
    } else {
        okr_doc = tools.open_doc(okr.GetOptProperty('id'));
    }

    if (!is_new_okr) {
        if (okr.GetOptProperty('y1_result') != undefined) {
            if (OptInt(okr_doc.TopElem.y1_result) != OptInt(okr.y1_result)) {
                goalmap_doc = tools.open_doc(okr_doc.TopElem.goalmap_id);
                if (isNull(goalmap_doc)) {
                    throw 'Goalmap with ID ' + okr_doc.TopElem.goalmap_id + ' not found';
                }

                if (goalmap_doc.TopElem.is_approved_y1 == true && goalmap_doc.TopElem.is_ready_approved_y2 != true) {
                    goalmap_doc.TopElem.is_approved_y1 = false;
                    goalmap_doc.Save();
                }
            }
        }
    }

    okr_doc.TopElem.LoadData('<x>' + tools.object_to_text(okr, 'xml') + '</x>');
	if(!isNullOrEmpty(okr.GetOptProperty('description'))) {
		okr_doc.TopElem.description = okr.description;
	}

	if(!isNullOrEmpty(okr.GetOptProperty('actions'))) {
		okr_doc.TopElem.actions = okr.actions;
	}

    if (!isNull(okr.GetOptProperty('y1_comment'))) {
        if(okr_doc.TopElem.y1_comment != okr.y1_comment) {
            okr_doc.TopElem.y1_comment = okr.y1_comment;
        }
    }

    if (!isNull(okr.GetOptProperty('y2_comment'))) {
        if(okr_doc.TopElem.y2_comment != okr.y2_comment) {
            okr_doc.TopElem.y2_comment = okr.y2_comment;
        }
    }

	if(!isNull(okr.GetOptProperty('desc_comment_coll'))) {
		okr_doc.TopElem.desc_comment_coll = okr.desc_comment_coll;
	}

    if(!isNull(okr.GetOptProperty('desc_comment_manager'))) {
		okr_doc.TopElem.desc_comment_manager = okr.desc_comment_manager;
	}

    if (is_new_okr) {
        okr_doc.BindToDb();

        if (isNullOrEmpty(okr.GetOptProperty('name'))) {
            goalmap_doc = tools.open_doc(okr.goalmap_id);
            if (isNull(goalmap_doc)) {
                throw 'Goalmap with ID ' + okr.goalmap_id + ' not found';
            }

            collaborator = ArrayOptFirstElem(XQuery("sql: SELECT * FROM collaborators WHERE id = " + goalmap_doc.TopElem.collaborator_id));
            if (isNull(collaborator)) {
                throw 'Collaborator with ID ' + goalmap_doc.TopElem.collaborator_id + ' not found';
            }

            period_doc = tools.open_doc(goalmap_doc.TopElem.period_id);
            if (isNull(period_doc)) {
                throw 'Period with ID ' + goalmap_doc.TopElem.period_id + ' not found';
            }

            okr_doc.TopElem.name = period_doc.TopElem.year + ' - ' + collaborator.fullname  + ' - OKR';
        }
    }
    okr_doc.Save();

    return okr_doc;
}

//Получение всех okr по карте целей
function get_okrs(goalmap_id) {
	query = "sql: " +
        " SELECT " +
		"		DISTINCT okrs.*," +
		"		ISNULL(FORMAT(plan_date, 'dd.MM.yyyy'), 'Не указан') 'plan_date_str'," +
		"		okr.data.value('(//description)[1]', 'nvarchar(max)') 'description'," +
        " 	    okr.data.value('(//desc_comment_coll)[1]', 'nvarchar(max)') 'desc_comment_coll', " +
		" 	    okr.data.value('(//desc_comment_manager )[1]', 'nvarchar(max)') 'desc_comment_manager ', " +
		"		okr.data.value('(//actions)[1]', 'nvarchar(max)') 'actions'" +
		"	FROM cc_okrs okrs " +
		"		LEFT JOIN cc_okr okr ON okrs.id = okr.id" +
		" WHERE okrs.goalmap_id = " + OptInt(goalmap_id, 0);

    return ArraySelectAll(XQuery(query));
}


// Проверка достигнуто ли максимальное количество ИПР на карту целей
function check_maximum_iprs(goalmap_id) {
    query = "sql: " +
        " SELECT COUNT(*) 'count_iprs' " +
        " FROM cc_iprs " +
        " WHERE goalmap_id = " + OptInt(goalmap_id, 0);

    count_iprs = ArrayOptFirstElem(XQuery(query), {count_iprs: 0}).count_iprs;

    if (count_iprs == 3) {
        return true;
    }

    return false;
}

// Создание и обновление  ипр
function create_or_update_ipr(ipr) {
    is_new_ipr = isNullOrEmpty(ipr.GetOptProperty('id'));

    if (is_new_ipr) {
        ipr_doc = tools.new_doc_by_name("cc_ipr", false);
        if (isNullOrEmpty(ipr.GetOptProperty('goalmap_id'))) {
            throw 'Missing required fields: goalmap_id';
        }
    } else {
        ipr_doc = tools.open_doc(ipr.GetOptProperty('id'));
    }

    if (!is_new_ipr) {
        if (ipr.GetOptProperty('y1_result') != undefined) {
            if (OptInt(ipr_doc.TopElem.y1_result) != OptInt(ipr.y1_result)) {
                goalmap_doc = tools.open_doc(ipr_doc.TopElem.goalmap_id);
                if (isNull(goalmap_doc)) {
                    throw 'Goalmap with ID ' + ipr_doc.TopElem.goalmap_id + ' not found';
                }

                if (goalmap_doc.TopElem.is_approved_y1 == true && goalmap_doc.TopElem.is_ready_approved_y2 != true) {
                    goalmap_doc.TopElem.is_approved_y1 = false;
                    goalmap_doc.Save();
                }
            }
        }
    }

    ipr_doc.TopElem.LoadData('<x>' + tools.object_to_text(ipr, 'xml') + '</x>');

    if(!isNullOrEmpty(ipr.GetOptProperty('skill_type'))) {
		ipr_doc.TopElem.skill_type = ipr.skill_type;
	}

	if(!isNullOrEmpty(ipr.GetOptProperty('description'))) {
		ipr_doc.TopElem.description = ipr.description;
	}

    if(!isNullOrEmpty(ipr.GetOptProperty('competence_id'))) {
		ipr_doc.TopElem.competence_id = ipr.competence_id;
	}

	if(!isNullOrEmpty(ipr.GetOptProperty('actions'))) {
		ipr_doc.TopElem.actions = ipr.actions;
	}

    if (!isNull(ipr.GetOptProperty('y1_comment'))) {
        if(ipr_doc.TopElem.y1_comment != ipr.y1_comment) {
            ipr_doc.TopElem.y1_comment = ipr.y1_comment;
        }
    }

    if (!isNull(ipr.GetOptProperty('y2_comment'))) {
        if(ipr_doc.TopElem.y2_comment != ipr.y2_comment) {
            ipr_doc.TopElem.y2_comment = ipr.y2_comment;
        }
    }

    if(!isNullOrEmpty(ipr.GetOptProperty('resource'))) {
		ipr_doc.TopElem.resource = ipr.resource;
	}

	if(!isNull(ipr.GetOptProperty('desc_comment_coll'))) {
		ipr_doc.TopElem.desc_comment_coll = ipr.desc_comment_coll;
	}

    if(!isNull(ipr.GetOptProperty('desc_comment_manager'))) {
		ipr_doc.TopElem.desc_comment_manager = ipr.desc_comment_manager;
	}
	if (is_new_ipr) {
        ipr_doc.BindToDb();
    }
    ipr_doc.Save();

    return ipr_doc;
}

//Получение всех ипр по карте целей
function get_iprs(goalmap_id, include_non_actual) {
        if (include_non_actual) {
            condition = '';
        } else {
            condition = "AND ISNULL(y1_grs.code, '') <> 'n' AND ISNULL(y2_grs.code, '') <> 'n' ";
        }
        query = "sql: " +
        " SELECT " +
        " 	iprs.*, " +
        " 	ISNULL(FORMAT(plan_date, 'dd.MM.yyyy'), 'Не указан') 'plan_date_str', " +
        " 	y1_grs.name 'y1_result_name', " +
        " 	y2_grs.name 'y2_result_name', " +
        " 	comp.name 'competence_name', " +
        "   CASE " +
        "       WHEN ipr.data.value('(//skill_type)[1]', 'nvarchar(max)') = 'hard' THEN ipr.data.value('(//description)[1]', 'nvarchar(max)') " +
        "       WHEN ipr.data.value('(//skill_type)[1]', 'nvarchar(max)') = 'soft' THEN comp.name " +
        "   ELSE '' " +
        "   END AS title, " +
		"   ipr.data.value('(//description)[1]', 'nvarchar(max)') 'description', " +
        "   ipr.data.value('(//skill_type)[1]', 'nvarchar(max)') 'skill_type', " +
        "   ipr.data.value('(//competence_id)[1]', 'bigint') 'competence_id', " +
        "   ipr.data.value('(//cc_education_program_id)[1]', 'bigint') 'cc_education_program_id', " +
        " 	ipr.data.value('(//desc_comment_coll)[1]', 'nvarchar(max)') 'desc_comment_coll', " +
		" 	ipr.data.value('(//desc_comment_manager )[1]', 'nvarchar(max)') 'desc_comment_manager ', " +
		"	ipr.data.value('(//actions)[1]', 'nvarchar(max)') 'actions'" +
        " FROM cc_iprs iprs " +
        " LEFT JOIN competences comp ON comp.id = iprs.competence_id " +
        " LEFT JOIN cc_goal_results y1_grs ON y1_grs.id = iprs.y1_result " +
        " LEFT JOIN cc_goal_results y2_grs ON y2_grs.id = iprs.y2_result " +
		" LEFT JOIN cc_ipr ipr ON iprs.id = ipr.id" +
        " WHERE goalmap_id = " + OptInt(goalmap_id, 0) + " " + condition + " "

    return ArraySelectAll(XQuery(query));
}

// Получение содержимых полей Риск/Потенциал/Навык
function get_rps() {
    result = {
        escape_risk: [],
        potencial_coll: [],
        skill_level: []
    }

    query = "sql: " +
    " SELECT " +
    " 	escape_risk.id 'id', " +
    " 	escape_risk.name 'name', " +
    " 	escape_risk.code 'code' " +
    " FROM cc_escape_risks escape_risk "

    result.escape_risk = ArraySelectAll(XQuery(query));

    query = "sql: " +
    " SELECT " +
    " 	potencial_coll.id 'id', " +
    " 	potencial_coll.name 'name', " +
    " 	potencial_coll.code 'code' " +
    " FROM cc_potencial_colls potencial_coll "

    result.potencial_coll = ArraySelectAll(XQuery(query));

    query = "sql: " +
    " SELECT " +
    " 	skill_level.id 'id', " +
    " 	skill_level.name 'name', " +
    " 	skill_level.code 'code' " +
    " FROM cc_skill_levels skill_level "

    result.skill_level = ArraySelectAll(XQuery(query));

    return result;
}

//Получение данных для вкладки Развитие и потенциал
function get_gap(goalmap_id) {
    query = "sql: " +
    " SELECT " +
    "   goalmaps.id goalmap_id, " +
    " 	potencial_coll.code 'potencial_coll_code', " +
    " 	potencial_coll.name 'potencial_coll_name', " +
    " 	skill_level.code 'skill_level_code', " +
    " 	skill_level.name 'skill_level_name', " +
    " 	escape_risk.code 'escape_risk_code', " +
    " 	escape_risk.name 'escape_risk_name', " +
    "   goalmaps.current_salary 'current_salary'," +
    "   goalmaps.want_salary 'want_salary', " +
    "   goalmap.data.value('(//comment_by_grow)[1]', 'nvarchar(max)') 'comment_by_grow', " +
    "   goalmap.data.value('(//comment_manager_by_grow)[1]', 'nvarchar(max)') 'comment_manager_by_grow' " +
    " FROM cc_goalmaps goalmaps " +
    " LEFT JOIN cc_potencial_colls  potencial_coll ON potencial_coll.id = goalmaps.potencial_coll_id " +
    " LEFT JOIN cc_skill_levels skill_level ON skill_level.id = goalmaps.skill_level_id " +
    " LEFT JOIN cc_escape_risks escape_risk ON escape_risk.id = goalmaps.escape_risk_id " +
    " LEFT JOIN cc_goalmap goalmap ON goalmaps.id = goalmap.id" +
    " WHERE goalmap.id = " + OptInt(goalmap_id, 0)

    result = ArrayOptFirstElem(XQuery(query));

    return result;
}

//Удалить цель
function drop_goal(goal_id) {
	goal_doc = tools.open_doc(OptInt(goal_id));
	if (isNullOrEmpty(goal_doc)) {
		throw "Invalid goal ID";
	}

	var goalmap_id = goal_doc.TopElem.goalmap_id;
	if (isNullOrEmpty(goalmap_id)) {
		throw 'Goalmap with ID ' + goalmap_id + ' not found';
	}

	var goalmap_doc = tools.open_doc(goalmap_id);
	if (isNullOrEmpty(goalmap_doc)) {
		throw "Invalid goalmap ID";
	}

	DeleteDoc(UrlFromDocID(OptInt(goal_id)));

	var goals = get_goals_doc(goalmap_id);

    var count = 1;
    for (goal_doc in goals) {
        if (isNullOrEmpty(goal_doc)) {
            continue;
        }
        goal_doc.TopElem.number = count;

        collaborator = ArrayOptFirstElem(XQuery("sql: SELECT * FROM collaborators WHERE id = " + goalmap_doc.TopElem.collaborator_id));
        if (isNull(collaborator)) {
            throw 'Collaborator with ID ' + goalmap_doc.TopElem.collaborator_id + ' not found';
        }

        period_doc = tools.open_doc(goalmap_doc.TopElem.period_id);
        if (isNull(period_doc)) {
            throw 'Period with ID ' + goalmap_doc.TopElem.period_id + ' not found';
        }
        goal_doc.TopElem.name = period_doc.TopElem.year + ' - ' + collaborator.fullname  + ' №' + goal_doc.TopElem.number;

        goal_doc.Save();
        count++;
    }
}

//Получение id компетенций из профиля компетенций 360 unirest
function get_competences_ids_str() {
	var query = "sql: SELECT cp.id FROM competence_profiles cp WHERE cp.code = 'goal_setting_profile'";
	var result = new Array;
	var query_resp = XQuery(query);

	var competence_profile = ArrayOptFirstElem(query_resp);

	if (isNull(competence_profile)) {
		return '0';
	}
	var competence_profile_doc = tools.open_doc(OptInt(competence_profile.id));
    if (isNullOrEmpty(competence_profile_doc)) {
		return '0';
	}
	var competences = competence_profile_doc.TopElem.competences;

	for (competence in competences) {
		result.push(competence.competence_id);
	}
	return result.join(';');
}
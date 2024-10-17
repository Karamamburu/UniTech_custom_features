function isNotCorrectBSC() {
	if(getParam(arrFormFields, "q8") != undefined) {
		if(OptReal(getParam(arrFormFields, "q8")) < 1 || OptReal(getParam(arrFormFields, "q8")) > 5) {
			return true;
		}
		return false;
	}
	return false;
}

function getParam(_arrFormFields, _sName)
{
	result = "";
	try
	{
		_tmpFld = ArrayOptFind(_arrFormFields, "This.name=='" + _sName + "'");
		result = _tmpFld != undefined ? String(_tmpFld.value) : PARAMETERS.GetOptProperty(_sName);
	}
	catch (_err)
	{
		result = "";
		return result;
	}
	return result;
}

///FORM
function getFormMessage(_sMessage)
{
	var oForm;
	oForm = {
		command: "alert",
		msg: _sMessage,
		confirm_result: {
			//command: "reload_page"
			command: "close_form"
		}
	}

	return oForm;
}
function getFormMessageNoReload(_sMessage)
{
	var oForm;
	oForm = {
		command: "alert",
		msg: _sMessage
	}

	return oForm;
}
function getFormSelectCollaborators()
{
	var oForm;
	
	query_qual = " $elem/is_dismiss != true() and $elem/is_candidate != true() and $elem/is_outstaff != true()";
	
	oForm =
	{
		command: "display_form",
		height: 500,
		title: "Выбор сотрудников",
		message: "Выберите сотрудников",
		form_fields:
			[
				{
					name: "step",
					type: "hidden",
					value: "1"
				},
				{
					name: "personIDs",
					label: ms_tools.get_const('c_collaborators'),
					type: "foreign_elem",
					catalog: "collaborator",
					multiple: true,
					mandatory: true,
					query_qual: query_qual,
					value: "",
					title: "Выберите сотрудников"
				},
			],
		buttons:
			[
				{ name: "cancel", label: ms_tools.get_const('c_cancel'), type: "cancel", css_class: "btn-submit-custom" },
				{ name: "submit", label: "Далее", type: "submit", css_class: "btn-cancel-custom" }
			],
		no_buttons: false
	};
	return oForm;
}
function getFormSelectParamCustomTemplate(_arrFormFields)
{
	var oForm;
	_sPersonIDs = "";
	if (getParam(_arrFormFields, "personIDs") == undefined || getParam(_arrFormFields, "personIDs") == "")
	{
		try
		{
			_sPersonIDs = SELECTED_OBJECT_IDS + "";
		}
		catch (_err)
		{
			_sPersonIDs = "";
		}
		if (_sPersonIDs == "")
		{
			try
			{
				_sPersonIDs = OBJECT_ID + "";
			}
			catch (_err)
			{
				_sPersonIDs = "";
			}
		}
		if (_sPersonIDs == "")
		{
			try
			{
				_sPersonIDs = curObjectID + "";
			}
			catch (_err)
			{
				_sPersonIDs = "";
			}
		}
	}
	else
		_sPersonIDs = getParam(_arrFormFields, "personIDs") + "";

	arrSubdivisions = ArraySelectAll(XQuery("sql:
		DECLARE
		@cur_user_id BIGINT = " + curUserID + ";

		WITH my_parent_subdiv AS (
			SELECT sds.* FROM subdivisions sds
			INNER JOIN positions ps ON ps.parent_object_id = sds.id
			INNER JOIN collaborators cls ON cls.id = ps.basic_collaborator_id AND cls.id = @cur_user_id
			UNION ALL
			SELECT sds.* FROM subdivisions sds
			INNER JOIN my_parent_subdiv psds ON psds.parent_object_id = sds.id
		),
		all_subdiv_by_parent AS (
			SELECT psds.* FROM my_parent_subdiv psds
			INNER JOIN subdivision sd ON sd.id = psds.id AND (sd.data.value('(/subdivision/custom_elems/custom_elem[name=''subdivision_type'']/value)[1]', 'varchar(50)') = 'Франшиза' OR (psds.parent_object_id IS NULL AND psds.name = 'Corporate'))
			UNION ALL
			SELECT sds.* FROM subdivisions sds
			INNER JOIN all_subdiv_by_parent all_sds ON all_sds.id = sds.parent_object_id
		)
		SELECT DISTINCT id FROM all_subdiv_by_parent all_sds
	"));

	arrPositions = ['Area Coach', 'Market Coach', 'RSC', 'Owner', 'Region Coach', 'Franchise Business Coach', 'Key Operator', 'Area Coach Trainee'];

	arrColls = ArraySelectAll(XQuery("sql: " +
		" DECLARE " +
		" @group_code NVARCHAR(max) = 'group_additional_expert_for_certification_rgm'; " +
		"  " +
		" SELECT cls.id FROM collaborators cls " +
		" INNER JOIN group_collaborators gcls ON gcls.collaborator_id = cls.id " +
		" INNER JOIN groups gs ON gs.id = gcls.group_id " +
		" WHERE gcls.code = @group_code "
	));

	sCondition = "";

	if (ArrayOptFirstElem(arrSubdivisions) != undefined) {
		sCondition = "(";

		for (s in arrSubdivisions) {
			sCondition += " position_parent_id = '" + s.id + "' or";
		}
		sCondition = StrLeftRange(sCondition, StrLen(sCondition) - 2);

		sCondition += ")";
	}

	if (ArrayOptFirstElem(arrPositions) != undefined) {
		if (sCondition != '') {
			sCondition += " and ";	
		}
		sCondition += "(";

		for (pos in arrPositions) {
			sCondition += " position_name = '" + pos + "' or";
		}
		sCondition = StrLeftRange(sCondition, StrLen(sCondition) - 2);

		sCondition += ")";
	}

	if (sCondition != '') {
		sCondition += " and ";	
	}
	sCondition += " (is_dismiss != 1) ";

	if (ArrayOptFirstElem(arrColls) != undefined) {
		if (sCondition != '') {
			sCondition = "(" + sCondition + ")";
			sCondition += " or ";
		}
		sCondition += "(";

		for (coll in arrColls) {
			sCondition += " id = '" + coll.id + "' or";
		}
		sCondition = StrLeftRange(sCondition, StrLen(sCondition) - 2);

		sCondition += ")";
	}

	arrTestLearnings = ArraySelectAll(XQuery("sql:
		DECLARE
		@person_id BIGINT = " + _sPersonIDs + ";

		SELECT DISTINCT prgms.test_learning_id FROM cc_presentation_rgms prgms
		INNER JOIN test_learnings tls ON tls.id = prgms.test_learning_id AND tls.state_id = 4
		WHERE prgms.person_id = @person_id
	"));

	sTestLearningCondition = " id = 0 ";

	if (ArrayOptFirstElem(arrTestLearnings) != undefined) {
		sTestLearningCondition = "";

		for (testLearning in arrTestLearnings) {
			sTestLearningCondition += " id = '" + testLearning.test_learning_id + "' or";
		}

		sTestLearningCondition = StrLeftRange(sTestLearningCondition, StrLen(sTestLearningCondition) - 2);
	}

	oForm =
	{
		command: "display_form",
		title: "Запустить процесс сертификации",
		message: "Заполните данные для запуска процедуры оценки",
		form_fields:
			[
				{
					name: "step",
					type: "hidden",
					value: "2"
				},
				{
					name: "personIDs",
					type: "hidden",
					value: _sPersonIDs
				},
				{
					name: "collab",
					label: "ФИО кандидата",
					type: "foreign_elem",
					catalog: "collaborator",
					multiple: false,
					mandatory: true,
					value: _sPersonIDs, 
					validation: "nonempty",
					disabled: true,
                    column: 1,
				},
				{
					name: "q1", 
					label: "Почему рекомендуете этого кандидата?", 
					type: "text",
					value: "", 
					mandatory: true, 
					validation: "nonempty" 
				},
				{ 
					name: "q2", 
					label: "Какие основные достижения кандидата?", 
					type: "text", 
					value: "", 
					mandatory: true, 
					validation: "nonempty" 
				},
				{ 
					name: "q3", 
					label: "Какие проекты ведет кандидат?", 
					type: "text", 
					value: "", 
					mandatory: true, 
					validation: "nonempty" 
				},
				{ 
					name: "q4", 
					label: "Какие компетенции наиболее развиты?", 
					type: "text", 
					value: "", 
					mandatory: true, 
					validation: "nonempty" 
				},
				{ 
					name: "q5", 
					label: "Дополнительная информация (награды, участие в классах, тренингах, открытие новых ресторанов, все важное и интересное)", 
					type: "text", 
					value: "", 
					mandatory: true, 
					validation: "nonempty" 
				},
				{ 
					name: "q7", 
					label: "Результаты BSC за последние 3 месяца по KPI", 
					type: "text", 
					value: "", 
					mandatory: true, 
					validation: "nonempty" 
				},
				{ 
					name: "q8", 
					label: "Общий рейтинг BSC за последние 3 месяца", 
					type: "real", 
					value: "", 
					mandatory: true, 
					validation: "number" 
				},
				{
					name: "expert1",
					label: "Оценивающий №1",
                    query_qual: sCondition,
					type: "foreign_elem",
					catalog: "collaborator",
					multiple: false
				},
                {
					name: "expert2",
					label: "Оценивающий №2",
                    query_qual: sCondition,
					type: "foreign_elem",
					catalog: "collaborator",
					multiple: false
				},
                {
					name: "expert3",
					label: "Оценивающий №3",
                    query_qual: sCondition,
					type: "foreign_elem",
					catalog: "collaborator",
					multiple: false
				},
                {
					name: "expert4",
					label: "Оценивающий №4",
                    query_qual: sCondition,
					type: "foreign_elem",
					catalog: "collaborator",
					multiple: false
				},
				{ 
					name: "certification_date", 
					label: "Дата сертификации",
					type: "date", 
					mandatory: true,
					validation: "date",
					value: "", 
					validation: "nonempty" 
				},
				{ 
					name: "test_learning_id", 
					label: "Пройденный тест",
					query_qual: sTestLearningCondition,
					type: "foreign_elem", 
					catalog: "test_learning",
					multiple: false
				}

			],
		buttons:
			[
				{ name: "cancel", label: ms_tools.get_const('c_cancel'), type: "cancel", css_class: "btn-submit-custom" },
				{ name: "submit", label: "Выполнить", type: "submit", css_class: "btn-cancel-custom" }
			],
		no_buttons: false
	};
	return oForm;
}

ERROR = "";
MESSAGE = "";
RESULT = {};

var oResult = new Object();

try
{
	arrFormFields = ParseJson(PARAMETERS.GetOptProperty("form_fields", []));
}
catch (_err)
{
	arrFormFields = [];
}

sStep = "";
oStep = ArrayOptFind(arrFormFields, "This.name == 'step'");
if (oStep != undefined)
	sStep = oStep.value;

if (ArrayOptFirstElem(arrFormFields) == undefined)
{
	sPersonIDs = "";
	if (getParam(arrFormFields, "personIDs") == undefined || getParam(arrFormFields, "personIDs") == "")
	{
		try
		{
			sPersonIDs = SELECTED_OBJECT_IDS + "";
		}
		catch (_err)
		{
			sPersonIDs = "";
		}
		if (sPersonIDs == "")
		{
			try
			{
				sPersonIDs = OBJECT_ID + "";
			}
			catch (_err)
			{
				sPersonIDs = "";
			}
		}
		if (sPersonIDs == "")
		{
			try
			{
				sPersonIDs = curObjectID + "";
			}
			catch (_err)
			{
				sPersonIDs = "";
			}
		}
	}
	else
		sPersonIDs = getParam(arrFormFields, "personIDs");

	if (sPersonIDs == "")
		oResult = getFormSelectCollaborators();
	else
		sStep = "1";
}
if (sStep != "")
{
	if (ERROR != "")
	{
		oResult = getFormMessage(ERROR);
	}
	else
	{
		if(isNotCorrectBSC()) {
			oResult = getFormMessageNoReload("Общий рейтинг BSC за последние три месяца не может быть меньше 1.0 и больше 5.0.");
			ERROR = "Общий рейтинг BSC за последние три месяца не может быть меньше 1.0 и больше 5.0.";
		} else {

			if (sStep == "1")
			{
				oResult = getFormSelectParamCustomTemplate(arrFormFields);
			}
			if (sStep == "2")
			{
				iCounter = 0;
				sPersonIDs = "";
				if (getParam(arrFormFields, "personIDs") == undefined || getParam(arrFormFields, "personIDs") == "")
				{
					try
					{
						sPersonIDs = SELECTED_OBJECT_IDS + "";
					}
					catch (_err)
					{
						sPersonIDs = "";
					}
					if (sPersonIDs == "")
					{
						try
						{
							sPersonIDs = OBJECT_ID + "";
						}
						catch (_err)
						{
							sPersonIDs = "";
						}
					}
					if (sPersonIDs == "")
					{
						try
						{
							sPersonIDs = curObjectID + "";
						}
						catch (_err)
						{
							sPersonIDs = "";
						}
					}
				}
				else
					sPersonIDs = getParam(arrFormFields, "personIDs");
				
				sPersonIDs = OptInt(sPersonIDs);

				no_reload = false; // Для закрытия предупреждающего окна с сохранением заполненных данных

				try {
					arrExperts = new Array();

					if (OptInt(getParam(arrFormFields, 'expert1'), 0) != 0) arrExperts.push(getParam(arrFormFields, 'expert1'));
					if (OptInt(getParam(arrFormFields, 'expert2'), 0) != 0) arrExperts.push(getParam(arrFormFields, 'expert2'));
					if (OptInt(getParam(arrFormFields, 'expert3'), 0) != 0) arrExperts.push(getParam(arrFormFields, 'expert3'));
					if (OptInt(getParam(arrFormFields, 'expert4'), 0) != 0) arrExperts.push(getParam(arrFormFields, 'expert4'));

					if (ArrayCount(ArraySelectDistinct(arrExperts)) != 2 && ArrayCount(ArraySelectDistinct(arrExperts)) != 4) {
						throw '';
					}

					try {
						personDoc = OpenDoc(UrlFromDocID(sPersonIDs));
						personTE = personDoc.TopElem;

						// Создаём новую процедуру для Оцениваемого
						new_AA = tools.new_doc_by_name("assessment_appraise", false);
						new_AA.BindToDb();

						// Находим эталонную процедуру
						etalon_id = ArrayOptFirstElem(XQuery("sql: SELECT id FROM assessment_appraises aa WHERE aa.is_model = 1 AND aa.code = 'director_certification';")).id;
						etalon = OpenDoc(UrlFromDocID(etalon_id));
						etalon_TE = etalon.TopElem;

						new_AA_TE = new_AA.TopElem;

						// Копируем данные из эталонной процедуры
						new_AA_TE.AssignElem(etalon_TE);

						new_AA_TE.name = etalon_TE.name + " " + personTE.fullname + " " + Date();
						new_AA_TE.is_model = "0";
						new_AA_TE.start_date = getParam(arrFormFields, "certification_date");
						new_AA_TE.person_id = curUserID;

						// Вносим данные Оцениваемого
						auditor = new_AA_TE.auditorys.AddChild();
						auditor.person_id = personTE.id;
						auditor.person_name = personTE.fullname;
						auditor.position_name = personTE.position_name;

						new_AA_TE.status = "0";

						new_AA_ID = new_AA.DocID;
						new_AA_TE.id = new_AA_ID;

						// Прописываем процедуру оценки в запись представления кандидата
						presentation_rgm_obj = ArrayOptFirstElem(XQuery("sql: SELECT * FROM cc_presentation_rgms WHERE test_learning_id = " + getParam(arrFormFields, 'test_learning_id')), {id: 0});
						presentation_rgm_doc = tools.open_doc(presentation_rgm_obj.id);
						if (presentation_rgm_doc == undefined) {
							throw 'анкета представления кандидата для выбранного пройденного теста не найдена. ';
						}

						presentation_rgm_doc.TopElem.question_1 = getParam(arrFormFields, "q1");
						presentation_rgm_doc.TopElem.question_2 = getParam(arrFormFields, "q2");
						presentation_rgm_doc.TopElem.question_3 = getParam(arrFormFields, "q3");
						presentation_rgm_doc.TopElem.question_4 = getParam(arrFormFields, "q4");
						presentation_rgm_doc.TopElem.question_5 = getParam(arrFormFields, "q5");
						presentation_rgm_doc.TopElem.question_7 = getParam(arrFormFields, "q7");
						presentation_rgm_doc.TopElem.question_8 = getParam(arrFormFields, "q8");
						presentation_rgm_doc.TopElem.assessment_appraise_id = new_AA.DocID;
						presentation_rgm_doc.Save();

						new_AA.Save();

						// Генерируем Ход оценки и Анкеты
						tools_ass.generate_assessment_plan(OptInt(new_AA_TE.id), false, false, false, undefined, undefined, null);

						// Удаляем автоматически сгенерированные анкеты, если такие есть
						arr_pas = XQuery("sql: SELECT id FROM pas WHERE assessment_appraise_id = " + new_AA_ID);
						for (_pa in arr_pas) {
							DeleteDoc(UrlFromDocID(_pa.id));
						}

						// Генерируем анкеты в соответствии с выбранными Оценивающими
						sRequest = "SELECT cp.id AS cp_id, wf.id wf_id, ap.id ap_id FROM competence_profiles cp 
							LEFT JOIN workflows wf ON wf.code = 'director_assessment_wf'
							LEFT JOIN assessment_plans ap ON ap.assessment_appraise_id = " + new_AA_ID + "
							WHERE cp.code = 'competence_profile_director';";

						data =ArrayOptFirstElem(XQuery("sql: " + sRequest));
						cp_id = data.cp_id;
						wf_id = data.wf_id;
						ap_id = data.ap_id;

						teCompProfile = OpenDoc(UrlFromDocID(cp_id)).TopElem;
						
						for (exp in arrExperts) {

							new_PA = tools.new_doc_by_name("pa", false);
							new_PA.BindToDb();
							new_PA_TE = new_PA.TopElem;

							new_PA_TE.person_id = sPersonIDs;
							new_PA_TE.assessment_plan_id = ap_id;
							new_PA_TE.assessment_appraise_id = new_AA_ID;
							new_PA_TE.expert_person_id = exp;
							new_PA_TE.status = 'manager';
							new_PA_TE.assessment_appraise_type = 'competence_appraisal';
							new_PA_TE.competence_profile_id = cp_id;
							new_PA_TE.workflow_id = wf_id;
							new_PA_TE.workflow_state = 0;
							new_PA_TE.workflow_state_name = 'Заполнение';

							new_PA_TE.competences.AssignElem(teCompProfile.competences);

							new_PA.Save();

							// Отправка уведомлений Оценивающим
							tools.create_notification("ass_app_start", exp, 'Сотруднику ' + personTE.fullname, new_AA_ID);

							_notification_doc = tools.new_doc_by_name('cc_notification', false);
							_notification_doc.TopElem.object_id = new_AA_ID;
							_notification_doc.TopElem.object_type = 'assessment_appraise';
							_notification_doc.TopElem.collaborator_id = exp;
							_notification_doc.TopElem.description = 'Сотруднику ' + personTE.fullname + ' назначена процедура оценки';
							_notification_doc.BindToDb();
							_notification_doc.Save();
						}
						
						// Отправка уведомления Оцениваемому
						tools.create_notification("ass_app_start", personTE.id, 'Вам', new_AA_ID);

						_notification_doc = tools.new_doc_by_name('cc_notification', false);
						_notification_doc.TopElem.object_id = new_AA_ID;
						_notification_doc.TopElem.object_type = 'assessment_appraise';
						_notification_doc.TopElem.collaborator_id = personTE.id;
						_notification_doc.TopElem.description = 'Вам назначена процедура сертификации на ' + StrDate(new_AA_TE.start_date, false) + '. Желаем удачи!';
						_notification_doc.TopElem.is_info = true;
						_notification_doc.BindToDb();
						_notification_doc.Save();					

						MESSAGE = "Процедура оценки успешно запущена";
					}
					catch(e) {
						ERROR = "Не удалось запустить процедуру оценки: " + e.message;
					}
				}
				catch(e) {
					ERROR = "Выберите 2 или 4 уникальных Оценивающих";
					no_reload = true;
				}			

				if (ERROR != "")
					if (no_reload) 
						oResult = getFormMessageNoReload(ERROR);
					else 
						oResult = getFormMessage(ERROR);
				else
					oResult = getFormMessage(MESSAGE);
			}
		}
	}
}

RESULT = oResult;
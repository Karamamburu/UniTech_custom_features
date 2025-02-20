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
			command: "reload_page"
		}
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
		title: "Запустить процесс тестирования по стандартам",
		message: "Выберите сотрудника",
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
					multiple: false,
					mandatory: true,
					query_qual: query_qual,
					value: "",
					title: "Выберите сотрудника"
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
	
    rest = {id: 0, partner_id: 0};
    birthDate = Date();
    birthDateStr = '';
    personObj = ArrayOptFirstElem(XQuery("sql: SELECT * FROM collaborators WHERE id = " + _sPersonIDs), {});

    if (personObj != undefined) {
		rest = ArrayOptFirstElem(XQuery("sql: 
			DECLARE
			@subdivision_id BIGINT = " + personObj.GetOptProperty('position_parent_id', 0) + ";

			WITH parents AS (
				SELECT id, parent_object_id, name, 0 'lev' FROM subdivisions
				WHERE id = @subdivision_id
				UNION ALL
				SELECT sds.id, sds.parent_object_id, sds.name, ps.lev + 1 'lev' FROM subdivisions sds
				INNER JOIN parents ps ON ps.parent_object_id = sds.id
			),
			partner AS (
				SELECT TOP(1) id, name FROM parents 
				WHERE lev = (SELECT IIF(name LIKE 'Corporate', lev, lev - 1) FROM parents WHERE parent_object_id IS NULL)
			)
			SELECT parents.*, (SELECT id FROM partner) 'partner_id', (SELECT name FROM partner) 'partner_name' FROM parents WHERE lev = 0
		"), {id: 0, partner_id: 0})

        birthDate = personObj.GetOptProperty('birth_date');
        if (birthDate != undefined) {
            birthDateStr = StrDate(birthDate).substr(0, 5);
        }
    }


	oForm =
	{
		command: "display_form",
		title: "Запустить процесс тестирования по стандартам",
		message: "Заполните анкету о сотруднике",
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
					name: "city", 
					label: "Город",
					type: "string", 
					mandatory: true,
					column: 1 , 
					validation: "nonempty" 
				},
				{
					name: "partnerId",
					label: "Название партнера",
					type: "foreign_elem",
					catalog: "subdivision",
					multiple: false,
					mandatory: true,
					value: rest.partner_id, 
					title: "Выберите партнера",
					validation: "nonempty",
					disabled: true,
                    column: 1,
				},
				{
					name: "subdId",
					label: "Название ресторана",
					type: "foreign_elem",
					catalog: "subdivision",
					multiple: false,
					mandatory: true,
					value: rest.id, 
					title: "Выберите ресторан",
					validation: "nonempty",
					disabled: true,
                    column: 1,
				},
				{ 
					name: "knowEng", 
					label: "Знание английского языка", 
					type: "select", 
					value: "",
					mandatory: true, 
					entries: [ 
						{ name: "Upper Intermediate (средне-продвинутый)", value: "Upper Intermediate (средне-продвинутый)" }, 
						{ name: "Intermediate (средний)", value: "Intermediate (средний)" },
						{ name: "Elementary (элементарный)", value: "Elementary (элементарный)" },
						{ name: "Beginner (начальный)", value: "Beginner (начальный)" }  
						], 
					validation: "nonempty",
                    column: 1,
				},
				{ 
					name: "relocate", 
					label: "Возможность релокации", 
					type: "select", 
					value: "",
					mandatory: true, 
					entries: [ 
						{ name: "Да", value: "Да" }, 
						{ name: "Нет", value: "Нет" },
						], 
					column: 1, 
					validation: "nonempty"  
				},
				{ 
					name: "sig", 
					label: "SIG", 
					type: "select", 
					value: "",
					mandatory: true, 
					entries: [ 
						{ name: "Пройден", value: "Пройден" }, 
						{ name: "Не пройден", value: "Не пройден" },
						], 
					column: 1, 
					validation: "nonempty"  
				},
				{ 
					name: "q6", 
					label: "Дата sig/asessment", 
					type: "date", 
					value: "", 
					mandatory: true, 
					validation: "nonempty" 
				},

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
		if (sStep == "1")
		{
			// Делаем проверку на тест за последние 30 дней
			recently_passed = ArrayOptFirstElem(XQuery("sql: 
			DECLARE
			@active_user BIGINT = " + sPersonIDs +",
			@test_id BIGINT = (SELECT id FROM assessments WHERE code = 'director_certification_test');

			SELECT tls.id FROM test_learnings tls
			LEFT JOIN active_test_learnings atls ON atls.person_id = @active_user AND atls.assessment_id = @test_id
			WHERE (tls.person_id = @active_user 
			AND tls.assessment_id = @test_id
			AND DATEDIFF(day,  tls.creation_date, GETDATE()) < 30)
			OR  atls.id IS NOT NULL;"));	

			if (recently_passed != undefined)
				oResult = getFormMessage("Пользователь уже проходил тестирование за последние 30 дней.");
			else 
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
			
			try{
				assessment_id = ArrayOptFirstElem(XQuery("sql: SELECT id FROM assessments WHERE code = 'director_certification_test'")).id 
			}
			catch(ex){
				assessment_id = 0;
			}
			
			active_learning_id = tools.activate_test_to_person(Int(sPersonIDs), assessment_id);
			try {
				active_learning_id = active_learning_id.DocID;
			} catch(ex) {}

			birthDate = null;
			person_doc = tools.open_doc(getParam(arrFormFields, "personIDs"));
			if (person_doc != undefined) {
				birthDate = person_doc.TopElem.birth_date;
			}

			if(active_learning_id != null){
				rgmNewDoc = tools.new_doc_by_name("cc_presentation_rgm", false);
				rgmNewDoc.BindToDb();
				rgmNewDoc.TopElem.person_id = getParam(arrFormFields, "personIDs");
				rgmNewDoc.TopElem.birth_date = birthDate;
				rgmNewDoc.TopElem.city_name = getParam(arrFormFields, "city");
				rgmNewDoc.TopElem.subdivision_id = getParam(arrFormFields, "subdId");
				rgmNewDoc.TopElem.partner_id = getParam(arrFormFields, "partnerId");
				rgmNewDoc.TopElem.english_level = getParam(arrFormFields, "knowEng");
				rgmNewDoc.TopElem.relocation = getParam(arrFormFields, "relocate");
				rgmNewDoc.TopElem.sig = getParam(arrFormFields, "sig");
				rgmNewDoc.TopElem.question_6 = getParam(arrFormFields, "q6");
				rgmNewDoc.TopElem.active_test_learning_id = active_learning_id;
				rgmNewDoc.Save();
				
				UniTools = OpenCodeLib(
					FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/uni_tools.js")
				  );

				UniTools.createBellNotification(
					OptInt(getParam(arrFormFields, "personIDs")), 
					active_learning_id, 
					'assessment', 
					'Тебе назначено тестирование перед сертификацией. Удачи!', 
					UrlAppendPath( global_settings.settings.portal_base_url, active_learning_id)
				)


				MESSAGE = "Процесс входного тестирования запущен."
			}
			else{
				MESSAGE = "Не удалось запустить входное тестирование."
			}

			if (ERROR != "")
				oResult = getFormMessage(ERROR);
			else
				oResult = getFormMessage(MESSAGE);
		}
	}
}

RESULT = oResult;
var query = "sql:
				SELECT 
					cp.id, 
					cp.code, 
					cp.name,
					cp.resource_id AS pict_url,
					ep_aggr.state_id
				FROM 
					compound_programs cp
				LEFT JOIN (
					SELECT 
						compound_program_id, 
						MIN(state_id) AS state_id
					FROM 
						education_plans
					WHERE 
						person_id = " + curUserID + "
					GROUP BY 
						compound_program_id
				) ep_aggr ON ep_aggr.compound_program_id = cp.id;
"

var compProgs = XQuery(query)

stateNames = tools.call_code_library_method("get_constants", "getEducationPlanStateName", []);

COLUMNS = [
	{ data: "id", type: "integer", title: "ID" },
	{ data: "code", type: "string", title: "Код" },
	{ data: "name", type: "string", title: "Название" },
	{ data: "link", type: "string", title: "Ссылка" },
	{ data: "pict_url", type: "string", title: "Изображение" },
	{ data: "priority", type: "integer", title: "Номер по порядку" },
	{ data: "language", type: "string", title: "Язык" },
	{ data: "dep_type", type: "string", title: "Тип департамента" },
	{ data: "position", type: "string", title: "Уровень должности" },
	{ data: "tm_station", type: "string", title: "Станция" },
	{ data: "state_id", type: "integer", title: "Код статуса плана обучения" },
	{ data: "state_name", type: "string", title: "Статуса плана обучения" },
]

RESULT = new Array();

var ListElem, CPElement, CPData;

for (ListElem in compProgs) {
	RESULT.push((CPData = new Object()));

	CPElement = ListElem.Child("id");
	CPData.id = CPElement.Value;
	CPData.link = "/_wt/" + CPElement.Value;

	CPElement = ListElem.Child("code");
	CPData.code = CPElement.Value;

	CPElement = ListElem.Child("name");
	CPData.name = CPElement.HasValue ? CPElement.Value : null;

	CPElement = ListElem.Child("pict_url");
	CPData.pict_url = CPElement.HasValue ? "download_file.html?file_id=" + CPElement.Value : null;

	CPElement = ListElem.Child("state_id");
	CPData.state_id = CPElement.HasValue ? CPElement.Value : null;
	CPData.state_name = stateNames.HasProperty(CPData.state_id) ? stateNames[CPData.state_id] : CPData.state_id;

	CPDoc = tools.open_doc(CPData.id)
	CPData.priority =  OptInt(CPDoc.TopElem.custom_elems.ObtainChildByKey("priority").value);
	CPData.language =  CPDoc.TopElem.custom_elems.ObtainChildByKey("language").value;
	CPData.dep_type =  CPDoc.TopElem.custom_elems.ObtainChildByKey("dep_type").value;
	CPData.position =  CPDoc.TopElem.custom_elems.ObtainChildByKey("position").value;
	CPData.tm_station=  CPDoc.TopElem.custom_elems.ObtainChildByKey("tm_station").value;

}

RESULT = ArraySort(RESULT, "priority", "+")
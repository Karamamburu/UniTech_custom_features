var query = "sql:
			SELECT 
				cp.id AS id, 
				cp.code AS code, 
				cp.name AS name,
				cp.resource_id AS pict_url
			FROM compound_programs cp
"

var compProgs = XQuery(query)

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

	CPDoc = tools.open_doc(CPData.id)
	CPData.priority =  OptInt(CPDoc.TopElem.custom_elems.ObtainChildByKey("priority").value);
	CPData.language =  CPDoc.TopElem.custom_elems.ObtainChildByKey("language").value;
	CPData.dep_type =  CPDoc.TopElem.custom_elems.ObtainChildByKey("dep_type").value;
	CPData.position =  CPDoc.TopElem.custom_elems.ObtainChildByKey("position").value;

}

RESULT = ArraySort(RESULT, "priority", "+")
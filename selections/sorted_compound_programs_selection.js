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
	CPData.priority =  CPDoc.TopElem.custom_elems.ObtainChildByKey("priority").value;

}

RESULT = ArraySort(RESULT, "priority", "+")
var colsList;
var queryResult = XQuery("sql: 
                            SELECT c.id, c.login, c.fullname, c.email, c.position_name 
                            FROM collaborators c
                            WHERE c.id = " + boss_id
);
colsList= queryResult;

COLUMNS = [
  { data: "id", type: "integer", title: "ID" },
  { data: "login", type: "string", title: "Логин" },
  { data: "fullname", type: "string", title: "ФИО" },
  { data: "email", type: "string", title: "Email" },
  { data: "pict_url", type: "string", title: "URL к файлу фотографии" },
  { data: "position_name", type: "string", title: "Название должности" },
  { data: "link", type: "string", title: "link" },
];
RESULT = new Array();
var ListElem, colElement, colData;
for (ListElem in colsList) {
  RESULT.push((colData = new Object()));

  colElement = ListElem.Child("id");
  colData.id = colElement.Value;
  colData.link = "/person/" + colElement.Value;

  colElement = ListElem.Child("login");
  colData.login = colElement.HasValue ? colElement.Value : null;

  colElement = ListElem.Child("fullname");
  colData.fullname = colElement.HasValue ? tools.call_code_library_method("get_readable", "getReadableShortName", [colElement.Value]) : null;

  colElement = ListElem.Child("email");
  colData.email = colElement.HasValue ? "<a href= " + "mailto:" + colElement.Value + ">" + colElement.Value + "</a>" : null;

  _colDoc = tools.open_doc(colData.id);
  colData.pict_url = _colDoc.TopElem.pict_url.HasValue ? _colDoc.TopElem.pict_url.Value : null;

  colElement = ListElem.Child("position_name");
  colData.position_name = colElement.HasValue ? colElement.Value : null;
}
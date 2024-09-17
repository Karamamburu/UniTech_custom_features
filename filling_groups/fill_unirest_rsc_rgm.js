dinamicGroupDoc = tools.open_doc(Param.group_id);
dinamicGroupDoc.TopElem.collaborators.Clear();

var query = "sql: 
			SELECT c.id, c.fullname FROM collaborators c
			LEFT JOIN subdivisions s ON c.position_parent_id = s.id
			WHERE s.parent_object_id = 7174468764482109387
			AND c.is_dismiss = 0
			AND c.position_name IN ('RGM', 'RGM Trainee')

			UNION

			SELECT c.id, c.fullname FROM collaborators c
			WHERE c.is_dismiss = 0
			AND c.position_parent_id = 7174468763328728044
			AND c.position_name IN (
				'Area Coach',
				'Region Coach',
				'RSC',
				'RSC Contractor'
			)
"

var collaborators = XQuery(query)

for(col in collaborators) {

    try {
        _child = dinamicGroupDoc.TopElem.collaborators.AddChild();
        _child.collaborator_id = col.id;
    }
    catch (ex) {
        alert('Ошибка: ' + ex)
    }
}

dinamicGroupDoc.Save();

alert("Динамическая группа \'" + dinamicGroupDoc.TopElem.name + "\' успешно обновлена")

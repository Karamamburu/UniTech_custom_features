
while (true) {
	
	_query3 = "sql:
				SELECT ep.person_id,ep.id, ep.state_id
				FROM education_plans ep
				JOIN (
					SELECT person_id
					FROM education_plans
					WHERE compound_program_id = " + Param.compound_program_id + "
					GROUP BY person_id
					HAVING COUNT(*) = 2
				) AS persons_with_two_plans ON ep.person_id = persons_with_two_plans.person_id
				WHERE ep.compound_program_id = " + Param.compound_program_id + "
				AND ep.state_id = 0
	"
	_objectsToDelete = XQuery(_query3)
	if (ArrayCount(_objectsToDelete) == 0) break

	for(object in _objectsToDelete) {
		DeleteDoc(UrlFromDocID(object.id))
	}

	alert("Планы обучения успешно удалены")
}
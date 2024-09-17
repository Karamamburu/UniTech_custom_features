function createPositionsString(positions) {
    positionsString = '';

    for (pos in positions) {
        if (positionsString == '') {
               positionsString = " AND (position_name ='" + pos +"'";7398137991374860069
        }
        else {
             positionsString += " OR position_name='" + pos + "'"; 7413671791575779606
        }
    }
   
    positionsString += ')'; 

    return positionsString; 
}


var group_id = Int(Param.group_id);
var is_set_default_group = Param.GetOptProperty('set_default_group') == '1';

try{
    docHeadGroup = OpenDoc(UrlFromDocID(group_id));
    docHeadGroup.TopElem.collaborators.Clear();

    arrSubdConditions = [];
    arrPositionConditions = [];
    sPositions = '';
  
    for (cond in docHeadGroup.TopElem.conditions) {
        if (cond.field == 'code' && cond.option_type == 'eq' && cond.value !== '')
            arrSubdConditions.push(cond.value);

		if(cond.field == 'position_name' && cond.option_type == 'eq' && cond.value !== '') 
			arrPositionConditions.push(cond.value);
    }
    
    if (arrPositionConditions.length != 0) {
        sPositions = createPositionsString(arrPositionConditions);
    }

    sSubs = ArrayMerge(arrSubdConditions, "This", ';');

    sRequest = "
    DECLARE
    @subdiv_codes NVARCHAR(max) = '" + sSubs + "';

    DECLARE
    @subdivs AS TABLE(
            code NVARCHAR(max)
        );

    INSERT INTO @subdivs
        SELECT value FROM string_split(@subdiv_codes, ';');

    WITH sub_tree AS (
    						SELECT ss.id, name, parent_object_id, 0 lev, ss.id orig_id
    						FROM subdivisions ss
    						JOIN @subdivs s ON ss.code = s.code
    						UNION ALL
    						SELECT ss.id, ss.name, ss.parent_object_id, lev -1, t.orig_id
    						FROM subdivisions ss
    						JOIN sub_tree t ON t.id = ss.parent_object_id
    					)

    SELECT DISTINCT cl.id FROM sub_tree st
    INNER JOIN collaborators cl ON cl.position_parent_id = st.id AND cl.is_dismiss = 0 AND LEN(cl.login) = 7" + sPositions;

    arrColls = XQuery("sql: " + sRequest);
}
catch(ex){
	alert("Ошибка в переданных параметрах: " + ex)
}

for(col in arrColls)
{
	try
	{
		_child = docHeadGroup.TopElem.collaborators.AddChild();
		_child.collaborator_id = col.id;
		coll_doc = OpenDoc(UrlFromDocID(col.id))
		if(is_set_default_group) {
			coll_doc.TopElem.custom_elems.ObtainChildByKey('default_group_id').value = Param.group_id;
			coll_doc.TopElem.access.user_group_id = Param.group_id;
			coll_doc.Save()
		}
	}
	catch (ex)
	{
		alert('Ошибка: '+ex)
	}
}

docHeadGroup.Save();

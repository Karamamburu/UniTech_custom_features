_group_id = 7099955210146501106; //В скобках указать ID группы, в которую нужно будет добавить сотрудников из csv
_groupDoc = tools.open_doc(_group_id);

var collByLogin = ArrayOptFirstElem(XQuery("for $elem in collaborators where $elem/login = '" + '{[1]}' + "' and $elem/is_dismiss = 0 return $elem"));

if (collByLogin == false || collByLogin == undefined ) {
    continueFlag = true;} else {
    curUserID = collByLogin.id;
    var isAlreadyInGroup = tools.is_by_group_id(_group_id);
    
    if (isAlreadyInGroup == true) {
        continueFlag = true;
    } else {
        _groupDoc.TopElem.collaborators.AddChild().collaborator_id = collByLogin.id;
        _groupDoc.Save();
    }
};
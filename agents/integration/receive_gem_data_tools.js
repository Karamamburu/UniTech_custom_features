function Ceil(a, b) { return Int(a / b) + (a % b != 0 ? 1 : 0) }
function GetUsers(take, skip, delta, stringGemEndpoint) {

    arrUsersData = []
    params = { take: take, skip: skip }
    if (OptInt(delta)!=0) {
        params.filters = [{
            field: "modifiedOn",
            operation: "more",
            terms: [
                get_last_sync_session_ldap_date_str()
            ]
        }]
    }
    try {
        req = HttpRequest(
            stringGemEndpoint,
            'post',
            tools.object_to_text(params, 'json'),
            "Content-Type:application/json\nIgnore-Errors: 1\nApi-Token:" + AppConfig.GEM_USER_INTEGRATION_TOKEN
        );
        var response = tools.read_object(req.Body, 'json')

        arrUsersData = response.items;
    } catch (ex) { 
	Log("Request get users failed", ex);
	throw ex;
 }
    return arrUsersData;
}

function GetUsersCount(delta, stringGemEndpoint) {
    arrUsersData = 0;
    params = { take: 0, skip: 0 }
    if (OptInt(delta)!=0){
        params.filters = [{
            field: "modifiedOn",
            operation: "more",
            terms: [
                get_last_sync_session_ldap_date_str()
            ]
        }]
    }

    try {
        req = HttpRequest(
            stringGemEndpoint,
            'post',
            tools.object_to_text(params, 'json'),
            "Content-Type:application/json\nIgnore-Errors: 1\nApi-Token:" + AppConfig.GEM_USER_INTEGRATION_TOKEN
        );
        var response = tools.read_object(req.Body, 'json')

        arrUsersData = response.total;
    } catch (ex) { 
		Log("Request get users failed", ex);
		throw ex;
	}
    return arrUsersData;
}

function is_null_or_empty(value) {
    if (value == '' || value == null || value == undefined) {
        return true;
    }
    return false;
}

function create_sync_session() {
    sync_session_doc = tools.new_doc_by_name("cc_ldap_sync_session", false);
    sync_session_doc.TopElem.state = "InProgress";
    sync_session_doc.TopElem.catalog = "person";
    sync_session_doc.BindToDb();
    sync_session_doc.Save();

    return sync_session_doc;
}

function get_last_sync_session_ldap_date_str() {
    last_sync_session_date = get_last_sync_session_date();
    if (last_sync_session_date == undefined) {
        return undefined;
    }
    return cast_date_to_ldap_date_str(last_sync_session_date);
}

function get_last_sync_session_date() {
    return ArrayOptFirstElem(XQuery("sql: " +
        " SELECT TOP(1) DATEADD(hour, -3, ls.created) 'created' FROM cc_ldap_sync_sessions lss " +
        " INNER JOIN cc_ldap_sync_session ls ON ls.id = lss.id  " +
        " WHERE lss.catalog = 'person' AND lss.state = 'Success' " +
        " ORDER BY ls.created DESC "
    ), { created: undefined }).created;
}

function cast_date_to_ldap_date_str(date) {
    ldap_date_str = "" + Year(date) + "-" + cast_value_to_date_str(Month(date)) + "-" + cast_value_to_date_str(Day(date)) + "T" +
        cast_value_to_date_str(Hour(date)) + ":" + cast_value_to_date_str(Minute(date)) + ":" + cast_value_to_date_str(Second(date));
    return ldap_date_str;
}

function cast_value_to_date_str(value) {
    value_str = String(value);
    if (value < 10) {
        value_str = "0" + value_str;
    }

    return value_str;
}

function set_session_state(sync_session_doc, state_name) {
    sync_session_doc.TopElem.state = state_name;
    sync_session_doc.Save();
}

function create_entity(key_value, sync_session_id) {
    exist_entity = ArrayOptFirstElem(XQuery("sql: SELECT TOP(1) * FROM cc_ldap_users WHERE uid = '" + key_value + "'"));

    var entity_doc;
    if (exist_entity == undefined) {
        entity_obj = {};
        entity_obj.SetProperty('uid', key_value);

        entity_doc = tools.new_doc_by_name('cc_ldap_user', false);
        entity_doc.TopElem.LoadData("<x>" + tools.object_to_text(entity_obj, "xml") + "</x>");
        entity_doc.TopElem.sync_session_id = sync_session_id;

        entity_doc.BindToDb();
        entity_doc.Save();
    } else {
        entity_doc = tools.open_doc(exist_entity.id);
        entity_doc.TopElem.sync_session_id = sync_session_id;
        entity_doc.Save();
    }

    return entity_doc;
}

function create_properties(entity, properties, wt_entity_doc_id) {
    exists_properties = XQuery("sql: SELECT id FROM cc_ldap_user_properties WHERE ldap_user_id = " + wt_entity_doc_id);

    for (property in exists_properties) {
        DeleteDoc(UrlFromDocID(property.id), true);
    }

    for (property in properties) {
        if (!is_null_or_empty(entity.GetOptProperty(property))) {
            property_obj = {};
            property_obj.SetProperty('ldap_user_id', wt_entity_doc_id);

            property_doc = tools.new_doc_by_name('cc_ldap_user_propertie', false);
            property_doc.TopElem.LoadData("<x>" + tools.object_to_text(property_obj, "xml") + "</x>");
            property_doc.TopElem.prop_name = property;
            property_doc.TopElem.prop_value = entity.GetOptProperty(property);
            property_doc.BindToDb();
            property_doc.Save();
        }
    }
}

function Log(message, ex) {
    if (ex == null || ex == undefined) {
        LogEvent('agent_receive_gem_data', message);
    } else {
        LogEvent('agent_receive_gem_data', (message + ' Message: ' + ex));
    }
}

function Run(stringFields, delta, stringGemEndpoint, countUserPerPack) {
    EnableLog('agent_receive_gem_data');
    Log('Receive data from gem started.');
    fields = stringFields.split(";");
    usersInPacks = OptInt(countUserPerPack);
    if (is_null_or_empty(usersInPacks)) {
        Log('Variable countUserPerPack is empty.');
        return;
    }

    countUsers = GetUsersCount(delta, stringGemEndpoint);
    intCountPacks = Ceil(countUsers, usersInPacks);
    Log('Count users ' + countUsers)
    Log('intCountPacks: ' + intCountPacks);
    var result_entities = [];
    try {
        indexPacks = 0;
        while (indexPacks < intCountPacks) {
            tempUsers = GetUsers(usersInPacks, indexPacks * usersInPacks, delta, stringGemEndpoint);
            result_entities = ArrayUnion(result_entities, tempUsers)
            indexPacks += 1;
        }
    } catch (ex) {
        Log('An error occurred while feching data.', ex);
        return;
    }


    try {

        sync_session_doc = create_sync_session();

        Log('Entities received. Count: ' + ArrayCount(result_entities));

        for (entity in result_entities) {
            try {
                entity_doc = create_entity(entity.login, sync_session_doc.DocID);

                create_properties(entity, fields, entity_doc.DocID);
                Log('Entity created. Key: ' + entity.login);

            } catch (ex) {
                Log('Entity processing failed. EntityJson: ' + tools.object_to_text(entity, 'json'), ex);
            }


            set_session_state(sync_session_doc, 'Success');
        }
    } catch (ex) {
        Log('An error occurred while processing data.', ex);
    }

    Log('Receive data from gem finished.');

    EnableLog('agent_receive_gem_data', false);
}

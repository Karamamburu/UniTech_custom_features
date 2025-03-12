function isNullOrEmpty(value)
{
    return value == '' || value == null || value == undefined;
}

function getGemUsers()
{
    var query = "sql: " +
        " DECLARE " +
        " @last_sync_session_id BIGINT = (SELECT TOP(1) id FROM cc_ldap_sync_sessions WHERE state = 'Success' ORDER BY modification_date DESC); " +
        "  " +
        " SELECT " +
        " 	CONCAT('[ ', STRING_AGG(ldap_users.json, ', '), ' ]') json " +
        " FROM ( " +
        " 	SELECT " +
        " 		CONCAT('{ ', STRING_AGG(CONCAT('\"', p.prop_name, '\": ', CASE WHEN ISJSON(p.prop_value) = 1 THEN p.prop_value ELSE CONCAT('\"', p.prop_value, '\"') END), ', '), ' }') json " +
        " 	FROM cc_ldap_users u " +
        " 	INNER JOIN cc_ldap_user_properties p ON p.ldap_user_id = u.id " +
        " 	WHERE u.sync_session_id = @last_sync_session_id " +
        " 	GROUP BY u.uid " +
        " ) ldap_users "
    ;

    var gem_users_json = ArrayOptFirstElem(XQuery(query), { json: "[]" }).json;

    return tools.read_object(gem_users_json);
}

function getOrCreateCollaborator(login)
{
    var collaborator_doc = getCollaborator(login);

    if (collaborator_doc == null)
    {
        collaborator_doc = tools.new_doc_by_name('collaborator', false);
        collaborator_doc.TopElem.login = login;
		collaborator_doc.TopElem.password = tools.random_string(8);
        collaborator_doc.TopElem.custom_elems.ObtainChildByKey('active_first_edu').value = 'true';
        collaborator_doc.BindToDb();
    }

    return collaborator_doc;
}

function getCollaborator(login)
{
    var collaborator_id = ArrayOptFirstElem(XQuery("sql: SELECT id FROM collaborators WHERE login = '" + login + "'"), {id: 0}).id;

    var collaborator_doc = tools.open_doc(collaborator_id);

    if (collaborator_doc == undefined)
    {
        collaborator_doc = null;
    }

    return collaborator_doc;
}

function getOrg()
{
    return ArrayOptFirstElem(XQuery("sql: SELECT * FROM orgs WHERE code = 'yum'"));
}

function getCorporateRSC(org)
{
    return ArrayOptFirstElem(XQuery("sql: " +
    " SELECT TOP(1) csds.* FROM subdivisions sds " +
    " INNER JOIN subdivisions csds ON csds.parent_object_id = sds.id " +
    " WHERE sds.name = 'Corporate' AND csds.name LIKE 'RSC%' AND csds.org_id = " + org.id
    ));
}

function parseBirthDate(dateOfBirth)
{
    var result = null;

    try
    {
        if (!isNullOrEmpty(dateOfBirth))
        {
            var splited_date = dateOfBirth.split("/");

            var mounth = splited_date[0];

            var day = splited_date[1];

            var year = "2000";

            result = Date(day + "." + mounth + "." + year);
        }
    }
    catch (ex)
    {
        Log("Error occured while trying to parse birth date to date object from dateOfBirth '" + dateOfBirth + "'", ex);
    }

    return result;
}

function parseStoreId(restaurantId)
{
    // Пример restaurantId, который приходит из LDAP: 7K803005
    if (StrContains(restaurantId, '7K')) {
        return StrRightRangePos(restaurantId, 2);
    }
    return restaurantId;
}

function getCorporateStore(org, store_id)
{
    return ArrayOptFirstElem(XQuery("sql: " +
        " WITH child_subdivs AS ( " +
            " SELECT id, parent_object_id, code, name FROM subdivisions WHERE name = 'Corporate' AND org_id = " + org.id +
            " UNION ALL " +
            " SELECT sds.id, sds.parent_object_id, sds.code, sds.name FROM subdivisions sds " +
            " INNER JOIN child_subdivs csds ON csds.id = sds.parent_object_id " +
        " ) " +
        " SELECT * FROM child_subdivs WHERE code = '" + store_id + "' "
    ), null);
}

function getFranchiseRSC(org, franchise_id) {
    return ArrayOptFirstElem(XQuery("sql: " +
    " WITH parent_subdiv AS ( " +
        " SELECT id, parent_object_id, code, name FROM subdivisions WHERE code = '" + franchise_id + "' AND org_id = " + org.id +
        " UNION ALL " +
        " SELECT sds.id, sds.parent_object_id, sds.code, sds.name FROM subdivisions sds " +
        " INNER JOIN parent_subdiv psds ON psds.parent_object_id = sds.id " +
    " ) " +
    " SELECT csds.id, csds.parent_object_id, csds.code, csds.name FROM parent_subdiv psds " +
    " INNER JOIN subdivisions csds ON csds.parent_object_id = psds.id " +
    " WHERE csds.name LIKE 'FZ_RSC%' "
    ), null);
}

function getFranchiseStore(org, franchise_id, store_id) {
    return ArrayOptFirstElem(XQuery("sql:" +
    " WITH child_subdivs AS ( " +
        " SELECT id, parent_object_id, code, name FROM subdivisions WHERE code = '" + franchise_id + "' AND org_id = " + org.id +
        " UNION ALL " +
        " SELECT sds.id, sds.parent_object_id, sds.code, sds.name FROM subdivisions sds " +
        " INNER JOIN child_subdivs csds ON csds.id = sds.parent_object_id " +
    " ) " +
    " SELECT * FROM child_subdivs WHERE code = '" + store_id + "' "
    ), null);
}

function fullnameAggregate(lastname, firstname, middlename) {
    result = lastname;
    if (!isNullOrEmpty(firstname)) {
        if (!isNullOrEmpty(result)) {
            result += " ";
        }
        result += firstname;
    }

    if (!isNullOrEmpty(middlename)) {
        if (!isNullOrEmpty(result)) {
            result += " ";
        }
        result += middlename;
    }

    return result;
}

function getCompetenceProfileId(pos_name) {
    query = "sql:
        DECLARE
            @pos_name NVARCHAR(max) = '" + pos_name + "';

        SELECT competence_profile_id AS 'id' FROM cc_competence_to_positions
        WHERE position_name LIKE @pos_name
    ";
    return ArrayOptFirstElem(XQuery(query), {"id": null}).id;
}

function GetOrCreateSubdivisionRSC(department, corporate_rsc_subdiv) {
    subdiv_id = ArrayOptFirstElem(XQuery("sql: " +
        " SELECT * FROM subdivisions sd " +
        " WHERE sd.name LIKE '" + department.name + "%' AND sd.org_id = " + corporate_rsc_subdiv.org_id +
        "   AND sd.parent_object_id = " + corporate_rsc_subdiv.id
    ), {id: 0}).id;

    subdiv_doc = tools.open_doc(subdiv_id);

    if (subdiv_doc == undefined)
    {
        subdiv_doc = tools.new_doc_by_name('subdivision', false);
        subdiv_doc.BindToDb();
    }

    subdiv_doc.TopElem.org_id = corporate_rsc_subdiv.org_id;
    subdiv_doc.TopElem.name = department.name;
    subdiv_doc.TopElem.parent_object_id = corporate_rsc_subdiv.id;
    subdiv_doc.TopElem.custom_elems.ObtainChildByKey('is_department').value = true;
    subdiv_doc.Save();

    return subdiv_doc.TopElem;
}

function getOrCreatePosition(org, corporate_rsc_subdiv, main_boss_type, new_func_managers, coll_doc, usertype, jobTitle, franchise_id, store_id, is_dismiss)
{
    pos_id = ArrayOptFirstElem(XQuery("sql: " +
        " SELECT * FROM positions ps " +
        " WHERE ps.basic_collaborator_id = " + OptInt(coll_doc.DocID, 0)
    ), {id: 0}).id;

    pos_doc = tools.open_doc(pos_id);

    if (pos_doc == undefined)
    {
        pos_doc = tools.new_doc_by_name('position', false);
        pos_doc.BindToDb();
    }

    pos_doc.TopElem.org_id = org.id;
    pos_doc.TopElem.name = jobTitle;
    pos_doc.TopElem.basic_collaborator_id = coll_doc.DocID;
	pos_doc.TopElem.basic_collaborator_id.sd.fullname = fullnameAggregate(coll_doc.TopElem.lastname, coll_doc.TopElem.firstname, coll_doc.TopElem.middlename);
    pos_doc.TopElem.basic_collaborator_id.sd.position_id = pos_doc.DocID;
    pos_doc.TopElem.position_date = coll_doc.TopElem.hire_date;
    pos_doc.TopElem.competence_profile_id = getCompetenceProfileId(pos_doc.TopElem.name);

    if (is_dismiss == true) {
        if (pos_doc.TopElem.is_position_finished == false) {
            pos_doc.TopElem.is_position_finished = true;
            pos_doc.TopElem.position_finish_date = Date();
        }
    } else {
        pos_doc.TopElem.is_position_finished = false;
        pos_doc.TopElem.position_finish_date = null;
    }

    var subdiv = null;

    switch(String(usertype).toLowerCase())
    {
        case 'con':
            if (jobTitle == 'Team Member') {
                subdiv = getCorporateStore(org, parseStoreId(store_id));
            } else {
                subdiv = corporate_rsc_subdiv;
            }
            break;
        case 'yca':
            subdiv = corporate_rsc_subdiv;
            break;
        case 'ycc':
            subdiv = getCorporateStore(org, parseStoreId(store_id));
            break;
        case 'yfa':
            subdiv = getFranchiseRSC(org, franchise_id);
            break;
        case 'yfc':
            subdiv = getFranchiseStore(org, franchise_id, parseStoreId(store_id));
            break;
    }

    position_info = null;

    if (subdiv != null)
    {
        subdiv_doc = tools.open_doc(subdiv.id);
        pos_doc.TopElem.parent_object_id = subdiv.id;
        pos_doc.TopElem.custom_elems.ObtainChildByKey('subdiv_format').value = subdiv_doc.TopElem.custom_elems.ObtainChildByKey('format').value;
        if (subdiv.id == corporate_rsc_subdiv.id) {
            if (hrData != null) {
                subdiv_info = GetOrCreateSubdivisionRSC(ArrayOptFirstElem(hrData.GetOptProperty('departments', [{ "name": EncodeCharset("Без департамента", "windows-1251") }]), { "name": EncodeCharset("Без департамента", "windows-1251") }), corporate_rsc_subdiv);
                pos_doc.TopElem.custom_elems.ObtainChildByKey('pos_name_ru').value = ArrayOptFirstElem(hrData.GetOptProperty('positions', [{ "title": '' }]), { "title": "" }).title;
            } else {
                subdiv_info = GetOrCreateSubdivisionRSC({ "name": EncodeCharset("Без департамента", "windows-1251") }, corporate_rsc_subdiv);
            }
            pos_doc.TopElem.parent_object_id = subdiv_info.id;
        }
        pos_doc.Save();

        if (jobTitle == 'Assistant Manager' && is_dismiss != true) {
            manager_subdiv_doc = ArrayOptFind(subdiv_doc.TopElem.func_managers, 'OptInt(This.person_id) == ' + coll_doc.DocID);
            if (manager_subdiv_doc == undefined) {
                manager_subdiv_doc = subdiv_doc.TopElem.func_managers.AddChild();
            }

            manager_subdiv_doc.person_id = pos_doc.TopElem.basic_collaborator_id;
            manager_subdiv_doc.person_fullname = pos_doc.TopElem.basic_collaborator_id.sd.fullname;
            manager_subdiv_doc.person_position_id = pos_doc.DocID;
            manager_subdiv_doc.person_position_name = pos_doc.TopElem.name;
            manager_subdiv_doc.person_org_id = pos_doc.TopElem.org_id;
            manager_subdiv_doc.person_org_name = org.name;
            manager_subdiv_doc.person_subdivision_id = pos_doc.TopElem.parent_object_id;
            manager_subdiv_doc.person_subdivision_name = subdiv.name;
            manager_subdiv_doc.is_native = true;
            manager_subdiv_doc.boss_type_id = main_boss_type.id;
            new_func_managers.push({person_id: pos_doc.TopElem.basic_collaborator_id, subdivision_id: subdiv.id});

            subdiv_doc.Save();
        }

        position_info = {
            id: pos_doc.DocID,
            name: pos_doc.TopElem.name,
            parent_id: subdiv.id,
            parent_name: subdiv.name,
            subdiv_format: pos_doc.TopElem.custom_elems.ObtainChildByKey('subdiv_format').value
        };

    }

    return position_info;
}

function Log(message, ex)
{
    if (ex == null || ex == undefined)
    {
        LogEvent('agent_import_collaborators_from_gem_users', message);
    } else
    {
        LogEvent('agent_import_collaborators_from_gem_users', (message + '. Message: ' + ex));
    }
}

function Exit(message)
{
    Log(message);
    Log('Agent finished')
    EnableLog('agent_import_collaborators_from_gem_users', false);
    throw message;
}

function Run() {
    EnableLog('agent_import_collaborators_from_gem_users');

    Log('Processing data from GEM started.');

    var new_func_managers = [];

    var org = getOrg();

    if (org == undefined)
    {
        Exit('YUM org not found');
    }

    var corporate_rsc_subdiv = getCorporateRSC(org);

    if (corporate_rsc_subdiv == undefined)
    {
        Exit('RSC in Corporate not found');
    }

    var gem_users = getGemUsers();

    var processed_collaborators = [];

    main_boss_type = ArrayOptFirstElem(XQuery("sql: SELECT * FROM boss_types WHERE code = 'main'"), null);

    Log('Main processing started');

    for (gem_user in gem_users)
    {
        try
        {
            if (gem_user.GetOptProperty('bmu', 'KFC RUSSIA') != 'KFC RUSSIA' && String(gem_user.GetOptProperty('bmu', 'russia')).toLowerCase() != 'russia') {
                Log('User with login ' + gem_user.login + ' has been skipped. Reason: BMU != "KFC RUSSIA"');
                continue;
            }

            coll_doc = getOrCreateCollaborator(gem_user.login);

            coll_doc.TopElem.firstname = gem_user.firstName;
            coll_doc.TopElem.lastname = gem_user.lastName;
            coll_doc.TopElem.middlename = gem_user.GetOptProperty('middleName', null);
            coll_doc.TopElem.birth_date = parseBirthDate(gem_user.GetOptProperty('dateOfBirth', null));
            coll_doc.TopElem.email = gem_user.GetOptProperty('email', null);
            coll_doc.TopElem.email_conf_date = Date();
            coll_doc.TopElem.email_conf = true;
            coll_doc.TopElem.hire_date = OptDate(gem_user.GetOptProperty('startDate'), null);
            coll_doc.TopElem.last_import_date = Date();

            if (String(gem_user.GetOptProperty('status', 'active')).toLowerCase() != 'active') {
                if (coll_doc.TopElem.is_dismiss != true) {
                    coll_doc.TopElem.dismiss_date = Date();
                }
                coll_doc.TopElem.is_dismiss = true;
                //coll_doc.TopElem.access.web_banned = true;
            } else {
                coll_doc.TopElem.is_dismiss = false;
                coll_doc.TopElem.dismiss_date = null;
                //coll_doc.TopElem.access.web_banned = false;
            }

            usertype = gem_user.GetOptProperty('userType', null);
            jobTitle = gem_user.GetOptProperty('jobTitle', null);
            hrData = gem_user.GetOptProperty('hrData', null);

            coll_doc.TopElem.custom_elems.ObtainChildByKey('user_type').value = usertype;
            coll_doc.TopElem.custom_elems.ObtainChildByKey('job_role').value = jobTitle;
            coll_doc.TopElem.custom_elems.ObtainChildByKey('department').value = gem_user.GetOptProperty('department', null);

            usertypeLowerCase = String(usertype).toLowerCase();
            if ((usertypeLowerCase == "ycc" || usertypeLowerCase == "yca" || usertypeLowerCase == "con" || getCorporateStore(org, gem_user.GetOptProperty('restaurantId', null)) != null) && hrData != null) {
                if (hrData.HasProperty('firstName') && hrData.HasProperty('lastName')) {
                    coll_doc.TopElem.custom_elems.ObtainChildByKey('firstname_en').value = coll_doc.TopElem.firstname;
                    coll_doc.TopElem.custom_elems.ObtainChildByKey('lastname_en').value = coll_doc.TopElem.lastname;
                    coll_doc.TopElem.custom_elems.ObtainChildByKey('middlename_en').value = coll_doc.TopElem.middlename;
                    coll_doc.TopElem.firstname = hrData.firstName;
                    coll_doc.TopElem.lastname = hrData.lastName;
                    coll_doc.TopElem.middlename = hrData.GetOptProperty('middleName', null);
                }
            }

            position_info = getOrCreatePosition(
                org,
                corporate_rsc_subdiv,
                main_boss_type,
                new_func_managers,
                coll_doc,
                usertype,
                jobTitle,
                hrData,
                gem_user.GetOptProperty('companyId', null),
                gem_user.GetOptProperty('restaurantId', null),
                coll_doc.TopElem.is_dismiss
            );

            if (position_info != null) {
                if ((usertypeLowerCase == "ycc" || usertypeLowerCase == "yca" || usertypeLowerCase == "con" || getCorporateStore(org, gem_user.GetOptProperty('restaurantId', null)) != null) && hrData != null) {
                    coll_doc.TopElem.custom_elems.ObtainChildByKey('pos_name_ru').value = ArrayOptFirstElem(hrData.GetOptProperty('positions', [{ "title": '' }]), { "title": '' }).title;
                }
                coll_doc.TopElem.position_id = position_info.id;
                coll_doc.TopElem.position_name = position_info.name;
                coll_doc.TopElem.position_parent_id = position_info.parent_id;
                coll_doc.TopElem.position_parent_name = position_info.parent_name;
                coll_doc.TopElem.org_id = org.id;
                coll_doc.TopElem.org_name = org.name;
            }

            coll_doc.Save();

            processed_collaborators.push({doc: coll_doc, manager_login: gem_user.GetOptProperty('managerId', null)});

            Log("Finished main processing GEM user with login '" + coll_doc.TopElem.login + "' and id '" + coll_doc.TopElem.id + "'");

            if (coll_doc.TopElem.custom_elems.ObtainChildByKey('active_first_edu').value == 'true') {
                Log("Start attempt active first education for new user with login '" + coll_doc.TopElem.login + "' and id '" + coll_doc.TopElem.id + "'");

                if (position_info != null && (position_info.name == 'FOH' || position_info.name == 'MOH' || position_info.name == 'BOH' || position_info.name == 'Team Member')) {
                    Log('User is FOH, MOH, BOH or Team Member');

                    subdiv_is_exception = ArrayOptFirstElem(XQuery("sql: " +
                        " DECLARE " +
                        " @user_subdivision_id BIGINT = " + position_info.parent_id + "; " +
                        "  " +
                        " WITH subdivs AS ( " +
                        " 	SELECT * FROM subdivisions " +
                        " 	WHERE id = @user_subdivision_id " +
                        " 	UNION ALL " +
                        " 	SELECT p_sds.* FROM subdivisions p_sds " +
                        " 	INNER JOIN subdivs c_sds ON c_sds.parent_object_id = p_sds.id " +
                        " ) " +
                        " SELECT id FROM subdivs " +
                        " WHERE name LIKE 'Эй Кей Ресторантс' "
                    )) != undefined;

                    if (subdiv_is_exception) {
                        Log('Failed active first education. Reason: subdivision included an exception partner');

                        coll_doc.TopElem.custom_elems.ObtainChildByKey('active_first_edu').value == 'false';
                        coll_doc.Save();
                    } else {
                        if (String(position_info.GetOptProperty('subdiv_format', '')).toLowerCase() == 'smartbox') {
                            Log('User in Smartbox subdivision. Active first education immediately');

                            custom_tools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_tools.js"));
                            assign_compound_programs = ArraySelectAll(XQuery("sql: SELECT id FROM compound_programs WHERE code IN ('019', '021')"));

                            for (assign_compound_program in assign_compound_programs) {
                                try {
                                    custom_tools.active_compound_program(coll_doc.DocID, assign_compound_program.id);
                                } catch(ex) {
                                    Log('Failed active first education.', ex);
                                }
                            }

                            coll_doc.TopElem.custom_elems.ObtainChildByKey('active_first_edu').value = 'false';
                            coll_doc.Save();

                            Log('Successed active first education.');
                        }
                    }
                } else {
                    Log('Failed active first education. Reason: user is not FOH, MOH, BOH or Team Member');

                    coll_doc.TopElem.custom_elems.ObtainChildByKey('active_first_edu').value = 'false';
                    coll_doc.Save();
                }

                Log("Finish attempt active first education for new user with login '" + coll_doc.TopElem.login + "' and id '" + coll_doc.TopElem.id + "'");
            }
        }
        catch(ex)
        {
            Log("Error occured, GEM user '" + tools.object_to_text(gem_user, 'json') + "' was not main processed", ex);
        }
    }

    Log('Main processing finished');

    Log('Post processing started');

    for (coll in processed_collaborators)
    {
        try
        {
            coll.doc.TopElem.func_managers.Clear();

            if (!isNullOrEmpty(coll.manager_login))
            {
                manager = getCollaborator(coll.manager_login);

                if (manager != null)
                {
                    manager_doc = coll.doc.TopElem.func_managers.AddChild();
                    manager_doc.person_id = manager.TopElem.id;
                    manager_doc.person_fullname = manager.TopElem.fullname;
                    manager_doc.person_position_id = manager.TopElem.position_id;
                    manager_doc.person_position_name = manager.TopElem.position_name;
                    manager_doc.person_org_id = manager.TopElem.org_id;
                    manager_doc.person_org_name = manager.TopElem.org_name;
                    manager_doc.person_subdivision_id = manager.TopElem.position_parent_id;
                    manager_doc.person_subdivision_name = manager.TopElem.position_parent_name;
                    manager_doc.is_native = true;
                    manager_doc.boss_type_id = main_boss_type.id;

                    coll.doc.Save();

                    Log("Manager with login '" + coll.manager_login + "' was added to user with login " + coll.doc.TopElem.login);
                } else {
                    Log("Manager can not be added to user with login " + coll.doc.TopElem.login + ". Manager with login '" + coll.manager_login + "' not found");
                }
            }

            coll.doc.Save();
        }
        catch (ex)
        {
            Log("Error occured, collaborator with login '" + coll.doc.TopElem.login + "' was not post processed", ex);
        }
    }

    Log('Post processing finished');

    Log('Fix moved subdivisions for old users started');

    var incorrect_colls_json = ArrayOptFirstElem(XQuery("sql: " +
        " WITH incorrect_colls AS ( " +
        " 	SELECT DISTINCT cls.id, cls.login FROM collaborators cls " +
        " 	INNER JOIN cc_ldap_users lurs ON lurs.uid = cls.login " +
        " 	INNER JOIN positions ps ON ps.basic_collaborator_id = cls.id " +
        " 	LEFT JOIN subdivisions sds ON sds.id = ps.parent_object_id " +
        " 	WHERE sds.id IS NULL " +
        " ), " +
        " incorrect_colls_props AS ( " +
        " 	SELECT lups.*, lurs.uid FROM cc_ldap_users lurs " +
        " 	INNER JOIN incorrect_colls cls ON cls.login = lurs.uid " +
        " 	INNER JOIN cc_ldap_user_properties lups ON lups.ldap_user_id = lurs.id " +
        " 	WHERE lurs.uid = cls.login " +
        " ) " +
        " SELECT  " +
        " 	CONCAT('[ ', STRING_AGG(ldap_users.json, ', '), ' ]') json " +
        " FROM ( " +
        " 	SELECT " +
        "       CONCAT('{ ', STRING_AGG(CONCAT('\"', p.prop_name, '\": ', CASE WHEN ISJSON(p.prop_value) = 1 THEN p.prop_value ELSE CONCAT('\"', p.prop_value, '\"') END), ', '), ' }') json " +
        " 	FROM incorrect_colls_props p " +
        " 	GROUP BY p.uid " +
        " ) ldap_users "
    ), { json: "[]" }).json;

    var incorrect_colls = tools.read_object(incorrect_colls_json);

    Log('Incorrect colls count: ' + ArrayCount(incorrect_colls));

    var processing_count = 0;

    for (incorrect_coll in incorrect_colls) {
        try {
            if (incorrect_coll.GetOptProperty('login') == undefined) {
                continue;
            }

            coll_doc = getCollaborator(incorrect_coll.login);
            if (isNullOrEmpty(coll_doc)) {
                continue;
            }

            position_info = getOrCreatePosition(
                org,
                corporate_rsc_subdiv,
                main_boss_type,
                new_func_managers,
                coll_doc,
                incorrect_coll.GetOptProperty('userType', null),
                incorrect_coll.GetOptProperty('jobTitle', null),
                incorrect_coll.GetOptProperty('hrData', null),
                incorrect_coll.GetOptProperty('companyId', null),
                incorrect_coll.GetOptProperty('restaurantId', null),
                coll_doc.TopElem.is_dismiss
            );

            if (position_info != null) {
                coll_doc.TopElem.position_id = position_info.id;
                coll_doc.TopElem.position_name = position_info.name;
                coll_doc.TopElem.position_parent_id = position_info.parent_id;
                coll_doc.TopElem.position_parent_name = position_info.parent_name;
                coll_doc.TopElem.org_id = org.id;
                coll_doc.TopElem.org_name = org.name;
                coll_doc.Save();

                processing_count++;
                Log("Finished fix moved subdivision for user with login '" + coll_doc.TopElem.login + "' and id '" + coll_doc.TopElem.id + "'");
            }
        } catch(ex) {
            Log("Error occured, collaborator with login '" + incorrect_coll.GetOptProperty('uid', 'UID NOT FOUND') + "' was not fix moved subdivision processed", ex);
        }
    }

    Log('Fix moved subdivisions for old users finished. Result: ' + processing_count + '/' + ArrayCount(incorrect_colls));

    Log('Update Area Coach managers started');

    area_coaches_with_sub_subdivs = ArraySelectAll(XQuery("sql: " +
        " WITH area_coaches AS ( " +
        " 	SELECT DISTINCT cls.id FROM collaborators cls " +
        " 	INNER JOIN positions ps ON ps.basic_collaborator_id = cls.id " +
        " 	WHERE ISNULL(cls.is_dismiss, 0) = 0 AND ps.name = 'Area Coach' " +
        " ), " +
        " subordinates AS ( " +
        " 	SELECT fms.*, acs.id 'area_coach_id', 0 'rn' FROM func_managers fms " +
        " 	INNER JOIN area_coaches acs ON acs.id = fms.person_id " +
        " 	UNION ALL " +
        " 	SELECT fms.*, subs.area_coach_id, subs.rn + 1 'rn' FROM func_managers fms " +
        " 	INNER JOIN collaborators cls ON cls.id = fms.person_id AND ISNULL(cls.is_dismiss, 0) = 0 " +
        " 	INNER JOIN subordinates subs ON subs.object_id = fms.person_id " +
        " 	WHERE rn < 20 " +
        " ), " +
        " subdivision_subordinates AS ( " +
        " 	SELECT  " +
        " 		DISTINCT  " +
        " 		sds.id 'subordinate_subdivision_id',  " +
        " 		ac_cls.id 'area_coach_id',  " +
        " 		ac_cls.login 'area_coach_login', " +
        " 		ac_cls.fullname 'area_coach_fullname', " +
        " 		ac_cls.position_id 'area_coach_position_id', " +
        " 		ac_cls.position_name 'area_coach_position_name', " +
        " 		ac_cls.org_id 'area_coach_org_id', " +
        " 		ac_cls.org_name 'area_coach_org_name', " +
        " 		ac_cls.position_parent_id 'area_coach_position_parent_id', " +
        " 		ac_cls.position_parent_name 'area_coach_position_parent_name' " +
        " 	FROM collaborators cls " +
        " 	INNER JOIN subordinates subs ON subs.object_id = cls.id OR subs.person_id = cls.id " +
        " 	INNER JOIN positions ps ON ps.basic_collaborator_id = cls.id " +
        " 	INNER JOIN subdivisions sds ON sds.id = ps.parent_object_id " +
        " 	INNER JOIN collaborators ac_cls ON ac_cls.id = subs.area_coach_id " +
        " 	WHERE ISNULL(cls.is_dismiss, 0) = 0 AND cls.id != subs.area_coach_id " +
        " ) " +
        " SELECT * FROM subdivision_subordinates "
    ));

    try {
        for (area_coach in area_coaches_with_sub_subdivs) {
            sub_subdiv_doc = tools.open_doc(area_coach.subordinate_subdivision_id);
            if (sub_subdiv_doc == undefined) {
                continue;
            }

            manager_subdiv_doc = ArrayOptFind(sub_subdiv_doc.TopElem.func_managers, 'OptInt(This.person_id) == ' + area_coach.area_coach_id);
            if (manager_subdiv_doc == undefined) {
                manager_subdiv_doc = sub_subdiv_doc.TopElem.func_managers.AddChild();
            }

            manager_subdiv_doc.person_id = area_coach.area_coach_id;
            manager_subdiv_doc.person_fullname = area_coach.area_coach_fullname;
            manager_subdiv_doc.person_position_id = area_coach.area_coach_position_id;
            manager_subdiv_doc.person_position_name = area_coach.area_coach_position_name;
            manager_subdiv_doc.person_org_id = area_coach.area_coach_org_id;
            manager_subdiv_doc.person_org_name = area_coach.area_coach_org_name;
            manager_subdiv_doc.person_subdivision_id = area_coach.area_coach_position_parent_id;
            manager_subdiv_doc.person_subdivision_name = area_coach.area_coach_position_parent_name;
            manager_subdiv_doc.is_native = true;
            manager_subdiv_doc.boss_type_id = main_boss_type.id;

            new_func_managers.push({person_id: OptInt(area_coach.area_coach_id), subdivision_id: OptInt(area_coach.subordinate_subdivision_id)});

            sub_subdiv_doc.Save();

            Log("Manager with login '" + area_coach.area_coach_login + "' was added to subdivision with id " + area_coach.subordinate_subdivision_id);
        }
    } catch(ex) {
        Log('Processing error', ex);
    }

    Log('Update Area Coach managers finished');

    Log('Update RSC, Owner and Key Operator managers started');

    area_coaches = ArraySelectAll(XQuery("sql: " +
        " WITH subdiv_with_partners AS (  " +
        "     SELECT sds.id, sds.parent_object_id, sds.id 'partner_id' FROM subdivisions sds  " +
        "     INNER JOIN subdivisions psds ON psds.id = sds.parent_object_id AND psds.name IN ('Franchise')  " +
        "     UNION ALL  " +
        "     SELECT sds.id, sds.parent_object_id, swps.partner_id FROM subdivisions sds  " +
        "     INNER JOIN subdiv_with_partners swps ON swps.id = sds.parent_object_id  " +
        " )  " +
        " SELECT DISTINCT cls.id 'person_id', swps.partner_id FROM collaborators cls  " +
        " INNER JOIN positions ps ON ps.basic_collaborator_id = cls.id  " +
        " INNER JOIN subdiv_with_partners swps ON swps.id = ps.parent_object_id  " +
        " INNER JOIN func_managers higher_fms ON higher_fms.object_id = cls.id  " +
        " WHERE  " +
        " cls.position_name = 'Area Coach'  " +
        " AND ISNULL(cls.is_dismiss, 0) != 1 "
    ));

    partners = ArraySelectDistinct(area_coaches, 'This.partner_id');

    try {
        for (partner in partners) {
            Log('Processing partner with ID: '+ partner.partner_id);

            partner_subdiv_doc = tools.open_doc(partner.partner_id);
            //partner_subdiv_doc.TopElem.func_managers.Clear();

            area_coaches_by_partner = ArraySelect(area_coaches, 'This.partner_id == ' + partner.partner_id);
            Log('Collect Area Coaches by partner: ' + ArrayCount(area_coaches_by_partner));

            for (area_coach in area_coaches_by_partner) {
                ac_managers = ArraySelectAll(XQuery("sql: " +
                    " WITH managers AS ( " +
                    " 	SELECT fms.*, 0 'rn' FROM func_managers fms " +
                    " 	WHERE object_id = " + area_coach.person_id + " " +
                    " 	UNION ALL " +
                    " 	SELECT fms.*, mngs.rn + 1 'rn' FROM func_managers fms " +
                    " 	INNER JOIN managers mngs ON mngs.person_id = fms.object_id " +
                    " 	WHERE rn < 20 " +
                    " ) " +
                    " SELECT mngs.* FROM managers mngs " +
                    " INNER JOIN collaborators cls ON cls.id = mngs.person_id " +
                    " WHERE cls.position_name IN ('RSC', 'Owner', 'Key Operator') " +
                    " AND ISNULL(cls.is_dismiss, 0) != 1 "
                ));

                if (ArrayOptFirstElem(ac_managers) == undefined) {
                    Log('RSC, Owner or Key Operator managers for Area Coach with ID: ' + area_coach.person_id + ' not found or request failed by recursion.');
                }

                for (ac_manager in ac_managers) {
                    func_manager_doc = ArrayOptFind(partner_subdiv_doc.TopElem.func_managers, 'OptInt(This.person_id) == ' + ac_manager.person_id);

                    if (func_manager_doc == undefined) {
                        ac_manager_doc = tools.open_doc(ac_manager.person_id);

                        func_manager_doc = partner_subdiv_doc.TopElem.func_managers.AddChild();

                        func_manager_doc.person_id = ac_manager_doc.TopElem.id;
                        func_manager_doc.person_fullname = ac_manager_doc.TopElem.fullname;
                        func_manager_doc.person_position_id = ac_manager_doc.TopElem.position_id;
                        func_manager_doc.person_position_name = ac_manager_doc.TopElem.position_name;
                        func_manager_doc.person_org_id = ac_manager_doc.TopElem.org_id;
                        func_manager_doc.person_org_name = ac_manager_doc.TopElem.org_name;
                        func_manager_doc.person_subdivision_id = ac_manager_doc.TopElem.position_parent_id;
                        func_manager_doc.person_subdivision_name = ac_manager_doc.TopElem.position_parent_name;
                        func_manager_doc.is_native = true;
                        func_manager_doc.boss_type_id = main_boss_type.id;

                        Log(ac_manager_doc.TopElem.position_name + " manager with login '" + ac_manager_doc.TopElem.login + "' was added to partner subdivision with ID " + partner.partner_id);
                    }

                    new_func_managers.push({person_id: ac_manager.person_id, subdivision_id: partner.partner_id});
                }
            }

            partner_subdiv_doc.Save();
        }
    } catch(ex) {
        Log('Processing error', ex);
    }

    Log('Update RSC managers finished');

    Log('Update Market Coach started');

    try {
        market_coach_by_subdivs = ArraySelectAll(XQuery("sql: " +
            " WITH mngs_by_colls AS ( " +
            " 	SELECT DISTINCT cls.id, cls.fullname, cls.position_name, cls.position_parent_id, cls.id 'market_coach_id', fms.object_id, 0 'rn' " +
            " 	FROM collaborators cls " +
            " 	INNER JOIN func_managers fms ON fms.person_id = cls.id " +
            " 	WHERE cls.position_name = 'Market Coach' " +
            " 	AND ISNULL(cls.is_dismiss, 0) != 1 " +
            " 	UNION ALL " +
            " 	SELECT cls.id, cls.fullname, cls.position_name, cls.position_parent_id, mngs.market_coach_id, fms.object_id, mngs.rn + 1 'rn' FROM collaborators cls " +
            " 	INNER JOIN func_managers fms ON fms.object_id = cls.id " +
            " 	INNER JOIN mngs_by_colls mngs ON mngs.id = fms.person_id " +
            " 	WHERE ISNULL(cls.is_dismiss, 0) != 1 AND rn < 20 " +
            " ) " +
            " SELECT DISTINCT cls.position_parent_id, mngs.market_coach_id FROM collaborators cls " +
            " INNER JOIN mngs_by_colls mngs ON mngs.object_id = cls.id OR mngs.id = cls.id " +
            " WHERE cls.position_name = 'RGM' " +
            " AND ISNULL(cls.is_dismiss, 0) != 1 "
        ));

        func_boss_type = ArrayOptFirstElem(XQuery("sql: SELECT * FROM boss_types WHERE code = 'functional'"));

        for (market_coach in market_coach_by_subdivs) {
            rgm_subdiv_doc = tools.open_doc(market_coach.position_parent_id);
            if (rgm_subdiv_doc == undefined) {
                continue;
            }

            if (ArrayOptFind(rgm_subdiv_doc.TopElem.func_managers, 'OptInt(This.person_id) == ' + market_coach.market_coach_id) == undefined) {
                mc_manager_doc = tools.open_doc(market_coach.market_coach_id);

                if (mc_manager_doc == undefined) {
                    continue;
                }

                func_manager_doc = rgm_subdiv_doc.TopElem.func_managers.AddChild();

                func_manager_doc.person_id = mc_manager_doc.TopElem.id;
                func_manager_doc.person_fullname = mc_manager_doc.TopElem.fullname;
                func_manager_doc.person_position_id = mc_manager_doc.TopElem.position_id;
                func_manager_doc.person_position_name = mc_manager_doc.TopElem.position_name;
                func_manager_doc.person_org_id = mc_manager_doc.TopElem.org_id;
                func_manager_doc.person_org_name = mc_manager_doc.TopElem.org_name;
                func_manager_doc.person_subdivision_id = mc_manager_doc.TopElem.position_parent_id;
                func_manager_doc.person_subdivision_name = mc_manager_doc.TopElem.position_parent_name;
                func_manager_doc.is_native = false;
                func_manager_doc.boss_type_id = func_boss_type.id;

                Log("Market Coach with login '" + mc_manager_doc.TopElem.login + "' was added to subdivision with id " + market_coach.position_parent_id);
            }

            new_func_managers.push({person_id: market_coach.market_coach_id, subdivision_id: market_coach.position_parent_id});

            rgm_subdiv_doc.Save();
        }
    } catch(ex) {
        Log('Processing error', ex);
    }

    Log('Update Market Coach finished');

    Log('Clear old func managers in subdivision started');

    unprocessable_managers_logins = ArrayMerge(XQuery("sql: " +
        " SELECT c.login FROM collaborators c " +
        " JOIN group_collaborators gc ON gc.collaborator_id = c.id AND gc.code = 'ldap_integration_exceptions';"), 'This.login', ';'
    );

    Log('Unprocessable manager logins: ' + unprocessable_managers_logins);

    unprocessable_managers_with_subdiv_id = ArraySelectAll(XQuery("sql: " +
        // Получаем руководителей из группы исключения при обработке
        " DECLARE " +
        " @logins_str NVARCHAR(max) = '" + unprocessable_managers_logins + "'; " +
        "  " +
        " DECLARE " +
        " @logins AS TABLE( " +
        " 	login NVARCHAR(max) " +
        " ); " +
        "  " +
        " INSERT INTO @logins " +
        " SELECT value FROM string_split(@logins_str, ';'); " +
        "  " +
        " SELECT fms.person_id, fms.object_id 'subdivision_id' FROM collaborators cls " +
        " INNER JOIN @logins logins ON logins.login = cls.login " +
        " INNER JOIN func_managers fms ON fms.person_id = cls.id AND fms.catalog = 'subdivision' " +
        " UNION ALL " +
        // Получаем руководителей Assistant Manager на своем подразделении, чтобы не снять с него
        " SELECT fms.person_id, fms.object_id 'subdivision_id' FROM func_managers fms " +
        " INNER JOIN collaborators cls ON cls.id = fms.person_id " +
        " INNER JOIN collaborator cl ON cl.id = cls.id " +
        " WHERE fms.catalog = 'subdivision' AND cl.data.value('(/collaborator/custom_elems/custom_elem[name=''job_role'']/value)[1]', 'varchar(50)') = 'Assistant Manager' AND cls.position_parent_id = fms.object_id AND cls.is_dismiss = 0 "
    ));

    new_func_managers = ArrayUnion(new_func_managers, unprocessable_managers_with_subdiv_id);

    try {
        all_subdivs = ArraySelectAll(XQuery("sql: SELECT * FROM subdivisions"));

        for (subdiv in all_subdivs) {
            subdiv_doc = tools.open_doc(subdiv.id);
            if (subdiv_doc == undefined) {
                continue;
            }

            new_func_managers_by_subdiv = ArraySelect(new_func_managers, 'This.subdivision_id == ' + subdiv.id);

            for (i = 0; i < ArrayCount(subdiv_doc.TopElem.func_managers); i++) {
                try {
                    func_manager_exist = ArrayOptFind(new_func_managers_by_subdiv, 'This.person_id == ' + OptInt(subdiv_doc.TopElem.func_managers[i].person_id)) != undefined;
                    if (!func_manager_exist) {
                        Log('Remove func manager from subdivision. CollID: ' + subdiv_doc.TopElem.func_managers[i].person_id + ' SubdivisionID: ' + subdiv.id);
                        subdiv_doc.TopElem.func_managers[i].Delete();
                        i = -1;
                    }
                } catch(ex) {
                    Log('Remove func manager from subdivision failed. SubdivisionID: ' + subdiv.id, ex);
                }
            }

            subdiv_doc.Save();
        }
    } catch(ex) {
        Log('Processing error', ex);
    }

    Log('Ban/unban dismissed collaborators started');

    colls = ArraySelectAll(XQuery("sql: " +
        " WITH subdivs AS ( " +
        "     SELECT id, parent_object_id FROM subdivisions " +
        "     WHERE name NOT IN ('ИРБ', 'АмРест') AND parent_object_id IN (7174468763177068091, 7174468763533910461) " +
        "     UNION ALL " +
        "     SELECT sds.id, sds.parent_object_id FROM subdivisions sds " +
        "     INNER JOIN subdivs psds ON psds.id = sds.parent_object_id " +
        " ) " +
        " SELECT DISTINCT cls.id, ISNULL(cls.is_dismiss, 0) 'is_dismiss' FROM collaborators cls " +
        " INNER JOIN positions ps ON ps.basic_collaborator_id = cls.id " +
        " LEFT JOIN subdivs m_sds ON m_sds.id = ps.parent_object_id " +
        " LEFT JOIN subdivisions sds ON sds.id = ps.parent_object_id " +
        " WHERE ISNULL(cls.is_dismiss, 0) != ISNULL(cls.web_banned, 0) AND (m_sds.id IS NOT NULL OR sds.id IS NULL) "
    ));

    try {
        for (col in colls) {
            col_doc = tools.open_doc(col.id);
            if (col_doc == undefined) {
                continue;
            }

            col_doc.TopElem.access.web_banned = col.is_dismiss;
            col_doc.Save();
        }
    } catch(ex) {
        Log('Processing error', ex);
    }

    Log('Ban/unban dismissed collaborators finished');

    Log('Processing data from GEM finished.');

    EnableLog('agent_import_collaborators_from_gem_users', false);
}

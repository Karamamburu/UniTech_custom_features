function log(text) {
    try {
        LogEvent("create_education_plan_multipurpose_log", text);
    } catch (e) {
        LogEvent("create_education_plan_multipurpose_log", e);
    }
}

function active_compound_program(user_id, compound_program_id) {
    compoundProgramDoc = tools.open_doc(compound_program_id);
    if (compoundProgramDoc == undefined)
        throw 'Compound program not found';

    personDoc = tools.open_doc(user_id);
    if (personDoc == undefined)
        throw 'User not found';

    teCompoundProgram = compoundProgramDoc.TopElem;

    cur_education_plan = tools.new_doc_by_name("education_plan", false);
    cur_education_plan.TopElem.programs.AssignElem(teCompoundProgram.programs);
    cur_education_plan.TopElem.name = teCompoundProgram.name;
    cur_education_plan.TopElem.compound_program_id = teCompoundProgram.id.Value;
    cur_education_plan.TopElem.create_date = Date();
    cur_education_plan.TopElem.person_id = personDoc.DocID;
    cur_education_plan.TopElem.user_group_id = personDoc.TopElem.access.user_group_id;
    tools.common_filling('collaborator', cur_education_plan.TopElem, personDoc.DocID, personDoc.TopElem);

    cur_education_plan.BindToDb();

    for (_program in cur_education_plan.TopElem.programs) {
        _duration = OptInt(_program.days, 0);
        if (_duration == 0 && _program.parent_progpam_id.HasValue) {
            _parent_program = ArrayOptFind(cur_education_plan.TopElem.programs, 'This.id == ' + _program.parent_progpam_id);
            if (_parent_program != undefined) {
                _duration = OptInt(_parent_program.days, 0);
            }
        }
        if (!_program.education_method_id.HasValue) {
            if (_program.type == 'course') {
                course_doc = tools.open_doc(_program.object_id);

                if (course_doc != undefined && tools_web.is_true(course_doc.TopElem.custom_elems.ObtainChildByKey("is_certificate").value)) {
                    old_learning = undefined;
                } else {
                    old_learning = ArrayOptFirstElem(XQuery("sql: " +
                        " DECLARE " +
                        " @collaborator_id BIGINT = " + personDoc.DocID + ", " +
                        " @course_id BIGINT = " + _program.object_id + "; " +

                        " SELECT ls.id, ls.state_id FROM learnings ls " +
                        " INNER JOIN learning l ON l.id = ls.id " +
                        " INNER JOIN course c ON c.id = ls.course_id " +
                        " WHERE ls.person_id = @collaborator_id AND ls.course_id = @course_id " +
                        " AND ISNULL(ls.code, '') NOT IN ('only_show', 'out_plan') " +
                        " ORDER BY ls.modification_date "
                    ));
                }

                if (old_learning != undefined) {
                    _program.result_object_id = old_learning.id;
                    _program.result_type = 'learning';
                    _program.state_id = 4;
                } else {
                    _result = tools.activate_course_to_person(personDoc.DocID, _program.object_id, null, personDoc.TopElem, cur_education_plan.DocID, _duration);
                    try {
                        _program.active_learning_id = _result.DocID;
                        _program.result_object_id = _result.DocID;
                        _program.result_type = 'active_learning';
                        _program.state_id = 0;
                    }
                    catch (sdf) {
                        _program.active_learning_id = _result;
                        _program.result_object_id = _result;
                        _program.result_type = 'active_learning';
                        _program.state_id = 1;
                    }
                }

            } else if (_program.type == 'assessment') {
                old_test_learning = ArrayOptFirstElem(XQuery("sql: " +
                    " DECLARE " +
                    " @collaborator_id BIGINT = " + personDoc.DocID + ", " +
                    " @assessment_id BIGINT = " + _program.object_id + "; " +

                    " SELECT tls.id, tls.state_id FROM test_learnings tls " +
                    " INNER JOIN test_learning tl ON tl.id = tls.id " +
                    " INNER JOIN assessments ass ON ass.id = tls.assessment_id " +
                    " WHERE tls.person_id = @collaborator_id AND tls.assessment_id = @assessment_id " +
                    " AND ISNULL(ass.code, '') NOT IN ('director_certification_test') AND tls.state_id = 4 " +
                    " ORDER BY tls.modification_date "
                ));

                if (old_test_learning != undefined) {
                    _program.result_object_id = old_test_learning.id;
                    _program.result_type = 'test_learning';
                    _program.state_id = 4;
                } else {
                    _result = tools.activate_test_to_person(personDoc.DocID, _program.object_id, null, personDoc.TopElem, null, null, _duration, null, '', null, cur_education_plan.DocID);
                    try {
                        _program.result_object_id = _result.DocID;
                        _program.result_type = 'active_test_learning';
                        _program.state_id = 0;
                    }
                    catch (sdf) {
                        _program.result_object_id = _result;
                        _program.result_type = 'active_test_learning';
                        _program.state_id = 1;
                    }
                }
            } else if (_program.type == 'material' && _program.catalog_name == 'library_material') {
                library_material_viewing = ArrayOptFirstElem(XQuery("sql:" +
                    " SELECT lmvs.* FROM library_material_viewings lmvs " +
                    " WHERE lmvs.person_id = " + personDoc.DocID + " " +
                    " AND lmvs.material_id = " + _program.object_id + " " +
                    " AND lmvs.state_id = 'finished' "
                ));

                if (library_material_viewing != undefined) {
                    library_material_viewing = tools.open_doc(library_material_viewing.id);
                    library_material_viewing.Save();
                    _program.state_id = 4;
                } else {
                    library_material_viewing = tools.new_doc_by_name('library_material_viewing', false);
                    library_material_viewing.BindToDb();
                    lib_material_doc = tools.open_doc(_program.object_id);
                    person_obj = ArrayOptFirstElem(XQuery('sql: SELECT *, orgs.code org_code, sds.code sds_code FROM collaborators cls LEFT JOIN orgs orgs ON orgs.id = cls.org_id LEFT JOIN subdivisions sds ON sds.id = cls.position_parent_id WHERE cls.id = ' + personDoc.DocID), {});
                    if (lib_material_doc != undefined) {
                        library_material_viewing.TopElem.material_id = _program.object_id;
                        library_material_viewing.TopElem.material_name = lib_material_doc.TopElem.name;
                        library_material_viewing.TopElem.person_id = person_obj.GetOptProperty('id');
                        library_material_viewing.TopElem.person_fullname = person_obj.GetOptProperty('fullname', '');
                        library_material_viewing.TopElem.person_position_id = person_obj.GetOptProperty('position_id');
                        library_material_viewing.TopElem.person_position_name = person_obj.GetOptProperty('position_name', '');
                        library_material_viewing.TopElem.person_org_id = person_obj.GetOptProperty('org_id');
                        library_material_viewing.TopElem.person_org_name = person_obj.GetOptProperty('org_name', '');
                        library_material_viewing.TopElem.person_org_code = person_obj.GetOptProperty('org_code', '');
                        library_material_viewing.TopElem.person_subdivision_id = person_obj.GetOptProperty('position_parent_id');
                        library_material_viewing.TopElem.person_subdivision_name = person_obj.GetOptProperty('position_parent_name', '');
                        library_material_viewing.TopElem.person_subdivision_code = person_obj.GetOptProperty('sds_code', '');
                        library_material_viewing.TopElem.state_id = 'plan';
                        library_material_viewing.TopElem.education_plan_id = cur_education_plan.DocID;
                        library_material_viewing.Save();
                        _program.result_object_id = library_material_viewing.DocID;
                    }
                }
            }
            continue;
        }

        educationMethodDoc = OpenDoc(UrlFromDocID(_program.education_method_id)).TopElem;
        switch (educationMethodDoc.type) {
            case 'course':
                if (educationMethodDoc.course_id != null) {
                    _program.type = 'course';
                    _program.object_id = educationMethodDoc.course_id;

                    _result = tools.activate_course_to_person(personDoc.DocID, educationMethodDoc.course_id, null, personDoc.TopElem, cur_education_plan.DocID, _duration);
                    try {
                        _program.active_learning_id = _result.DocID;
                        _program.result_object_id = _result.DocID;
                        _program.result_type = 'active_learning';
                        _program.state_id = 0;
                    }
                    catch (sdf) {
                        _program.active_learning_id = _result;
                        _program.result_object_id = _result;
                        _program.result_type = 'active_learning';
                        _program.state_id = 1;
                    }
                }
                break;
        }
    }

    cur_education_plan.Save();
}

EnableLog("create_education_plan_multipurpose_log");
log('Agent create_education_plan_multipurpose started');

var query = "sql: 
			SELECT c.* FROM group_collaborators gpcls
			LEFT JOIN education_plans ep ON ep.person_id = gpcls.collaborator_id AND ep.compound_program_id = " + Param.module_program + " 
			LEFT JOIN collaborators c ON c.id = gpcls.collaborator_id
			WHERE ep.id IS NULL 
			AND gpcls.group_id = " + Param.group

var collaborators = ArraySelectAll(XQuery(query));

var compoundProgramDoc = tools.open_doc(Param.module_program);
succesProcessingCol=[];

var teNotificationTypeDoc = tools.open_doc(Param.notification_type).TopElem;
var notificationTypeCode = teNotificationTypeDoc.code;

if (compoundProgramDoc == undefined){
    log("not found module program");
} else {
    for (col in collaborators) {
        try {
            active_compound_program(col.id, compoundProgramDoc.TopElem.id);

            succesProcessingCol.push(col.id);

            tools.create_notification(notificationTypeCode, col.id, '', '');

            log('Education plan for collaborator with ID ' + col.id + ' created.');
        } catch(ex) {
            log('Creating education plan for collaborator with ID ' + col.id + ' ended with an error. Error: ' + ex);
        }
    }
}

log('Agent create_education_plan_multipurpose finished');
EnableLog("create_education_plan_multipurpose_log", false);
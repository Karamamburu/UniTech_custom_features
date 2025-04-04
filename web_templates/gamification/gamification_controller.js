
Server.Execute(AppDirectoryPath() + "/wt/web/include/user_init.html" );
DropFormsCache(FilePathToUrl(AppDirectoryPath()+"/custom_tools/custom_game_tools.js"));
custom_game_tools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_game_tools.js"));

DropFormsCache(FilePathToUrl(AppDirectoryPath()+"/custom_tools/custom_tools.js"));
custom_tools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_tools.js"));

result = {
    'success': true
};

request_body = tools.read_object(Request.Body);
mode = request_body.GetOptProperty('mode', '');

function GetBaseSql(userId) {
    sSqlReq = " DECLARE @userId BIGINT = " + curUserID + "; " +
    " SELECT  " +
    "     qas.id as id, " +
    " 	qas.person_id, " +
    " 	qas.person_fullname, " +
    "     qas.sender_id as sender_id, " +
    "     cs.fullname as sender_fullname, " +
    "     qas.assignment_date as assign_date, " +
    "     pic_url = '/images/trophy_image' + IIF(qas.sender_id = @userId, '_out.svg', '_in.svg'),  " +
    "     IIF(qas.sender_id = @userId, NULL, ISNULL(trans.amount, 0)) 'amount', " +
    "     'qualification_assignment' as item_type, " +
    " 	user_is_sender = IIF(qas.sender_id = @userId, 1, 0) " +
    " FROM qualification_assignments qas " +
    " INNER JOIN qualification_assignment qa ON qa.id = qas.id " +
    " INNER JOIN qualifications quals ON qas.qualification_id = quals.id   " +
    " INNER JOIN qualification qual ON quals.id = qual.id   " +
    " LEFT JOIN collaborators cs ON cs.id = qas.sender_id " +
    " LEFT JOIN transactions trans ON trans.id = ISNULL(qa.data.value('(//custom_elems/custom_elem[name=''in_transaction_id'']/value)[1]', 'bigint'), 0) AND direction = 1 " +
    " WHERE (qas.person_id = @userId OR qas.sender_id = @userId) AND qas.is_reward = 1 AND qas.status = 'assigned' " +
    " UNION ALL " +
    " SELECT " +
    "     cai.id as id, " +
    " 	cai.collaborator_id as person_id, " +
    " 	cls.fullname as person_fullname, " +
    "     cai.sender_id, " +
    "     sender_cls.fullname as sender_fullname, " +
    "     cai.assign_date as assign_date, " +
    "     pic_url = ('/images/icon_image') + IIF(cai.sender_id = @userId, '_out.svg', '_in.svg'), " +
    "     NULL as amount, " +
    "     'assign_icon' as item_type, " +
    " 	user_is_sender = IIF(cai.sender_id = @userId, 1, 0) " +
    " FROM cc_assign_icons cai " +
    " INNER JOIN cc_icons cis ON cis.id = cai.icon_id  " +
    " INNER JOIN collaborators cls ON cls.id = cai.collaborator_id " +
    " INNER JOIN collaborators sender_cls ON sender_cls.id = cai.sender_id " +
    " WHERE cai.collaborator_id = @userId OR cai.sender_id = @userId " +
    " UNION ALL " +
    " SELECT " +
    "     cas.id as id, " +
    " 	cas.recipient_id as person_id, " +
    " 	cls.fullname as person_fullname, " +
    "     sender_cls.id as sender_id, " +
    "     sender_cls.fullname as sender_fullname, " +
    "     cas.create_date as assign_date, " +
    "     pic_url = ('/images/acceptance_image') + IIF(cas.sender_id = @userId, '_out.svg', '_in.svg'), " +
    "     ts.amount as amount, " +
    "     'acceptance' as item_type, " +
    " 	user_is_sender = IIF(cas.sender_id = @userId, 1, 0) " +
    " FROM cc_acceptances cas " +
    " INNER JOIN collaborators cls ON cls.id = cas.recipient_id " +
    " INNER JOIN collaborators sender_cls ON sender_cls.id = cas.sender_id " +
    " INNER JOIN transactions ts ON cas.in_transaction_id = ts.id " +
    " WHERE cas.recipient_id = @userId OR cas.sender_id = @userId " +
    " ORDER BY id DESC "

    return sSqlReq

}

function ApplyPaginationToRequest(base_sql, skip, take) {
	sql_request = base_sql;
	if (take != undefined && skip != undefined) {
        sql_request += " OFFSET " + skip + " ROWS FETCH NEXT " + take + " ROWS ONLY";
    }
	return sql_request;
}


switch(mode) {
    case 'history_columns':
        result = [{
            "dataField": "assign_date",
            "caption": "Дата",
            "dataType": "date",
            "width": "120"
        }, {
            "dataField": "pic_url",
            "caption": "Иллюстрация",
            "dataType": "string",
            "width": "30" 
        }, {
            "dataField": "from",
            "caption": "Начислений",
            "dataType": "string",
            "width": "undefined" 
        }, {
            "dataField": "score",
            "caption": "Тип",
            "dataType": "string",
            "width": "90" 
        }];
        break;

    case 'history_catalog':
        base_sql = GetBaseSql(curUserID);
		total_count = ArrayCount(XQuery('sql: ' + base_sql));

		take = request_body.GetOptProperty('take');
        skip = request_body.GetOptProperty('skip');
        
		sql_paginated = ApplyPaginationToRequest(base_sql, skip, take);
		sql_data = ArraySelectAll(XQuery('sql: ' + sql_paginated));

		result = {
		    data: sql_data,
			totalCount: total_count
		};
       
        break;

    case 'count_acceptance':
        acceptanceCount = ArrayOptFirstElem(XQuery("sql: " +
        " DECLARE " + 
        "    @statsAcceptance AS TABLE( " + 
        "        countAcceptances nvarchar(max), " + 
        "        countRewards nvarchar(max), " + 
        "        countIcons nvarchar(max) " + 
        "    ); " + 
        " " + 
        " DECLARE " + 
        "    @coll_id BIGINT = " +  curUserID + " , " + 
        "    @totalAcceptances INT, " + 
        "    @newAcceptances INT, " + 
        "    @totalRewards INT, " + 
        "    @newRewards INT, " + 
        "    @totalIcons INT, " + 
        "    @newIcons INT; " + 
        " " + 
        " SELECT " + 
        "    @totalAcceptances = COUNT(*), " + 
        "    @newAcceptances = COUNT(CASE WHEN new_entry = 1 THEN 1 END) " + 
        " FROM cc_acceptances " + 
        " WHERE recipient_id = @coll_id; " + 
        " " + 
        " SELECT " + 
        "    @totalRewards = COUNT(*), " + 
        "    @newRewards = COUNT(CASE " + 
        "        WHEN is_reward = 1 " + 
        "            AND status = 'assigned' AND person_id = @coll_id " + 
        "            AND qual_assig.data.value('(//custom_elems/custom_elem[name=\"new_entry\"]/value)[1]', 'bit') = 1 " + 
        "            THEN 1 " + 
        "    END) " + 
        " FROM qualification_assignments qual_assigs " + 
        " INNER JOIN qualification_assignment qual_assig ON qual_assig.id = qual_assigs.id " + 
        " WHERE is_reward = 1 AND status = 'assigned' AND person_id = @coll_id; " + 
        " " + 
        " SELECT " + 
        "    @totalIcons = COUNT(*), " + 
        "    @newIcons = COUNT(CASE WHEN new_entry = 1 THEN 1 END) " + 
        " FROM cc_assign_icons " + 
        " WHERE collaborator_id = @coll_id; " + 
        " " + 
        " INSERT INTO @statsAcceptance (countAcceptances, countRewards, countIcons) " + 
        " SELECT " + 
        "    CASE " + 
        "        WHEN @newAcceptances = 0 THEN CAST(@totalAcceptances AS nvarchar(max)) " + 
        "        ELSE '+' + CAST(@newAcceptances AS nvarchar(max)) " + 
        "    END, " + 
        "    CASE " + 
        "        WHEN @newRewards = 0 THEN CAST(@totalRewards AS nvarchar(max)) " + 
        "        ELSE '+' + CAST(@newRewards AS nvarchar(max)) " + 
        "    END, " + 
        "    CASE " + 
        "        WHEN @newIcons = 0 THEN CAST(@totalIcons AS nvarchar(max)) " + 
        "        ELSE '+' + CAST(@newIcons AS nvarchar(max)) " + 
        "    END; " + 
        " " + 
        " SELECT * FROM @statsAcceptance; "))

        if (acceptanceCount == undefined) {
            result.success = false;
        } else {
            result = acceptanceCount;
        }

        break;

        case 'get_acceptance':
        pageNumber = request_body.GetOptProperty('pageNumber', '');
        pageSize = request_body.GetOptProperty('pageSize', 10);
        if (pageNumber == '' || pageNumber < 1 || pageSize < 1) {
            result.success = false;
        } else {
            sql = "sql:
                DECLARE
                   @PageNumber INT = " + pageNumber + ",
                   @PageSize INT = " + pageSize + ";
                DECLARE @cur_user_id bigint = "+ curUserID +";
                WITH likes_data as (
                    select 
                        collaborator_id,
                        object_id
                 from cc_likes
                 GROUP BY collaborator_id, object_id
                ),
                main_data as(
                 SELECT
                 ROW_NUMBER() OVER (ORDER BY ts.date) AS RowNum,
                 CASE
                         WHEN ld.collaborator_id is null THEN 0
                         ELSE 1
                 END
                 AS you_liked,
                 (select COUNT(*) from likes_data where object_id = accs.id) AS like_count,
                 accs.id, 
                 accs.name,
                 ISNULL(accs.new_entry, '0') 'new_entry',
                 ISNULL(FORMAT(accs.create_date, 'dd.MM.yyyy'), 'Дата отсутствует') 'create_date',
                 cls.fullname,
                 acc.data.value('(//description)[1]', 'nvarchar(max)') 'description',
                 ts.date as tsDate,
                 pic_url = CASE
                    WHEN ISNULL(accs.resource_id, '') = ''
                        THEN ''
                        ELSE '/download_file.html?file_id=' + CAST(accs.resource_id AS NVARCHAR)
                 END
                 FROM cc_acceptances accs
                 JOIN transactions ts on ts.id = accs.in_transaction_id
                 INNER JOIN collaborators cls ON cls.id = accs.sender_id
                 INNER JOIN cc_acceptance acc ON acc.id = accs.id
                 LEFT JOIN likes_data ld on ld.collaborator_id = accs.recipient_id and ld.object_id = accs.id
                 WHERE accs.recipient_id = @cur_user_id          
                )SELECT
                        RowNum,
                        you_liked,
                        like_count,
                        id,
                        name,
                        new_entry,
                        create_date,
                        fullname,
                        description,
                        tsDate,
                        pic_url
                    FROM main_data
 
                 ORDER BY tsDate DESC
                 OFFSET (@PageNumber - 1) * @PageSize ROWS
                 FETCH NEXT @PageSize ROWS ONLY;
            ";

            result = ArraySelectAll(XQuery(sql))

                for (elem in result) {
                    try {
                        if (elem.new_entry) {
                            acceptanceDoc = OpenDoc(UrlFromDocID(elem.id));
                            acceptanceDoc.TopElem.new_entry = false;
                            acceptanceDoc.Save();
                        }
                    } catch(err) {
                        alert(err)
                    }
                }

        }
        break;

    case 'get_trophy':
        pageNumber = request_body.GetOptProperty('pageNumber', '');
        pageSize = request_body.GetOptProperty('pageSize', 10);
        if (pageNumber == '' || pageNumber < 1 || pageSize < 1) {
            result.success = false;
        } else {
            assignTrophy = custom_game_tools.getAssignPersonTrophys(curUserID);
            result = ArrayRange(assignTrophy, (pageNumber-1) * pageSize, pageSize);
            for (elem in result) {
                try {
                    trophyDoc = OpenDoc(UrlFromDocID(elem.idAssignQual));
                    if (elem.new_entry) {
                        trophyDoc.TopElem.custom_elems.ObtainChildByKey('new_entry').value = false;
                        trophyDoc.Save();
                    }
                } catch(err) {
                    alert(err)
                }
            }
        }
        break;
    
    case 'get_icon':
        pageNumber = request_body.GetOptProperty('pageNumber', '');
        pageSize = request_body.GetOptProperty('pageSize', 10);
        if (pageNumber == '' || pageNumber < 1 || pageSize < 1) {
            result.success = false;
        } else {
            assignIcon = custom_game_tools.getAssignPersonIcons(curUserID);
            result = ArrayRange(assignIcon, (pageNumber-1) * pageSize, pageSize);
            for (elem in result) {
                try {
                    iconDoc = OpenDoc(UrlFromDocID(elem.idAssignIcon));
                    if (elem.new_entry) {
                        iconDoc.TopElem.new_entry = false;
                        iconDoc.Save();
                    }
                } catch(err) {
                    alert(err)
                }
            }
        }
        break;

    case 'get_collegues_and_subordinates':
        var game_subordinate_ids_str = "0";

        var persons = ArraySelectAll(XQuery("sql: " +
            " DECLARE " +
            " @cur_user_id BIGINT = " + curUserID + "; " +
            "  " +
            " SELECT * FROM ( " +
            " 	SELECT collegues.id FROM collaborators cls " +
            " 	INNER JOIN collaborators collegues ON collegues.position_parent_id = cls.position_parent_id " +
            " 	WHERE cls.id = @cur_user_id " +
            " 	AND ISNULL(collegues.is_dismiss, 0) = 0 " +
            " 	UNION ALL " +
            " 	SELECT id FROM get_sub_person_ids_by_func_manager_id(@cur_user_id)) AS tmp " +
            " WHERE id != @cur_user_id "
        ));

        game_subordinate_ids_str += (';' + ArrayMerge(persons, 'This.id', ';'));

        result = {
            user_ids_str: game_subordinate_ids_str
        }

        break;

    case 'get_acceptance_trophys_icons':

        result = {
            oAccount: custom_game_tools.getAcceptanceAccountOut(OptInt(curUserID, 0)),
            boss: OptInt(curUserID, 0),
            icons: [],
            trophys: [],
            acceptance: []
        }


        result.icons = custom_game_tools.getAllIconsByAccess(curUserID);
        result.trophys = custom_game_tools.getAllTrophysByAccess(curUserID);
        result.acceptance = custom_game_tools.getAllAcceptancesByAccess(curUserID);

        break;

    case 'init_acceptance_list': 
        Request.Session.SetProperty('acceptanceMonth', custom_game_tools.getAcceptanceMonth(curUserID));
    break;

    case 'give_acceptance':
        var recipients = request_body.GetOptProperty('recipients', []);
        var is_personal = request_body.GetOptProperty('is_personal', '');
        var amount = OptInt(request_body.GetOptProperty('amount', ''));
        var resource_id = OptInt(request_body.GetOptProperty('resource_id', ''));
        var description = String(request_body.GetOptProperty('description', ''));

        result = {
            success: true,
            description: []
        }

        if (Request.Session.GetOptProperty('acceptanceMonth') == undefined) {
            Request.Session.SetProperty('acceptanceMonth', custom_game_tools.getAcceptanceMonth(curUserID));
        }

        acceptanceListPerMonth = Request.Session.GetOptProperty('acceptanceMonth');

        for (recipient in recipients) {
            if (ArrayOptFind(acceptanceListPerMonth, 'This.recevier_id == ' + recipient.id + ' && This.amount > 0') == undefined || !amount) {
                try {
                    docAcceptance = custom_game_tools.giveAcceptanceToUser(recipient.id, curUserID, amount, resource_id, description, is_personal);
                    acceptanceListPerMonth.push({
                        recevier_id: docAcceptance.TopElem.recipient_id,
                        amount: amount
                    });
                }
                catch (err) {
                    result.success = false;
                    result.description.push(recipient.fullname + ": " + err.message);
                }
            } else {
                result.success = false;
                result.description.push(recipient.fullname + ": Пользователю уже было отправлено признание за последние 30 дней.")
            }
        }

        if (recipients.length != result.description) {
            Request.Session.SetProperty('acceptanceMonth', acceptanceListPerMonth);
        }

        break;

    case 'give_trophy':
        var recipients = request_body.GetOptProperty('recipients', []);
        var qualificationId = OptInt(request_body.GetOptProperty('qualificationId', ''));

        result = {
            success: true,
            description: []
        }

        for (recipient in recipients) {
            try {
                custom_game_tools.giveTrophyToUser(recipient.id, qualificationId, curUserID);
            } catch (ex) {
                result.success = false;
                result.description.push(recipient.fullname + ": " + ex.message);
            }
        }

        break;

    case 'give_icon':
        var recipients = request_body.GetOptProperty('recipients', []);
        var iconId = OptInt(request_body.GetOptProperty('iconId', ''));

        result = {
            success: true,
            description: []
        }

        for (recipient in recipients) {
            try {
                custom_game_tools.giveIconToUser(recipient.id, iconId, curUserID);
            } catch (ex) {
                result.success = false
                result.description.push(recipient.fullname + ": " + ex.message);
            }
        }

        break;
    case 'current_balance':
        var acceptance_out_balance = '-';
        var acceptance_in_balance = '-';
        try {
            acceptance_out_balance = custom_game_tools.getAcceptanceAccountOut(curUserID).balance;
        } catch(err) {}
        
        try {
            acceptance_in_balance = custom_game_tools.getAcceptanceAccountIn(curUserID).balance;
        } catch(err) {}

        result = {
            acceptance_out_balance: String(acceptance_out_balance),
            acceptance_in_balance: String(acceptance_in_balance)
        }
        break;
    case 'cur_user_info':
        result = custom_game_tools.getCollaboratorInfo(curUserID);
        break;
    case 'get_coll_list_for_choose':
		try{
			var sqlGetCollaborators = "sql:
					DECLARE @userID bigint = "+ curUserID +";
					select id, login from collaborators
					where login LIKE '[A-Za-zА-Яа-я][A-Za-zА-Яа-я][A-Za-zА-Яа-я][0-9][0-9][0-9][0-9]'
					AND is_dismiss = 0 AND id <> @userID
				";

			var getCollaborators = ArraySelectAll(XQuery(sqlGetCollaborators));
			if(ArrayOptFirstElem(getCollaborators) != undefined){
				result.collList = ArrayMerge(getCollaborators, "This.id", ";")
			}

		} catch(err){
			result.success = false;
		}
        break;
    case 'set_like_for_acceptance':
		try{
            var data = {
                code: 'cc_acceptance',
                id: request_body.GetOptProperty('id', ''),
                name: request_body.GetOptProperty('name', ''),
                lastStatus: request_body.GetOptProperty('status', ''),
                userID: curUserID,
            }

            request = custom_game_tools.setLike(data);
            if(request.result == 'success'){
                result.success = true;
                result.data = request;
            }else{
                result.success = false;
                result.data = request;
            }
            


		} catch(err){
			result.success = false;
		}
        break;
        
}

Response.Write(tools.object_to_text(result, 'json', 5));

%>
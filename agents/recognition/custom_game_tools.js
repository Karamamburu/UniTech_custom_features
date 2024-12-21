function isNull(value) {
    if (value == null || value == undefined) {
        return true;
    }
    return false;
}

function isNullOrEmpty(value) {
    if (value == null || value == undefined || value == '') {
        return true;
    }
    return false;
}
/**
 * @description Метод получения информации по пользователе по ID
 * @function getCollaboratorInfo
 * @param {bigint} collaborator_id 
 * @returns {object}
 */
function getCollaboratorInfo(collaborator_id) {
    return ArrayOptFirstElem(XQuery("sql: SELECT * FROM collaborators WHERE id = " + collaborator_id), {});
}

/**
 * @description Метод получения информации о квалификации
 * @function getQualificationInfo
 * @param {bigint} qualification_id 
 * @returns {object}
 */
function getQualificationInfo(qualification_id) {
    return ArrayOptFirstElem(XQuery("sql: SELECT * FROM qualifications WHERE id = " + qualification_id), {});
}

/** 
 *  @typedef {object} trans_ids
 *  @property {bigint} trans_ids.coming - ID транзакции прихода.
 *  @property {bigint} trans_ids.expense - ID транзакции расхода.
 */

/**
 * @function topUpAccount
 * @memberof UniRest
 * @description Обработка транзакции пополнения/перевода на счет.
 * @param {bigint} recipientAccountId - ID аккаунта копилки получателя.
 * @param {bigint} amount - сумма перевода.
 * @param {bigint} senderAccountId - ID аккаунта дарилки отправителя. (необязательный)
 * @returns {trans_ids} trans_ids - ID транзакций.
 */
function topUpAccount(recipientAccountId, amount, senderAccountId, transactionCode) {
    account_rec_doc = tools.open_doc(recipientAccountId);
    if (isNull(account_rec_doc)) {
        throw 'Document recipint account not found, recipientAccountId = ' + recipientAccountId;
    }

    if (transactionCode) {
        exist_transaction = ArrayOptFirstElem(XQuery("sql: SELECT id FROM transactions WHERE code = '" + transactionCode + "' AND account_id = " + recipientAccountId)) != undefined;
        if (exist_transaction) {
            throw 'Transaction exist by code ' + transactionCode + ' and account_id ' + recipientAccountId;
        }
    }

    account_sen_doc = undefined;
    trans_sen_doc = undefined;
    trans_rec_doc = tools.new_doc_by_name("transaction", false);
    trans_rec_doc.BindToDb();
    
    // Перевод с аккаунта на аккаунт
    if (senderAccountId) {
        account_sen_doc = tools.open_doc(senderAccountId);
        if (isNull(account_sen_doc)) {
            throw 'Document sender account not found, senderAccountId = ' + senderAccountId;
        }

        if (OptInt(account_sen_doc.TopElem.balance, -1) < amount) {
            throw 'The sender, AccountID = ' + senderAccountId +' does not have enough funds';
        } 
        account_sen_doc.TopElem.balance -= OptInt(amount);
        
        trans_sen_doc = tools.new_doc_by_name("transaction", false);
        trans_sen_doc.TopElem.account_id = senderAccountId;
        trans_sen_doc.TopElem.person_id = account_sen_doc.TopElem.object_id
        trans_sen_doc.TopElem.direction = 2;
        trans_sen_doc.TopElem.amount = amount;
        if (transactionCode) {
            trans_sen_doc.TopElem.code = transactionCode;
        }

        tools.common_filling( 'collaborator', trans_sen_doc.TopElem,  account_sen_doc.TopElem.object_id);
        trans_sen_doc.TopElem.org_id = trans_sen_doc.TopElem.person_org_id;
        trans_sen_doc.BindToDb();
    }

    // Заполнение полей транзакции
    account_rec_doc.TopElem.balance += OptInt(amount);
    trans_rec_doc.TopElem.account_id = recipientAccountId;
    trans_rec_doc.TopElem.person_id = account_rec_doc.TopElem.object_id
    trans_rec_doc.TopElem.direction = 1;
    trans_rec_doc.TopElem.amount = amount;
    if (transactionCode) {
        trans_rec_doc.TopElem.code = transactionCode;
    }

    tools.common_filling( 'collaborator', trans_rec_doc.TopElem,  account_rec_doc.TopElem.object_id);
    trans_rec_doc.TopElem.org_id = trans_rec_doc.TopElem.person_org_id;

    account_rec_doc.Save();
    trans_rec_doc.Save();
    if (!isNull(account_sen_doc) && !isNull(trans_sen_doc)) {
        account_sen_doc.Save();
        trans_sen_doc.Save();
    }
    
    trans_ids = {
        coming: trans_rec_doc.DocID,
        expense: !isNull(trans_sen_doc) ? trans_sen_doc.DocID : 0
    }

    return trans_ids;
}

/**
 * @function topUpAcceptanceAccountOut
 * @memberof UniRest
 * @description Пополнение баланса счета.
 * @param {bigint} recipientId - ID пользователя получателя.
 * @param {bigint} amount - сумма перевода.
 * @returns {trans_ids} ID транзакций.
 */
function topUpAcceptanceAccountOut(recipientId, amount, transactionCode) {
    rec_account_id = ArrayOptFirstElem(XQuery("sql: SELECT id FROM accounts WHERE object_type = 'collaborator' AND object_id = " + recipientId + " AND code = 'acceptance_account_out' "), {id:0}).id;
    if (rec_account_id == 0) {
        throw 'Account not found, recipientId = ' + recipientId;
    }
    return topUpAccount(rec_account_id, amount, undefined, transactionCode);
}

/**
 * @function topUpAcceptanceAccountIn
 * @memberof UniRest
 * @description Перевод средст с счета на счет.
 * @param {bigint} recipientId - ID пользователя получателя.
 * @param {bigint} amount - сумма перевода.
 * @param {bigint} senderId - ID пользователя отправителя. (необязательное)
 * @returns {trans_ids} ID транзакций.
 */
function topUpAcceptanceAccountIn(recipientId, amount, senderId, transactionCode) {
    rec_account_id = ArrayOptFirstElem(XQuery("sql: SELECT id FROM accounts WHERE object_type = 'collaborator' AND object_id = " + recipientId + " AND code = 'acceptance_account_in' "), {id:0}).id;
    if (rec_account_id == 0) {
        throw 'Account not found, recipientId = ' + recipientId;
    }

    sen_account_id = undefined;
    
    if (senderId) {
        sen_account_id = ArrayOptFirstElem(XQuery("sql: SELECT id FROM accounts WHERE object_type = 'collaborator' AND object_id = " + senderId + " AND code =  'acceptance_account_out' "), {id:0}).id;
        
        if (sen_account_id == 0) {
            throw 'Account not found, sen_account_id = ' + recipientId;
        }
    }

    return topUpAccount(rec_account_id, amount, sen_account_id, transactionCode);
}


/**
 * @function notificationAccountReplenishment
 * @memberof UniRest
 * @description Уведомление о пополнении счета.
 * @param {bigint} col_id - ID пользователя.
 * @param {bigint} amount - сумма перевода.
 * @param {string} sendName - ФИО пользователя отправителя.
 */
function notificationAccountReplenishment(col_id, amount, sendName, acceptance_id) {
    collTe = tools.open_doc(col_id).TopElem;
    if (collTe.position_name == "Area Coach" || collTe.position_name == "Region Coach" || collTe.position_name == "Market Coach" || 
        collTe.position_name == "RSC" || collTe.position_name == "RSC Contractor" || collTe.position_name == "Key Operator" || 
        collTe.position_name == "Owner") {
        tools.create_notification("accept_acceptance", col_id);
    }
    _notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = acceptance_id;
	_notification_doc.TopElem.object_type = 'acceptance';
	_notification_doc.TopElem.collaborator_id = col_id;
	_notification_doc.TopElem.description = 'Тебе пришло признание от ' + sendName;
	_notification_doc.TopElem.is_info = false;
    _notification_doc.TopElem.link = '_wt/gamification';
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

/**
 * @function notificationAssignementQualification
 * @memberof UniRest
 * @description Уведомление о назначении квалификации и пополнении счета.
 * @param {bigint} col_id - ID пользователя.
 * @param {string} sendName - ФИО пользователя отправителя.
 * @param {string} qualificationName - наименование квалификации.
 */
function notificationAssignementQualification(col_id, sendName, qualificationName, assign_qualification_id) {
    _notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = assign_qualification_id;
	_notification_doc.TopElem.object_type = 'assign_qualification';
	_notification_doc.TopElem.collaborator_id = col_id;
	_notification_doc.TopElem.description = sendName + " выдал вам награду '"+ qualificationName +"' ";
	_notification_doc.TopElem.is_info = false;
    _notification_doc.TopElem.link = '_wt/gamification';
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

/**
 * @function notificationAssignementIcon
 * @memberof UniRest
 * @description Уведомление о присвоении значка.
 * @param {bigint} col_id - ID пользователя.
 * @param {bigint} icon_id - ID уведомления.
 * @param {string} icon_name - наименование квалификации.
 */
function notificationAssignementIcon(col_id, icon_id, icon_name, sendName, assign_icon_id) {
    _notification_doc = tools.new_doc_by_name('cc_notification', false);
	_notification_doc.TopElem.object_id = assign_icon_id;
	_notification_doc.TopElem.object_type = 'assign_icon';
	_notification_doc.TopElem.collaborator_id = col_id;
	_notification_doc.TopElem.description = " Вы получили значок '"+ icon_name +"' от " + sendName;
	_notification_doc.TopElem.is_info = false;
    _notification_doc.TopElem.link = '_wt/gamification';
	_notification_doc.BindToDb();
	_notification_doc.Save();
}

/**
 * @function giveAcceptanceToUser
 * @memberof UniRest
 * @description Отправка признания сотруднику.
 * @param {bigint} recipient_id - ID сотрудника-получателя.
 * @param {bigint} sender_id - ID сотрудника-отправителя.
 * @param {bool} is_personal - является личным.
 * @param {int} amount - количество.
 * @param {bigint} resource_id - ID ресурса базы.
 * @param {string} description - текст описания.
 * @returns {Object} result
 * @returns {boolean} result.success - статус операции.
 * @returns {string[]} result.description список исключений.
 */
function giveAcceptanceToUser(recipient_id, sender_id, amount, resource_id, description, is_personal) {
    if (amount != 0) {
        var balance = ArrayOptFirstElem(XQuery("sql: SELECT balance FROM accounts WHERE object_type = 'collaborator' AND object_id = " + sender_id + " AND code =  'acceptance_account_out' "), {balance: 0}).balance;
        if (amount > balance) {
            throw 'Недостаточно признаний';
        }
    
        create_date = ArrayOptFirstElem(XQuery("sql:SELECT cas.create_date FROM cc_acceptances cas " + 
            "JOIN transactions ts ON ts.id = cas.out_transaction_id AND ts.amount != 0 " +
            "WHERE cas.recipient_id = " + recipient_id + " AND cas.sender_id = " + sender_id +  
            "ORDER BY cas.create_date DESC"), {create_date: Date('01.01.1970 00:00:00')}).create_date;
        if ((DateDiff(Date(), Date(create_date))/(60*60*24)) <= 30) {
            throw 'Пользователю уже было отправлено признание за последние 30 дней.';
        }
    }

    if (OptInt(recipient_id) == OptInt(sender_id)) {
        throw 'Признание нельзя отправить самому себе';
    }

    var collaborator_info = getCollaboratorInfo(sender_id);
    var trans_ids = topUpAcceptanceAccountIn(recipient_id, amount, sender_id);
    
    _acceptance_doc = tools.new_doc_by_name('cc_acceptance', false);
    _acceptance_doc.TopElem.name = 'Признание - ' + collaborator_info.GetOptProperty('fullname', '') + ' - ' + Date();
    _acceptance_doc.TopElem.recipient_id = recipient_id;
    _acceptance_doc.TopElem.sender_id = sender_id;
    _acceptance_doc.TopElem.in_transaction_id = trans_ids.coming; 
    _acceptance_doc.TopElem.out_transaction_id = trans_ids.expense;
    _acceptance_doc.TopElem.resource_id = resource_id;
    _acceptance_doc.TopElem.description = description;
    _acceptance_doc.TopElem.is_personal = is_personal;
    _acceptance_doc.TopElem.create_date = Date();
    _acceptance_doc.TopElem.new_entry = true;
    _acceptance_doc.BindToDb();
    _acceptance_doc.Save();

    notificationAccountReplenishment(recipient_id, amount, collaborator_info.GetOptProperty('fullname', ''), _acceptance_doc.DocID);
    
    return _acceptance_doc;
}

/**
 * @function giveIconToUser
 * @memberof UniRest
 * @description Назначение значка сотруднику.
 * @param {bigint} recipientId - ID получателя.
 * @param {bigint} iconId - ID значка.
 */
function giveIconToUser(recipientId, iconId, senderId) {
    query = "sql: " +
    " SELECT id" +
    " FROM cc_assign_icons " +
    " WHERE collaborator_id = " + OptInt(recipientId, 0) + " AND icon_id = " + iconId;

    if (ArrayOptFirstElem(XQuery(query)) != undefined) {
        throw "У пользователя уже есть такой значок. ";
    }

    assign_icon_doc = tools.new_doc_by_name("cc_assign_icon", false);
    assign_icon_doc.BindToDb();

    assign_icon_doc.TopElem.collaborator_id = recipientId;
    assign_icon_doc.TopElem.icon_id = iconId;
    assign_icon_doc.TopElem.assign_date = Date();
    assign_icon_doc.TopElem.new_entry = true;
    if (!isNullOrEmpty(senderId)) {
        assign_icon_doc.TopElem.sender_id = senderId;
    }

    icon_info = tools.open_doc(iconId);
    if (!isNull(icon_info)) {
        sender_fullname = ArrayOptFirstElem(XQuery("sql: SELECT * FROM collaborators WHERE id = " + senderId), {fullname: ''}).fullname;
        notificationAssignementIcon(recipientId, iconId, icon_info.TopElem.name, sender_fullname, assign_icon_doc.DocID);
    }

    assign_icon_doc.Save();
}

/**
* @function giveTrophyToUser
* @memberof UniRest
* @description Назначение награды сотруднику.
* @param {bigint} recipientId - ID получателя.
* @param {bigint} qualificationId - ID квалификации.
* @param {bigint} senderId - ID отправителя.
*/
function giveTrophyToUser(recipientId, qualificationId, senderId) {
    senderData = ArrayOptFirstElem(XQuery("sql: SELECT fullname name, position_name FROM collaborators WHERE id = " + senderId));
    if (isNull(senderData)) {
        throw 'Выбранный пользователь не найден.';
    }

    amount_award = ArrayOptFirstElem(XQuery("sql: SELECT cost FROM cc_acceptance_trophy_costs WHERE position_name = '" + senderData.position_name +"'"), {cost:0}).cost
    if (amount_award == 0) {
        var qualification_info = getQualificationInfo(qualificationId);
        throw "Не указано количество признаний за присвоение награды по должности отправителя. Наименование должности отправителя: '" + senderData.position_name +"', наименование квалификации: " + qualification_info.GetOptProperty('name', '');
    }

    if (ArrayOptFirstElem(XQuery("sql: SELECT id FROM qualification_assignments WHERE person_id = "+ recipientId +" AND qualification_id = "+ qualificationId)) != undefined) {
        throw "Награда была получена ранее";
    }

    docAssignQual = tools.assign_qualification_to_person(recipientId, null, qualificationId,  DateNewTime(Date()), null, [], [], false, false, false, false, true)
    // Запись является новой
    docAssignQual.TopElem.custom_elems.ObtainChildByKey('new_entry').value = true;
    trans_docId = topUpAcceptanceAccountIn(recipientId, amount_award);
    if (docAssignQual != undefined) {
        if (trans_docId.coming != undefined) {
            docAssignQual.TopElem.custom_elems.ObtainChildByKey('in_transaction_id').value = trans_docId.coming;
        }
        if (trans_docId.expense != undefined && trans_docId.expense != 0) {
            docAssignQual.TopElem.custom_elems.ObtainChildByKey('out_transaction_id').value = trans_docId.expense;
        }
        docAssignQual.TopElem.is_reward = true;
        docAssignQual.TopElem.sender_id = senderId;
        docAssignQual.Save();
    }
    senderData.name = senderData.name ? senderData.name: 'Не определено';
    notificationAssignementQualification(recipientId, senderData.name, ArrayOptFirstElem(XQuery("sql: SELECT name FROM qualifications WHERE id = " + qualificationId),{name:'Не задано'}).name, docAssignQual.DocID);
}

/**
* @function getAllIcons
* @memberof UniRest
* @description Список всех значков.
* @returns {Object[]} Список значков.
*/
function getAllIcons() {
    query = "sql: " +
    "   SELECT " +
    "       icons.*, " +
    "   pic_url = CASE " +
    "       WHEN ISNULL(icons.resource_id, '') = '' " +
    "           THEN '' " +
    "           ELSE '/download_file.html?file_id=' + CAST(icons.resource_id AS NVARCHAR) "+
    "   END " + 
    "   FROM cc_icons icons "
    return ArraySelectAll(XQuery(query));
}

/**
* @function getAllIconsByAccess
* @memberof UniRest
* @description Список всех значков.
* @returns {Object[]} Список значков.
* @param {bigint} user_id - ID сотрудника
*/
function getAllIconsByAccess(user_id) {
    var user_doc = tools.open_doc(user_id);
    if (isNull(user_doc)) {
        throw 'Collaborator not found by id ' + user_id;
    }

    var user_doc_te = user_doc.TopElem;

    var icons = ArraySelectAll(XQuery("sql: " + 
        " SELECT  " +
        " 	ics.*,  " +
        " 	IIF(ics.resource_id IS NULL, '', '/download_file.html?file_id=' + CAST(ics.resource_id AS NVARCHAR)) 'pic_url'  " +
        " FROM cc_icons ics "
    ));

    icons = ArraySelect(icons, 'tools_web.check_access(This.id, user_id, user_doc_te) == true');

    return icons;
}

/**
* @function getAllTrophys
* @memberof UniRest
* @description Список всех наград.
* @returns {Object[]} Список наград.
*/
function getAllTrophys() {
    query = "sql: " +
    "   SELECT " +
    "       quals.*, " +
    "       CAST(0 AS BIT) 'new_entry', " +
    "   pic_url = CASE " + 
    "       WHEN ISNULL(qual.data.value('(//resource_id)[1]', 'bigint'), '') = '' " +
    "           THEN '' " +
    "           ELSE '/download_file.html?file_id=' + CAST(qual.data.value('(//resource_id)[1]', 'bigint') AS NVARCHAR) " +
    "       END " +  
    "   FROM qualifications quals " +
    "   INNER JOIN qualification qual ON quals.id = qual.id " +
    "   WHERE quals.is_reward = 1 "
    return ArraySelectAll(XQuery(query));
}

/**
* @function getAllTrophysByAccess
* @memberof UniRest
* @description Список всех наград.
* @returns {Object[]} Список наград.
* @param {bigint} user_id - ID сотрудника
*/
function getAllTrophysByAccess(user_id) {
    var user_doc = tools.open_doc(user_id);
    if (isNull(user_doc)) {
        throw 'Collaborator not found by id ' + user_id;
    }

    var user_doc_te = user_doc.TopElem;

    var trophys = ArraySelectAll(XQuery("sql: " + 
        "sql: " +
        "   SELECT " +
        "       quals.*, " +
        "       CAST(0 AS BIT) 'new_entry', " +
        "   pic_url = CASE " + 
        "       WHEN ISNULL(qual.data.value('(//resource_id)[1]', 'bigint'), '') = '' " +
        "           THEN '' " +
        "           ELSE '/download_file.html?file_id=' + CAST(qual.data.value('(//resource_id)[1]', 'bigint') AS NVARCHAR) " +
        "       END " +  
        "   FROM qualifications quals " +
        "   INNER JOIN qualification qual ON quals.id = qual.id " +
        "   WHERE quals.is_reward = 1 "
    ));

    trophys = ArraySelect(trophys, 'tools_web.check_access(This.id, user_id, user_doc_te) == true');

    return trophys;
}

/**
* @function getAllAcceptances
* @memberof UniRest
* @description Список всех значков.
* @returns {Object[]} Список значков.
*/
function getAllAcceptances() {
    return ArraySelectAll(XQuery("sql: " +
        "   SELECT " +
        "       icons.*, " +
        "   pic_url = CASE " +
        "       WHEN ISNULL(icons.resource_id, '') = '' " +
        "           THEN '' " +
        "           ELSE '/download_file.html?file_id=' + CAST(icons.resource_id AS NVARCHAR) "+
        "   END " + 
        "   FROM cc_icons icons "
    ));
}

/**
* @function getAllAcceptancesByAccess
* @memberof UniRest
* @description Список всех значков.
* @returns {Object[]} Список значков.
* @param {bigint} user_id - ID сотрудника
*/
function getAllAcceptancesByAccess(user_id) {
    var user_doc = tools.open_doc(user_id);
    if (isNull(user_doc)) {
        throw 'Collaborator not found by id ' + user_id;
    }

    var user_doc_te = user_doc.TopElem;

    var acceptances = ArraySelectAll(XQuery("sql:" + 
        " SELECT " +
        " rs.id as id, " +
        " rs.name as name, " +
        " ('/download_file.html?file_id=' + CAST(rs.id AS NVARCHAR)) as 'pic_url' " +
        " FROM resources rs " +
        " WHERE rs.code = 'acceptance_img' "
    ));
    
    return ArraySelect(acceptances, 'tools_web.check_access(This.id, user_id, user_doc_te) == true');
}

/**
* @function getAssignPersonIcons
* @memberof UniRest
* @description Список присвоенных значков пользователю.
* @param {bigint} coll_id - ID сотрудника.
* @param {object} rangeDate - диапазон дат. (необязательное)
* @param {string} rangeDate.startDate - начальная дата. (необязательное)
* @param {string} rangeDate.finalDate - конечная дата. (необязательное)
* @returns {Object[]} Список значков.
*/
function getAssignPersonIcons(coll_id, rangeDate) {
    condition = "";
    if (!isNull(rangeDate) && rangeDate.GetOptProperty("startDate") != undefined && rangeDate.GetOptProperty("finalDate") != undefined) {
        condition  = " AND assign_icons.assign_date BETWEEN '" + rangeDate.startDate + "' AND '" + rangeDate.finalDate + "' "
    }

    query = "sql: " +
    "   SELECT " +
    "       icons.*, " +
    "       assign_icons.id 'idAssignIcon', " +
    "       ISNULL(assign_icons.new_entry, 0) 'new_entry', " + 
    " 	    icon.data.value('(//description)[1]', 'nvarchar(max)') 'description', " +
    "   pic_url = CASE " +
    "       WHEN ISNULL(icons.resource_id, '') = '' " +
    "           THEN '' " +
    "           ELSE '/download_file.html?file_id=' + CAST(icons.resource_id AS NVARCHAR) "+
    "   END " + 
    "   FROM cc_assign_icons assign_icons " +
    "   INNER JOIN cc_icons icons ON icons.id = assign_icons.icon_id " +
    "   INNER JOIN cc_icon icon ON icon.id = icons.id " +
    "   WHERE assign_icons.collaborator_id = " + coll_id + condition +
    "   ORDER BY assign_icons.assign_date DESC "
    return ArraySelectAll(XQuery(query));
}

/**
* @function getAssignPersonTrophys
* @memberof UniRest
* @description Список присвоенных наград пользователю.
* @param {bigint} coll_id - ID сотрудника.
* @param {object} rangeDate - диапазон дат. (необязательное)
* @param {string} rangeDate.startDate - начальная дата. (необязательное)
* @param {string} rangeDate.finalDate - конечная дата. (необязательное)
* @returns {Object[]} Список наград.
*/
function getAssignPersonTrophys(coll_id, rangeDate) {
    condition = "";
    if (!isNull(rangeDate) && rangeDate.GetOptProperty("startDate") != undefined && rangeDate.GetOptProperty("finalDate") != undefined) {
        condition  = " AND assign_quals.assignment_date BETWEEN '" + rangeDate.startDate + "' AND '" + rangeDate.finalDate + "' "
    }

    query = "sql: " +
    "   SELECT " +
    "       quals.*, " +
    "       assign_quals.id 'idAssignQual', " +
    "       ISNULL(assign_qual.data.value('(//custom_elems/custom_elem[name=''new_entry'']/value)[1]', 'bit'), 0) 'new_entry', " +
    " 	    qual.data.value('(/qualification/comment)[1]', 'nvarchar(max)') 'comment', " +
    "       trans.amount 'amount_coming', " +
    "       pic_url = CASE " + 
    "       WHEN ISNULL(qual.data.value('(//resource_id)[1]', 'bigint'), '') = '' " +
    "           THEN '' " +
    "           ELSE '/download_file.html?file_id=' + CAST(qual.data.value('(//resource_id)[1]', 'bigint') AS NVARCHAR) " +
    "       END " +  
    "   FROM qualification_assignments assign_quals " +
    "   INNER JOIN qualification_assignment assign_qual ON assign_qual.id = assign_quals.id" +
    "   INNER JOIN qualifications quals ON assign_quals.qualification_id = quals.id " +
    "   LEFT JOIN transactions trans ON trans.id = ISNULL(assign_qual.data.value('(//custom_elems/custom_elem[name=''in_transaction_id'']/value)[1]', 'bigint'), 0) AND direction = 1 " +
    "   INNER JOIN qualification qual ON quals.id = qual.id " +
    "   WHERE assign_quals.is_reward = 1 AND assign_quals.status = 'assigned' AND assign_quals.person_id = " + coll_id + condition +
    "   ORDER BY assign_quals.assignment_date DESC"
    return ArraySelectAll(XQuery(query));
}

/**
* @function getAcceptanceAccountOut
* @memberof UniRest
* @description Получение аккаунта дарилки пользователя.
* @param {bigint} user_id - ID сотрудника.
* @returns {bigint} ID аккаунта.
*/
function getAcceptanceAccountOut(user_id) {
    var query = "sql: SELECT acc.* from accounts acc WHERE acc.code='acceptance_account_out' AND acc.object_id=" + user_id;
    var query_res = ArrayOptFirstElem(XQuery(query));
    if (isNull(query_res)){
        throw  'Acceptance out account not found';
    }
    return query_res;
}

/**
* @function getAcceptanceAccountIn
* @memberof UniRest
* @description Получение аккаунта копилки пользователя.
* @param {bigint} user_id - ID сотрудника.
* @returns {bigint} ID аккаунта.
*/
function getAcceptanceAccountIn(user_id) {
    var query = "sql: SELECT acc.* from accounts acc WHERE acc.code='acceptance_account_in' AND acc.object_id=" + user_id;
    var query_res = ArrayOptFirstElem(XQuery(query));
    if (isNull(query_res)){
        throw  'Acceptance in account not found';
    }
    return query_res;
}
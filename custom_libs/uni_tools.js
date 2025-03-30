/**
 * @function getRandomArrayElement
 * @description функция для получения псевдослучайного элемента массива
 * @param {array} array массив
 * @returns {any} псевдослучайный элемент массива
 */
function getRandomArrayElement (array) {

    return array[Random(0, ArrayCount(array) - 1)]
}

/**
 * @function getShuffledArray
 * @description функция для получения нового порядка элементов массива
 * @description используется тасование Фишера-Йетса
 * @param {array} array массив
 * @returns {array} новый порядок элементов массива
 */
function getShuffledArray(array) {

    shuffledArray = ParseJson(EncodeJson(array))

    for (i = ArrayCount(shuffledArray) - 1; i > 0; i--) {
        j = Random(0, i)
        temp = shuffledArray[j]
        shuffledArray[j] = shuffledArray[i]
        shuffledArray[i] = temp
    }

    return shuffledArray    
}

/**
 * @function isMemberOfGroup
 * @description функция для проверки принадлежности пользователя группе
 * @param {id} col_id id сотрудника
 * @param {id} group_id id группы
 * @returns {boolean} true / false
 */
function isMemberOfGroup(col_id, group_id) {
	
    query = "sql: 
               SELECT id FROM group_collaborators
               WHERE group_id = " + group_id + "
               AND collaborator_id = " + col_id + "
   "
   var groupCollaboratorsRows = ArraySelectAll(XQuery(query))
   if (ArrayCount(groupCollaboratorsRows)) {
       return true
   }

   return false
}

/**
 * @function isMemberOfRestaurant
 * @description функция для проверки принадлежности пользователя ресторану
 * @param {id} col_id id сотрудника
 * @param {id} group_id id ресторана
 * @returns {boolean} true / false
 */
function isMemberOfRestaurant(col_id, restaurant_id) {
    query = "sql: 
               SELECT id FROM collaborators
               WHERE id = " + col_id + "
               AND position_parent_id = " + restaurant_id

   var collaboratorsRows = ArraySelectAll(XQuery(query))

   if (ArrayCount(collaboratorsRows)) {
       return true
   }
   
   return false
}

/**
 * @function isBoss
 * @description функция для проверки, является ли пользователь руководителем
 * @param {id} col_id id сотрудника
 * @returns {boolean} true / false
 */
function isBoss(col_id) {
    query = "sql: 
               SELECT id FROM func_managers
               WHERE person_id = " + col_id

   var funcManagersRows = ArraySelectAll(XQuery(query))

   if (ArrayCount(funcManagersRows)) {
       return true
   }
   
   return false
}

/**
 * @function getBossId
 * @description функция для получения id руководителя переданного сотрудника
 * @param {id} col_id id сотрудника
 * @returns {number} id руководителя
 */
function getBossId(col_id) {
    query = "sql: 
               SELECT person_id AS boss_id FROM func_managers
               WHERE object_id = " + col_id

   var oBoss = ArraySelectAll(XQuery(query))
   
   return ArrayOptFirstElem(oBoss).boss_id
}

/**
 * @function getReporters
 * @description функция для получения подчинённых сотрудников по id руководителя
 * @param {id} boss_id id руководителя
 * @returns {array<object>} массив объектов подчинённых сотрудников со свойствами:
    * @prop {number} reporter_id id подчинённого
    * @prop {string} reporter_login логин подчинённого
    * @prop {string} reporter_fullname ФИО подчинённого
    * @prop {string} reporter_position_name должность подчинённого
    * @prop {number} reporter_position_parent_id id подразделения
    * @prop {string} reporter_position_parent_name наименование подразделения
 */
function getReporters(boss_id) {
    query = "sql: 
			SELECT
			    fm.object_id AS reporter_id,
			    c.login AS reporter_login,
			    c.fullname AS reporter_fullname,
			    c.position_name AS reporter_position_name,
			    c.position_parent_id AS reporter_position_parent_id,
			    c.position_parent_name AS reporter_position_parent_name
			FROM
			    func_managers fm
			    LEFT JOIN collaborators c ON fm.object_id = c.id
			WHERE
			    fm.person_id = " + boss_id

   var aReportersObjects = ArraySelectAll(XQuery(query))

   return aReportersObjects
}

/**
 * @function createBellNotification
 * @description функция для создания кастомных уведомлений в колокольчик
 * @param {id} col_id id сотрудника
 * @param {id} object_id id документа - плана обучения, карты целей и т.д.
 * @param {string} object_type тип документа
 * @param {string} text текст уведомления
 * @param {string} link ссылка, на которую ведёт уведомление
 */
function createBellNotification(col_id, object_id, object_type, text, link) {

    _notification_doc = tools.new_doc_by_name('cc_notification', false)
    _notification_doc.TopElem.object_id = OptInt(object_id)
    _notification_doc.TopElem.object_type = object_type
    _notification_doc.TopElem.collaborator_id = col_id
    _notification_doc.TopElem.description = text
    _notification_doc.TopElem.link = link
    _notification_doc.TopElem.is_info = false
    _notification_doc.TopElem.is_read = false
    _notification_doc.BindToDb()
    _notification_doc.Save()

}

/**
 * @function assignRewardsToColsByRestaurant
 * @description функция для присвоения сотрудникам ресторана награды
 * @param {id} reward_id - id награды
 * @param {id} restaurant_id - id ресторана
 * @param {string} sender_id - id отправителя
 * @param {string} text_comment - текстовый комментарий к награде
 */
function assignRewardsToColsByRestaurant(reward_id, restaurant_id, sender_id, text_comment) {
	var journalName = "assign_rewards_to_cols_by_restaurant"
	EnableLog(journalName, true)
	LogEvent(journalName, "Начинаем присвоение наград")
	var CustomGameTools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_game_tools.js"));

	var queryCollaborators = "sql:
								SELECT 
									id, 
									fullname, 
									position_id,
									position_name,
									position_parent_id,
									position_parent_name,
									org_id,
									org_name
								FROM collaborators
								WHERE position_parent_id = " + restaurant_id + " 
								AND is_dismiss = 0
	"

	var colsToAssignRewards = ArraySelectAll(XQuery(queryCollaborators))

	if (!ArrayCount(colsToAssignRewards)) {

		LogEvent(journalName, "В ресторане " + ArrayOptFirstElem(colsToAssignRewards).position_parent_name + " не найдено сотрудников")

	} else {
		
		LogEvent(journalName, "Сотрудников в ресторане " + ArrayOptFirstElem(colsToAssignRewards).position_parent_name + " - " + ArrayCount(colsToAssignRewards))

		for (col in colsToAssignRewards) {
			try {

				CustomGameTools.giveTrophyToUser(col.id, reward_id, sender_id, text_comment)

				LogEvent(journalName, "Награда для сотрудника " + col.fullname + " успешно присвоена")
			} catch (ex) {
				LogEvent(journalName, 'Ошибка: ', ex);
				}	
			}	
	}
	LogEvent(journalName, "Присвоение наград успешно завершено")
	EnableLog(journalName, false)
}
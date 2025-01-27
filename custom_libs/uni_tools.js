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

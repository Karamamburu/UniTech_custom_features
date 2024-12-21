function Log(message, ex) {
  if (ex == null || ex == undefined) {
    LogEvent(Param.log_file_name, message);
  } else {
    LogEvent(Param.log_file_name, message + " Exception: " + ex);
  }
}

EnableLog(Param.log_file_name, true);
Log("Начало работы агента");

GoalTools = OpenCodeLib(
  FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_goal_tools.js")
);
GetReadable = OpenCodeLib(
  FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/getReadable.js")
);

var colEvaluation = 7283857534769645145;
var colEvaluationRework = 7283857586736733555;
var bossAgreement = 7283857616031667479;
var colAcquaintance = 7378783877013073086;
var finished = 7283857648112835796;

function getNameFromId(id) {
  var query = "sql:
                  SELECT fullname FROM collaborators
                  WHERE id = " + id;
  var fullnameArray = ArraySelectAll(XQuery(query))

  return GetReadable.getReadableShortName(ArrayOptFirstElem(fullnameArray).fullname)
}

function getNamesArray(array) {
  namesArray = new Array
  for (elem in array) {
    namesArray.push(GetReadable.getReadableShortName(getNameFromId(OptInt(elem))))
  }
  
  return namesArray
}

var goalmapsInfoQuery = "sql: 
                                      SELECT 
					                              gm.id AS goalmap_id,
                                        gm.collaborator_id AS col_id,
                                        gm.manager_id AS boss_id,
                                        gm.state_id AS state_id,
					                              c.fullname AS col_fullname,
                                        fm.person_fullname AS boss_fullname
                                      FROM
                                        cc_goalmaps gm
                                      LEFT JOIN group_collaborators gc ON gc.collaborator_id = gm.collaborator_id 
                                      LEFT JOIN collaborators c ON c.id = gm.collaborator_id 
                                      LEFT JOIN func_managers fm ON c.id = fm.object_id 
                                      WHERE
                                        gc.group_id = " + Param.group_id +"
                                      AND
                                        gm.state_id IN (" + 
                                          colEvaluation + ", " + 
                                          colEvaluationRework + ", " + 
                                          bossAgreement + ", " + 
                                          colAcquaintance + 
                                          ")
                                      AND
                                        gm.period_id = " + Param.period_id + "
                                      AND
                                        c.position_name NOT IN ('Area Coach')
"

var goalmapsInfo = ArraySelectAll(XQuery(goalmapsInfoQuery));

if (!ArrayCount(goalmapsInfo)) {
  Log("Карт целей не найдено");
} else {
  Log("Найдено карт целей: " + ArrayCount(goalmapsInfo));

  counter = 0;
  var bossNotifications = {};

  for (goalmap in goalmapsInfo) {
    counter++;
    //Log("Обработка карты целей № " + counter + " с ID: " + goalmap.goalmap_id);

    try {
      if (
        !goalmap.boss_id ||
        !goalmap.state_id ||
        !goalmap.col_fullname ||
        !goalmap.boss_fullname
      ) {
        Log(
          "Пропущена обработка из-за отсутствия данных. Данные записи: " +
            tools.object_to_text(goalmap, "json")
        );
        continue;
      }

      if (!bossNotifications.HasProperty(goalmap.boss_id)) {
        bossNotifications[goalmap.boss_id] = {};
        bossNotifications[goalmap.boss_id].boss_fullname =
          "" + getNameFromId(goalmap.boss_id);
        bossNotifications[goalmap.boss_id].colEvaluationAndRework = new Array();
        bossNotifications[goalmap.boss_id].bossAgreement = new Array();
        bossNotifications[goalmap.boss_id].colAcquaintance = new Array();
      }
      //далее идут goalmap.col_id для того, чтобы отправить самим сотрудникам уведомления.
      //для наглядности можно вывести в лог goalmap.col_fullname
      if (
        goalmap.state_id == colEvaluation ||
        goalmap.state_id == colEvaluationRework
      ) {
        bossNotifications[goalmap.boss_id].colEvaluationAndRework.push(
          "" + goalmap.col_id
        );
      }

      if (goalmap.state_id == bossAgreement) {
        bossNotifications[goalmap.boss_id].bossAgreement.push(
          "" + goalmap.col_id
        );
      }

      if (goalmap.state_id == colAcquaintance) {
        bossNotifications[goalmap.boss_id].colAcquaintance.push(
          "" + goalmap.col_id
        );
      }
    } catch (ex) {
      Log(
        "Ошибка при обработке карты целей № " +
          counter +
          " с ID: " +
          goalmap.goalmap_id +
          " Exception: " +
          ex
      );
    }
  }

  try {
    for (boss_id in bossNotifications) {
      if (bossNotifications.HasProperty(boss_id)) {
        bossData = bossNotifications[boss_id];
        bossFullname = bossData.boss_fullname;

        if (ArrayCount(bossData.colEvaluationAndRework)) {
          namesArray = getNamesArray(bossData.colEvaluationAndRework);
          evaluationColsText = namesArray.join(",</br>");
          Log(
            GetReadable.getReadableShortName(bossFullname) +
              " получил уведомление о необходимости напомнить сотруднику об оценке результатов сотрудникам: " +
              evaluationColsText
          );
          tools.create_notification(
            "for_boss_employee_evaluation_type",
            boss_id,
            evaluationColsText
          );

          //здесь col - это id сотрудника для отправки ему письма
          for (col in bossData.colEvaluationAndRework) {
            Log(
              "Сотрудник " +
                getNameFromId(col) +
                " получил уведомление О НЕОБХОДИМОСТИ ЗАПОЛНИТЬ ОЦЕНКУ"
            );
            tools.create_notification("employee_evaluation_type", OptInt(col));
          }
        }

        if (ArrayCount(bossData.bossAgreement)) {
          namesArray = getNamesArray(bossData.bossAgreement);
          agreementColsText = namesArray.join(",</br>");
          Log(
            GetReadable.getReadableShortName(bossFullname) +
              " получил уведомление о необходимости оценить результаты сотрудникам: " +
              agreementColsText
          );

          tools.create_notification(
            "for_boss_approval_type",
            boss_id,
            agreementColsText
          );
        }

        if (ArrayCount(bossData.colAcquaintance)) {
          namesArray = getNamesArray(bossData.colAcquaintance);
          acquaintanceColsText = namesArray.join(",</br>");
          Log(
            GetReadable.getReadableShortName(bossFullname) +
              " получил уведомление о необходимости напомнить сотруднику ознакомиться с оценкой результатов сотрудникам: " +
              acquaintanceColsText
          );

          tools.create_notification(
            "for_boss_employee_acquaintance_type",
            boss_id,
            acquaintanceColsText
          );
          //здесь col - это id сотрудника для отправки ему письма
          for (col in bossData.colAcquaintance) {
            Log(
              "Сотрудник " +
                getNameFromId(col) +
                " получил уведомление О НЕОБХОДИМОСТИ ОЗНАКОМИТЬСЯ С ОЦЕНКОЙ РЕЗУЛЬТАТОВ РУКОВОДИТЕЛЕМ"
            );

            tools.create_notification(
              "employee_acquaintance_type",
              OptInt(col)
            );
          }
        }
      }
    }
  } catch (ex) {
    Log("Ошибка : " + ex);
  }
}

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);

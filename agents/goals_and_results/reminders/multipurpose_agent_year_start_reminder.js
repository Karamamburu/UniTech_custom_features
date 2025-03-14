function Log(message, ex) {
  if (ex == null || ex == undefined) {
    LogEvent(Param.log_file_name, message);
  } else {
    LogEvent(Param.log_file_name, message + " Exception: " + ex);
  }
}

EnableLog(Param.log_file_name, true);
Log("Начало работы агента");

GetReadable = OpenCodeLib(
  FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/getReadable.js")
);

var stateIdsMapping = {
  "7283857316660210018": "colSettingGoals",
  "7283857427410994955": "bossAgreementGoals",
  "7283857459099681927": "colSettingGoalsRework",
  "7283857504467095538": "colFinalApprovement",
  "7283857534769645145": "colEvaluation",
};

var colSettingGoals = 7283857316660210018
var bossAgreementGoals = 7283857427410994955
var colSettingGoalsRework = 7283857459099681927
var colFinalApprovement = 7283857504467095538
var colEvaluation = 7283857534769645145

function createCurrentColObject(goalmap) {
  oCurrentCol = {};
  oCurrentCol.fullname =
    "" + GetReadable.getReadableShortName(goalmap.col_fullname)
  oCurrentCol.goalmap_id = "" + goalmap.goalmap_id

  return oCurrentCol
}

function createLinkToCurrentColGoalmap(oCol) {
  linkToGoalmap = UrlAppendPath(
    global_settings.settings.portal_base_url,
    "/_wt/goal_setting_col?goalmap_id=" + oCol["goalmap_id"]
  );
  colTag = "<a style='margin-left: auto; margin-right: auto; font-size: 14px; font-weight: normal; text-align: center; border-bottom: 1px solid;' href='" + linkToGoalmap + "'>" + oCol["fullname"] + "</a>"

  return colTag
}

function fillColsArray(arrayName) {
  colsArray = new Array();
  for (oCol in oCollaborators[col][arrayName]) {
    colsArray.push(createLinkToCurrentColGoalmap(oCol))
  }

  return colsArray
}

function createColsBlock(colsArray) {
  colsBlock =
    "<div style='padding: 4px; margin-top: 4px;'>" +
    colsArray.join("</br>") +
    "</div>" +
    "<style>" +
    "@media (max-width: 600px) {" +
    "  p { font-size: 0.4em;}" +
    "}" +
    "</style>"

  return colsBlock
}

var listItemParagraphWithStyles = "<p style='font-weight: normal; font-size: 16px; margin: 15px 0 15px 0; '>"

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
                              colSettingGoals + ", " + 
                              bossAgreementGoals + ", " + 
                              colSettingGoalsRework + ", " + 
                              colFinalApprovement + ", " + 
                              colEvaluation + 
                              ")
                          AND
                            gm.period_id = " + Param.period_id + "
                          AND
                            c.position_name NOT IN ('Area Coach')
"

var goalmapsInfo = ArraySelectAll(XQuery(goalmapsInfoQuery))

if (!ArrayCount(goalmapsInfo)) {
  Log("Карт целей не найдено")
} else {
  Log("Найдено карт целей: " + ArrayCount(goalmapsInfo))
  Log(tools.object_to_text(goalmapsInfo, "json"))
  var oCollaborators = {}

  //в цикле создаём объекты сотрудников, карты целей которых вернул запрос
  for (goalmap in goalmapsInfo) {
    try {
      if (!goalmap.boss_id || !goalmap.state_id || !goalmap.col_fullname) {
        Log(
          "Пропущена обработка из-за отсутствия данных. Данные записи: " +
            tools.object_to_text(goalmap, "json")
        );
        continue;
      }

      if (!oCollaborators.HasProperty(goalmap.col_id)) {
        oCollaborators[goalmap.col_id] = {};
        oCollaborators[goalmap.col_id].goalmap_id = "" + goalmap.goalmap_id;
	      oCollaborators[goalmap.col_id].col_id = "" + goalmap.col_id;
        oCollaborators[goalmap.col_id].col_fullname = "" + GetReadable.getReadableShortName(goalmap.col_fullname);
        oCollaborators[goalmap.col_id].boss_id = "" + goalmap.boss_id;
        oCollaborators[goalmap.col_id].boss_fullname = "" + goalmap.boss_fullname;
        oCollaborators[goalmap.col_id].state_id = "" + goalmap.state_id;
        oCollaborators[goalmap.col_id].state_name = "" + stateIdsMapping[goalmap.state_id];
        oCollaborators[goalmap.col_id].colSettingAndRework = new Array();
        oCollaborators[goalmap.col_id].bossAgreement = new Array();
        oCollaborators[goalmap.col_id].colFinalApprovement = new Array();
      }
    } catch (ex) {
      Log(
        "Ошибка при обработке карты целей с ID: " +
          goalmap.goalmap_id +
          " Exception: " +
          ex
      );
    }
  }
  //в цикле рассаживаем сотрудников по подмассивам их руководителей в зависимости от статуса карты целей
  for (goalmap in goalmapsInfo) {
    if (
      goalmap.state_id == colSettingGoals ||
      goalmap.state_id == colSettingGoalsRework
    ) {
      try {
        oCurrentCol = createCurrentColObject(goalmap)
        oCollaborators[goalmap.boss_id].colSettingAndRework.push(oCurrentCol)
      } catch (error) {
        Log("Error COL SETTING AND REWORK: " + error);
      }
    }

    if (goalmap.state_id == bossAgreementGoals) {
      try {
        oCurrentCol = createCurrentColObject(goalmap)
        oCollaborators[goalmap.boss_id].bossAgreement.push(oCurrentCol)
      } catch (error) {
        Log("Error BOSS AGREEMENT: " + error)
      }
    }

    if (goalmap.state_id == colFinalApprovement) {
      try {
        oCurrentCol = createCurrentColObject(goalmap)
        oCollaborators[goalmap.boss_id].colFinalApprovement.push(oCurrentCol)
      } catch (error) {
        Log("Error FINAL APPROVEMENT: " + error)
      }
    }
  }
  Log(tools.object_to_text(oCollaborators, "json"))
  var selfGoalsSettingAndReworkBlock = ""
  var selfGoalsApprovementBlock = ""
  var colSettingAndReworkBlock = ""
  var bossAgreementBlock = ""
  var colApprovementBlock = ""


  //в цикле проходим по каждому сотруднику, собираем для него сообщение исходя из статуса его карты целей
  //и наполнения подмассивов подчинённых
  for (col in oCollaborators) {
    try {
      if (
        oCollaborators[col].state_id != StrInt(colSettingGoals) &&
        oCollaborators[col].state_id != StrInt(colSettingGoalsRework) &&
        oCollaborators[col].state_id != StrInt(colFinalApprovement) &&
        !ArrayCount(oCollaborators[col].colSettingAndRework) &&
        !ArrayCount(oCollaborators[col].bossAgreement) &&
        !ArrayCount(oCollaborators[col].colFinalApprovement)
      ) {
        Log(
          oCollaborators[col].col_fullname +
            " не получил уведомление, потому что красавчик"
        );
        continue;
      }

      selfGoalsSettingAndReworkBlock = ""
      selfGoalsApprovementBlock = ""
      colSettingAndReworkBlock = ""
      bossAgreementBlock = ""
      colApprovementBlock = ""
      colsArray = new Array()

      if (
        oCollaborators[col].state_id == StrInt(colSettingGoals) ||
        oCollaborators[col].state_id == StrInt(colSettingGoalsRework)
      ) {
        selfGoalsSettingAndReworkBlock =
          listItemParagraphWithStyles +
          "<strong>✓ Поставить <a style=' border-bottom: 1px solid;' href='https://academy.uni.rest/_wt/goal_setting_col'>свои цели</a></strong> и&nbspотправить&nbspих на&nbspсогласование руководителю;" +
          "</p>";
      }

      if (
        oCollaborators[col].state_id == StrInt(colFinalApprovement)
      ) {
        selfGoalsApprovementBlock =
          listItemParagraphWithStyles +
          "<strong>✓ Ознакомиться&nbspсо <a style=' border-bottom: 1px solid;' href='https://academy.uni.rest/_wt/goal_setting_col'>своими целями;</a><strong>" +
          "</p>";
      }

      if (ArrayCount(oCollaborators[col].colSettingAndRework)) {
        colsArray = fillColsArray("colSettingAndRework")
        settingColsBlock = createColsBlock(colsArray)

        colSettingAndReworkBlock =
          listItemParagraphWithStyles +
          "<strong>✓ Напомнить </strong>" +
          (ArrayCount(oCollaborators[col].colSettingAndRework) > 1
            ? "<strong>сотрудникам</strong>"
            : "<strong>сотруднику</strong>") +
          " поставить&nbspцели и отправить&nbspих тебе на&nbspсогласование: " +
          settingColsBlock +
          "</p>"
      }

      if (ArrayCount(oCollaborators[col].bossAgreement)) {
        colsArray = fillColsArray("bossAgreement")
        agreementColsBlock = createColsBlock(colsArray)

        bossAgreementBlock =
          listItemParagraphWithStyles +
          "<strong>✓ Согласовать цели </strong>" +
          (ArrayCount(oCollaborators[col].bossAgreement) > 1
            ? "сотрудникам: "
            : "сотруднику: ") +
          agreementColsBlock +
          "</p>"
      }

      if (ArrayCount(oCollaborators[col].colFinalApprovement)) {
        colsArray = fillColsArray("colFinalApprovement")
        finalApprovementColsBlock = createColsBlock(colsArray)

        colApprovementBlock =
          listItemParagraphWithStyles +
          "<strong>✓ Напомнить </strong>" +
          (ArrayCount(oCollaborators[col].colFinalApprovement) > 1
            ? "<strong>сотрудникам </strong>"
            : "<strong>сотруднику </strong>") +
          " ознакомиться с&nbspцелями: " +
          finalApprovementColsBlock +
          "</p>"
      }

      fullText =
        selfGoalsSettingAndReworkBlock +
        selfGoalsApprovementBlock +
        colSettingAndReworkBlock +
        bossAgreementBlock +
        colApprovementBlock;

      //в конце цикла отправляем уведомление и передаём в него собранный текст tools.create_notification...

	tools.create_notification(
		  "multipurpose_year_start_reminder_type",
		  oCollaborators[col].col_id,
		  fullText
	)

      Log(oCollaborators[col].col_fullname + ": " + fullText)
      
    } catch (error) {
      Log("Error TEXT: " + error)
    }
  }
}

Log("Окончание работы агента")
EnableLog(Param.log_file_name, false)
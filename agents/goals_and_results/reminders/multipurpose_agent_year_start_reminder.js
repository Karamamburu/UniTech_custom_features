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
  '7283857316660210018': 'colSettingGoals',
  '7283857427410994955': 'bossAgreementGoals',
  '7283857459099681927': 'colSettingGoalsRework',
  '7283857504467095538': 'colFinalApprovement',
  '7283857534769645145': 'colEvaluation'
};

var colSettingGoals = 7283857316660210018;
var bossAgreementGoals = 7283857427410994955;
var colSettingGoalsRework = 7283857459099681927;
var colFinalApprovement = 7283857504467095538;
var colEvaluation = 7283857534769645145;

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

var goalmapsInfo = ArraySelectAll(XQuery(goalmapsInfoQuery));

if (!ArrayCount(goalmapsInfo)) {
  Log("Карт целей не найдено");
} else {
  Log("Найдено карт целей: " + ArrayCount(goalmapsInfo));
  Log(tools.object_to_text(goalmapsInfo, 'json'))
  counter = 0;
  var oCollaborators = {};

  for (goalmap in goalmapsInfo) {
    counter++;
    //Log("Обработка карты целей № " + counter + " с ID: " + goalmap.goalmap_id);

    try {
      if (
        !goalmap.boss_id ||
        !goalmap.state_id ||
        !goalmap.col_fullname
      ) {
        Log(
          "Пропущена обработка из-за отсутствия данных. Данные записи: " +
            tools.object_to_text(goalmap, "json")
        );
        continue;
      }

      if (!oCollaborators.HasProperty(goalmap.col_id)) {
        oCollaborators[goalmap.col_id] = {}
        oCollaborators[goalmap.col_id].col_fullname = "" + goalmap.col_fullname
        oCollaborators[goalmap.col_id].boss_id = "" + goalmap.boss_id
        oCollaborators[goalmap.col_id].boss_fullname = "" + goalmap.boss_fullname
        oCollaborators[goalmap.col_id].state_id = "" + goalmap.state_id
        oCollaborators[goalmap.col_id].state_name = "" + stateIdsMapping[goalmap.state_id]
        oCollaborators[goalmap.col_id].colSettingAndRework = new Array()
        oCollaborators[goalmap.col_id].bossAgreement = new Array()
        oCollaborators[goalmap.col_id].colFinalApprovement = new Array()
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

  for (goalmap in goalmapsInfo) {
    if (
      goalmap.state_id == colSettingGoals ||
      goalmap.state_id == colSettingGoalsRework
    ) {
      try {
        oCollaborators[goalmap.boss_id].colSettingAndRework.push(
          "" + goalmap.col_fullname
        );
      } catch (error) {
        Log("Error COL SETTING AND REWORK: " + error)
      }
    }

    if (
      goalmap.state_id == bossAgreementGoals
    ) {
      try {
        oCollaborators[goalmap.boss_id].bossAgreement.push(
          "" + goalmap.col_fullname
        );
      } catch (error) {
        Log("Error BOSS AGREEMENT: " + error)
      }
    }

    if (
      goalmap.state_id == colFinalApprovement
    ) {
      try {
        oCollaborators[goalmap.boss_id].colFinalApprovement.push(
          "" + goalmap.col_fullname
        );
      } catch (error) {
        Log("Error FINAL APPROVEMENT: " + error)
      }
    }
  }
  Log(tools.object_to_text(oCollaborators, 'json'))
  var selfGoalsSettingAndReworkBlock = ""
  var colSettingAndReworkBlock = ""
  var bossAgreementBlock = ""
  var colApprovementBlock = ""

  for (col in oCollaborators) {
    try {

      if (oCollaborators[col].state_id != StrInt(colSettingGoals) &&
        oCollaborators[col].state_id != StrInt(colSettingGoalsRework) &&
        !ArrayCount(oCollaborators[col].colSettingAndRework) &&
        !ArrayCount(oCollaborators[col].bossAgreement) &&
        !ArrayCount(oCollaborators[col].colFinalApprovement)     
      ) {
        Log(oCollaborators[col].col_fullname + " не получил уведомление")
        continue
      }

      selfGoalsSettingAndReworkBlock = ""
      colSettingAndReworkBlock = ""
      bossAgreementBlock = ""
      colApprovementBlock = ""

      if (oCollaborators[col].state_id == StrInt(colSettingGoals) || oCollaborators[col].state_id == StrInt(colSettingGoalsRework)) {
        selfGoalsSettingAndReworkBlock = "<p style='font-weight: normal; font-size: 0.6em; margin: 0 0 30px 0; '>" + 
        "- поставить цели в Академии и отправить их на согласование руководителю" + "</p>"
      }

      if (ArrayCount(oCollaborators[col].colSettingAndRework)) {

        settingColsBlock = "<div style='padding: 4px; margin-top: 8px;'>" + 
          oCollaborators[col].colSettingAndRework.join('</br>') + 
          "</div>" + 
          "<style>" +
          "@media (max-width: 600px) {" +
          "  p { font-size: 0.4em;}" +
          "}" +
          "</style>"

        colSettingAndReworkBlock = "<p style='font-weight: normal; font-size: 0.6em; margin: 0 0 30px 0; '>" + 
        "- напомнить поставить цели в Академии и отправить их тебе на согласование: " + 
        settingColsBlock + 
        "</p>"
      }

      if (ArrayCount(oCollaborators[col].bossAgreement)) {

        agreementColsBlock = "<div style='padding: 4px; margin-top: 8px;'>" + 
          oCollaborators[col].bossAgreement.join('</br>') + 
          "</div>" + 
          "<style>" +
          "@media (max-width: 600px) {" +
          "  p { font-size: 0.4em;}" +
          "}" +
          "</style>"

          bossAgreementBlock = "<p style='font-weight: normal; font-size: 0.6em; margin: 0 0 30px 0; '>" + 
        "- согласовать цели сотрудников в Академии: " + 
        agreementColsBlock + 
        "</p>"
      }

      if (ArrayCount(oCollaborators[col].colFinalApprovement)) {

        finalApprovementColsBlock = "<div style='padding: 4px; margin-top: 8px;'>" + 
          oCollaborators[col].colFinalApprovement.join('</br>') + 
          "</div>" + 
          "<style>" +
          "@media (max-width: 600px) {" +
          "  p { font-size: 0.4em;}" +
          "}" +
          "</style>"

          colApprovementBlock = "<p style='font-weight: normal; font-size: 0.6em; margin: 0 0 30px 0; '>" + 
        "- напомнить сотрудникам подтвердить ознакомление с целями в Академии: " + 
        finalApprovementColsBlock + 
        "</p>"
      }

      fullText = selfGoalsSettingAndReworkBlock + colSettingAndReworkBlock + bossAgreementBlock + colApprovementBlock
      Log(oCollaborators[col].col_fullname + ":" + fullText)
      
    } catch (error) {
      Log("Error TEXT: " + error)
    } 
  }
  tools.create_notification("employee_evaluation_type", 7138424178183920544);
}

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
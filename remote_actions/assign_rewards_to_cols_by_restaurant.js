UniTools = OpenCodeLib(
  FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/uni_tools.js")
);

function buildQueryString() {
  var queryString = "contains($elem/code, 'reward') ";
  
  switch (curUser.position_name) {
    case "ROCC": {
      queryString += "and contains($elem/code, 'for_rocc')";
      break;
    }
    case "RSC Contractor": {
      queryString += "and contains($elem/code, 'for_rocc')";
      break;
    }
    case "Area Coach": {
      queryString += "and contains($elem/code, 'for_area_coach')";
      break;
    }
    case "Region Coach": {
      queryString += "and contains($elem/code, 'for_region_coach')";
      break;
    }
    case "Market Coach": {
      queryString += "and contains($elem/code, 'for_region_coach')";
      break;
    }
  }
	/*
	  var groupConditions = new Array()
	  
	  if (UniTools.isMemberOfGroup(curUserID, groupId_1)) {
		groupConditions.push("contains($elem/code, 'for_first_group')")
	  }
	  if (UniTools.isMemberOfGroup(curUserID, groupId_2)) {
		groupConditions.push("contains($elem/code, 'for_second_group')")
	  }

	  groupConditions.length > 0 
		? queryString += "and (" + groupConditions.join(" or ") + ")" 
		: ""
	*/
  return queryString
}

switch (command) {
    case "eval": {
      RESULT = {
        command: "display_form",
        title: "Вручить награду сотрудникам ресторана",
        message: "Выбери награду и ресторан для вручения",
        form_fields: [
          {
            name: "reward_id",
            type: "foreign_elem",
            catalog: "qualification",
            label: "Выбери награду",
            title: "Награда",
            mandatory: true,
            query_qual: buildQueryString(),
          },
          {
            name: "restaurant_id",
            type: "foreign_elem",
            catalog: "subdivision",
            label: "Выбери ресторан",
            title: "Ресторан",
            mandatory: true,
          },
          {
            name: "text",
            type: "string",
            catalog: "collaborator",
            label: "Комментарий к награде",
            mandatory: true,
            validation: "nonempty",
          },
        ],
        buttons: [
          { name: "submit", label: "Вручить награду", type: "submit" },
          { name: "cancel", label: "Отмена", type: "cancel" },
        ],
      };
      break;
    }
  
    case "submit_form": {
      function Log(message, ex) {
        if (ex == undefined) {
          LogEvent("remote_action_assign_rewards_by_restaurant", message);
        } else {
          LogEvent(
            "remote_action_assign_rewards_by_restaurant",
            message + " Message: " + ex
          );
        }
      }
  
      EnableLog("remote_action_assign_rewards_by_restaurant", true);
      Log("Старт присвоения наград");
  
      UniTools = OpenCodeLib(
        FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/uni_tools.js")
      );
  
      fields = ParseJson(form_fields);
      reward_id = ArrayOptFind(fields, "This.name == 'reward_id'").value;
      restaurant_id = ArrayOptFind(fields, "This.name == 'restaurant_id'").value;
      textComment = ArrayOptFind(fields, "This.name == 'text'").value;
  
      UniTools.assignRewardsToColsByRestaurant(
        reward_id,
        restaurant_id,
        curUserID,
        textComment
      );
  
      Log("Присвоение наград завершено");
      EnableLog("remote_action_assign_rewards_by_restaurant", false);
  
      RESULT = {
        command: "close_form",
        msg: "Награда успешно присвоена сотрудникам ресторана",
      };
    }
  }
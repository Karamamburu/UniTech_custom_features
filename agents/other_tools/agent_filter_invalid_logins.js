function Log(message, ex) {
    if(ex == null || ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Exception: ' + ex));
    }
}

EnableLog(Param.log_file_name, true);
Log("Начало работы агента");

function isValidLogin(login) {

	if (StrCharCount(login) != 7) return false
	lowercaseLogin = StrLowerCase(login)

	for (i = 0; i < 3; i++) {
		charCode = lowercaseLogin.charCodeAt(i)
		if (charCode < 97 || charCode > 122) return false
	}
	numbersPart = lowercaseLogin.slice(3)
	
	for (i = 0; i < StrCharCount(numbersPart); i++) {
		charCode = numbersPart.charCodeAt(i)
		if (charCode < 48 || charCode > 57) return false
	}

	return true
}

var query = "sql: 
			SELECT
				login,
				fullname,
				position_parent_name
			FROM
				collaborators
"
var collaborators = ArraySelectAll(XQuery(query));
var invalidLogins = new Array()
counter = 0

try {
	for (col in collaborators) {
		if (!isValidLogin(col.login)) {
			invalidLogins.push(col)
			counter++
		}
	}
} catch (ex) {
	Log("error: " + ex)
}

Log("Найдено некорректных логинов: " + counter)
Log(tools.object_to_text(invalidLogins, 'json'))

Log("Окончание работы агента");
EnableLog(Param.log_file_name, false);
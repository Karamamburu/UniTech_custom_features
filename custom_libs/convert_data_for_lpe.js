function convertEmailToLink(email) {
    return "<a href= mailto:" + email + ">" + email + "</a>"
}

function getLinkToColCard(colId) {
    return UrlAppendPath(global_settings.settings.portal_base_url, "/person/" + colId)
}

function convertToReadableShortName(fullname) {
    return tools.call_code_library_method("get_readable", "getReadableShortName", [fullname])
}

function convertToReadableShortDate(date) {
    return tools.call_code_library_method("get_readable", "getReadableShortDate", [date])
}

function convertToReadableFullDate(date) {
    return tools.call_code_library_method("get_readable", "getReadableFullDate", [date])
}

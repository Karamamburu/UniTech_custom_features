function convertEmailToLink(email) {
    return "<a href= mailto:" + email + ">" + email + "</a>"
}

function getLinkToColCard(colId) {
    return UrlAppendPath(global_settings.settings.portal_base_url, "/_wt/" + colId)
}
    
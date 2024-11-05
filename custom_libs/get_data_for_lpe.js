function convertEmailToLink(email) {
    return "<a href= mailto:" + email + ">" + email + "</a>"
}

function getLinkToColCard(colId) {
    return UrlAppendPath(global_settings.settings.portal_base_url, "/_wt/" + colId)
}

function getPartnerName(colId) {
    var positionNames = "'FOH TM', 'MOH TM', 'BOH TM', 'Team Member', 'Team Trainer', 'Shift Supervisor', 'Assistant Manager', 'RGM', 'RGM Trainee'";

    var queryPartnerName = "sql: 
                        SELECT 
                            CASE
                                WHEN s3.name = 'Corporate' OR s2.name = 'Corporate' THEN 'UNIREST'
                                WHEN c.position_name IN (" + positionNames + ") THEN s4.name
                                ELSE s2.name
                            END AS partner_name
                        FROM collaborators c
                        JOIN subdivisions s1 ON c.position_parent_id = s1.id
                        JOIN subdivisions s2 ON s1.parent_object_id = s2.id
                        LEFT JOIN subdivisions s3 ON s2.parent_object_id = s3.id
                        LEFT JOIN subdivisions s4 ON s3.parent_object_id = s4.id
                        WHERE c.id = " + colId

    var partnerNames = ArraySelectAll(XQuery(queryPartnerName))
    var partnerName = ArrayOptFirstElem(partnerNames).partner_name

    return partnerName
}
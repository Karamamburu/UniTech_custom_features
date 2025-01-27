var masterAccessGroupId = 7116912537642955540

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

if (isMemberOfGroup(initiator_person_id, masterAccessGroupId)) {

var query = "sql:
WITH temp AS (
SELECT
    c.id AS sender_id,
    c.fullname AS sender_fullname, 
    c.position_name, 
    c.position_parent_name, 
    COUNT(acc.id) OVER(PARTITION BY c.id) AS recognition_count
FROM collaborators c
JOIN cc_acceptances acc ON c.id = acc.sender_id
LEFT JOIN collaborators cls ON cls.id = acc.recipient_id
WHERE 
  c.position_name NOT IN ('EXT Contractor')
  AND c.login != 'ru.corporate.university'
) SELECT DISTINCT *
  FROM temp
  ORDER BY recognition_count DESC
"

} else {

var query = "sql:
WITH temp AS (
    SELECT
        CASE
            WHEN s3.name = 'Corporate' OR s2.name = 'Corporate' THEN 'UNIREST'
            WHEN c.position_name IN ('FOH TM', 'MOH TM', 'BOH TM', 'Team Member', 'Team Trainer', 'Shift Supervisor', 'Assistant Manager', 'RGM', 'RGM Trainee') THEN s4.name
            ELSE s2.name
        END AS initiator_partner_name
    FROM collaborators c
    JOIN subdivisions s1 ON c.position_parent_id = s1.id
    JOIN subdivisions s2 ON s1.parent_object_id = s2.id
    LEFT JOIN subdivisions s3 ON s2.parent_object_id = s3.id
    LEFT JOIN subdivisions s4 ON s3.parent_object_id = s4.id
    WHERE c.id = " + initiator_person_id + " 
),
filtered_employees AS (
    SELECT
        c.id AS sender_id,
        c.fullname AS sender_fullname, 
        c.position_name, 
        c.position_parent_name, 
        COUNT(acc.id) OVER(PARTITION BY c.id) AS recognition_count,
        CASE
            WHEN s3.name = 'Corporate' OR s2.name = 'Corporate' THEN 'UNIREST'
            WHEN c.position_name IN ('FOH TM', 'MOH TM', 'BOH TM', 'Team Member', 'Team Trainer', 'Shift Supervisor', 'Assistant Manager', 'RGM', 'RGM Trainee') THEN s4.name
            ELSE s2.name
        END AS employee_partner_name
    FROM collaborators c
    JOIN cc_acceptances acc ON c.id = acc.sender_id
    LEFT JOIN collaborators cls ON cls.id = acc.recipient_id
    JOIN subdivisions s1 ON c.position_parent_id = s1.id
    JOIN subdivisions s2 ON s1.parent_object_id = s2.id
    LEFT JOIN subdivisions s3 ON s2.parent_object_id = s3.id
    LEFT JOIN subdivisions s4 ON s3.parent_object_id = s4.id
    WHERE 
        c.position_name NOT IN ('RSC', 'RSC Contractor', 'Other', 'EXT Contractor')
        AND c.login != 'ru.corporate.university'

)
SELECT DISTINCT 
    sender_id, 
    sender_fullname, 
    position_name, 
    position_parent_name, 
    recognition_count
FROM filtered_employees, temp
WHERE employee_partner_name = initiator_partner_name
ORDER BY recognition_count DESC
"
}

var recognitions = XQuery(query)
return recognitions
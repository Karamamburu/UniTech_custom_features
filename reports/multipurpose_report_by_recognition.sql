var masterAccessGroupId = 7116912537642955540

UniTools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/uni_tools.js"));
GetReadable = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/getReadable.js"));
GetDataForLpe = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/get_data_for_lpe.js"));

if (UniTools.isMemberOfGroup(initiator_person_id, masterAccessGroupId)) {

var query = "sql:

WITH temp AS (
SELECT
    c.id AS sender_id,
    c.fullname AS sender_fullname, 
    c.position_name, 
    c.position_parent_name,
    acc.create_date, 
    COUNT(acc.id) OVER(PARTITION BY c.id) AS recognition_count
FROM collaborators c
JOIN cc_acceptances acc ON c.id = acc.sender_id
LEFT JOIN collaborators cls ON cls.id = acc.recipient_id
WHERE 
  acc.create_date BETWEEN 
    CAST('" + StrXmlDate({PARAM1}) + "' AS DATE)
    AND
    CAST('" + StrXmlDate({PARAM2}) + "' AS DATE)
AND
  c.position_name NOT IN ('EXT Contractor')
AND 
  c.login != 'ru.corporate.university'
) SELECT DISTINCT
     sender_id,
     sender_fullname,
     position_name,
     position_parent_name,
     recognition_count
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

var aResult = new Array()
for (object in recognitions) {
    newObj = new Object()
    newObj.PrimaryKey = object.sender_id
    newObj.sender_id = object.sender_id
    newObj.sender_fullname = GetReadable.getReadableShortName(object.sender_fullname)
    newObj.position_name = GetReadable.getReadablePositionName(object.sender_id)
    newObj.position_parent_name = GetReadable.getReadablePositionParentName(object.sender_id)
    newObj.partner_name = GetDataForLpe.getPartnerName(object.sender_id) == 'ИРБ' 
        ? 'IRB Family' 
        : GetDataForLpe.getPartnerName(object.sender_id) == 'МайРест' 
            ? 'IRB Family' 
            : GetDataForLpe.getPartnerName(object.sender_id) == 'РБП' 
                 ? 'IRB Family' 
                 : GetDataForLpe.getPartnerName(object.sender_id)
    newObj.recognition_count = object.recognition_count
    newObj.test_date = {PARAM1} 

    aResult.push(newObj)
}

return aResult
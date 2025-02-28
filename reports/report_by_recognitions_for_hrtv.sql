var query = "sql:
WITH temp AS (
SELECT
    c.id AS recipient_id,
    c.fullname AS recipient_fullname, 
    c.position_name, 
    c.position_parent_name, 
    COUNT(acc.id) OVER(PARTITION BY c.id) AS recognition_count
FROM collaborators c
JOIN cc_acceptances acc ON c.id = acc.recipient_id
LEFT JOIN subdivisions ss ON c.position_parent_id = ss.id
LEFT JOIN subdivisions sss ON ss.parent_object_id = sss.id
WHERE sss.id = 7174468764482109387
  AND c.position_name NOT IN ('EXT Contractor', 'RSC', 'RSC Contractor', 'Area Coach', 'Region Coach')
  AND c.login != 'ru.corporate.university'
  AND CAST(acc.create_date AS DATE) >= CAST(DATEADD(dd, -{PARAM1}, GETDATE() + 1) AS DATE)
) SELECT DISTINCT *
  FROM temp
  ORDER BY recognition_count DESC
"
var result = XQuery(query)
return result
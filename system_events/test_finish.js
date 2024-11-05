//Отправка уведомлений о завершении теста перед Сертификацией Директоров
if(assessmentDoc.code == 'director_certification_test') {
    //отправка почтового уведомления руководителю
    var notificationType;
    learningDoc.score >= 90 ? notificationType = "certification_test_finish_success_type" : notificationType = "certification_test_finish_failure_type"
    tools.create_notification(notificationType, activeLearningDoc.doc_info.creation.user_id, learningDoc.score, activeLearningDoc.Doc.DocID);

    // Создание кастомного уведомления в колокольчик руководителю
    _notification_doc = tools.new_doc_by_name('cc_notification', false);
    _notification_doc.TopElem.object_id = OptInt(assessmentID, 0);
    _notification_doc.TopElem.object_type = 'assessment';
    _notification_doc.TopElem.collaborator_id = activeLearningDoc.doc_info.creation.user_id;
    _notification_doc.TopElem.description = 'Сотрудник ' + learningDoc.person_fullname + ' завершил/-а тест "' + learningDoc.assessment_name + '"';
    _notification_doc.TopElem.is_info = false;
    _notification_doc.BindToDb();
    _notification_doc.Save();

    // Создание кастомного уведомления в колокольчик сотруднику
    _notification_doc = tools.new_doc_by_name('cc_notification', false);
    _notification_doc.TopElem.object_id = OptInt(assessmentID, 0);
    _notification_doc.TopElem.object_type = 'assessment';
    _notification_doc.TopElem.collaborator_id = learningDoc.person_id;
    _notification_doc.TopElem.description = 'Вы завершили тест "' + learningDoc.assessment_name + '"';
    _notification_doc.BindToDb();
    _notification_doc.Save();
}

//Отправка уведомления на почту КУ о завершении теста перед Ассесментом
if(assessmentDoc.code == 'assessment_ops_standards') {
    var notificationType;
    var corporateUniversityId = 7356921899760905666;
    learningDoc.score >= 90 ? notificationType = "test_ops_standards_success_type" : notificationType = "test_ops_standards_failure_type"
    tools.create_notification(notificationType, corporateUniversityId, learningDoc.score, activeLearningDoc.Doc.DocID);
}
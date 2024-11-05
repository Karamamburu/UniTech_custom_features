//пример
if(requestDoc.TopElem.request_type_id==OptInt('id_типа_заявки')) {
    tools.create_notification( 'код_типа_уведомления', OptInt(requestDoc.DocID));
}

//Заявка на Приведи Друга
if(requestDoc.TopElem.request_type_id==OptInt(7431835536305831140)) {
    tools.create_notification( 'request_referral_type', OptInt(requestDoc.DocID));

    tools.create_notification( 'request_referral_type', 7138424178183920544);
    tools.create_notification( 'request_referral_type', 7172483678547831820);
    tools.create_notification( 'request_referral_type', 7281405151477773727);
}
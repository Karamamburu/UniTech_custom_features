function getDataByUrl(url) {
    data = [];
    headers = "Authorization: Bearer " + AppConfig.ESB_ORGSTRUCT_AUTH_TOKEN + "\nContent-type: application/json\n";

    response = HttpRequest(url, 'get', null, headers);
    data = tools.read_object(response.Body, 'json').value;

    return data;
}

function getPartnerESB(customersArray, retailStore) {
    return ArrayOptFind(customersArray, "This.AccountNum == '" + retailStore.GetOptProperty('FranchiseePartnerAccount', '0') + "'");
}

function getUlESB(customersArray, retailStore) {
    return ArrayOptFind(customersArray, "This.AccountNum == '" + retailStore.GetOptProperty('CustAccountFranchisee', '0') + "'");
}

function getJdeCode(extCodeValuesArray, recId, tableId) {
    query_str = "This.ExtCodeRelationRecId == " + recId + " && This.ExtCodePurpose == 'JDECode'";
    if (tableId != undefined) {
        query_str += (" && This.ExtCodeRelationTableId == " + tableId);
    }
    extCodeValue = ArrayOptFind(extCodeValuesArray, query_str);
    if (extCodeValue != undefined) {
        return extCodeValue.ExtCodeValueAlias;
    }
    return '';
}

function getOrCreateOrg() {
    org = ArrayOptFirstElem(XQuery("sql: SELECT * FROM orgs WHERE code = 'yum'"));
    if (org == undefined) {
        org_doc = tools.new_doc_by_name('org', false);
        org_doc.TopElem.code = 'yum';
        org_doc.TopElem.disp_name = 'YUM';
        org_doc.TopElem.name = 'YUM';
        org_doc.BindToDb();
        org_doc.Save();
        org = org_doc.TopElem;
    }

    return org;
}

function getOrCreateSubdivision(org, processed_subdivisions, name_is_key, name, code, parent_id, subdivision_type, status, format) {
    subdiv = undefined;
    search_subdiv_query = "sql: SELECT * FROM subdivisions WHERE org_id = " + org.id;

    if (name_is_key == true) {
        search_subdiv_query += " AND name = '" + StrReplace(String(name), "'", "''") + "'";
    }

    if (code != undefined) {
        search_subdiv_query += " AND (code = '" + code + "' OR code IS NULL)";
    }

    if (parent_id != undefined) {
        search_subdiv_query += (" AND parent_object_id = " + parent_id);
    }

    subdiv = ArrayOptFirstElem(XQuery(search_subdiv_query));

    if (status != undefined) {
        status_lower_case = String(status).toLowerCase();
        if (status_lower_case != 'open' && status_lower_case != 'preopening' && status_lower_case != 'new') {
            if (subdiv != undefined) {
                try {
                    DeleteDoc(UrlFromDocID(subdiv.id));
                    Log('Delete subdivision completed. Reason: Status - ' + status_lower_case + '. DocID: ' + subdiv.id + ' . DocName: ' + subdiv.name);
                } catch(ex) {
                    Log('Delete subdivision failed. Reason: Status - ' + status_lower_case + '. DocID: ' + subdiv.id + ' . DocName: ' + subdiv.name, ex);
                }
            }

            return null;
        }
    }

    subdiv_doc = undefined;

    if (subdiv == undefined) {
        subdiv_doc = tools.new_doc_by_name('subdivision', false);
        subdiv_doc.BindToDb();
    } else {
        subdiv_doc = tools.open_doc(subdiv.id);
    }

    if (subdiv_doc != undefined) {
        if (code != undefined) {
            subdiv_doc.TopElem.code = code;
        }
        if (parent_id != undefined) {
            subdiv_doc.TopElem.parent_object_id = parent_id;
        }
        if (subdivision_type != undefined) {
            subdiv_doc.TopElem.custom_elems.ObtainChildByKey('subdivision_type').value = subdivision_type;
        }
        if (status != undefined) {
            subdiv_doc.TopElem.custom_elems.ObtainChildByKey('status').value = status;
        }
        if (format != undefined) {
            if (subdivision_type == '–есторан') {
                subdiv_doc.TopElem.custom_elems.ObtainChildByKey('format').value = format;
            }
        }
        subdiv_doc.TopElem.name = name;
        subdiv_doc.TopElem.org_id = org.id;

        subdiv_doc.Save();
    }

    processed_subdivisions.push(subdiv_doc.DocID);

    return subdiv_doc.TopElem;
}

function importCorporateRest(org, processed_subdivisions, retailStore) {
    corporateSubdivision = getOrCreateSubdivision(org, processed_subdivisions, true, 'Corporate');
    getOrCreateSubdivision(org, processed_subdivisions, true, 'RSC (Restaurants Support Center)', undefined, corporateSubdivision.id);
    restSubdivision = getOrCreateSubdivision(org, processed_subdivisions, true, '–естораны', undefined, corporateSubdivision.id);
    getOrCreateSubdivision(org,
        processed_subdivisions,
        false,
        retailStore.GetOptProperty('Name', ''),
        retailStore.GetOptProperty('StoreFactsNumber', ''),
        restSubdivision.id, '–есторан',
        retailStore.GetOptProperty('Status', ''),
        retailStore.GetOptProperty('StoreFormatId', '')
    );
}

function importFranchiseeRest(org, customersArray, extCodeValuesArray, processed_subdivisions, retailStore) {
    franchiseeSubdivision = getOrCreateSubdivision(org, processed_subdivisions, true, 'Franchise');
    partnerESB = getPartnerESB(customersArray, retailStore);

    if (partnerESB != undefined) {
        partnerSubdivision = getOrCreateSubdivision(org, processed_subdivisions, true, partnerESB.GetOptProperty('Name', ''), undefined, franchiseeSubdivision.id, '‘раншиза');
        ulESB = getUlESB(customersArray, retailStore);

        if (ulESB != undefined) {
            getOrCreateSubdivision(org, processed_subdivisions, true, 'FZ_RSC (Restaurants Support Center)', undefined, partnerSubdivision.id);
            allRestSubdivision = getOrCreateSubdivision(org, processed_subdivisions, true, '–естораны', undefined, partnerSubdivision.id);
            ulSubdivision = getOrCreateSubdivision(org, processed_subdivisions, true, ulESB.GetOptProperty('Name', ''), getJdeCode(extCodeValuesArray, ulESB.CustAxRecId, ulESB.CustAxTableId), allRestSubdivision.id, 'ёридическое лицо');
            getOrCreateSubdivision(org,
                processed_subdivisions,
                false,
                retailStore.GetOptProperty('Name', ''),
                getJdeCode(extCodeValuesArray, retailStore.RetailStoreAxRecId, retailStore.RetailStoreAxTableId),
                ulSubdivision.id, '–есторан',
                retailStore.GetOptProperty('Status', ''),
                retailStore.GetOptProperty('StoreFormatId', '')
            );
        }
    }
}

function Log(message, ex) {
    if (ex == undefined) {
        LogEvent('agent_import_org_struct_esb', message);
    } else {
        LogEvent('agent_import_org_struct_esb', (message + ' Message: ' + ex));
    }
}

function Run(retail_store_url, customers_url, ext_code_values_url) {
    EnableLog('agent_import_org_struct_esb');

    Log('Integration by ESB started');

    agent_interrupt = false;

    processed_subdivisions = [];
    retailStoresArray = [];
    customersArray = [];
    extCodeValuesArray = [];

    Log('Start receive RetailStores, Customers and ExtCodeValues.');
    try {
        retailStoresArray = getDataByUrl(retail_store_url);
        Log('Receive RetailStores is completed. Count: ' + ArrayCount(retailStoresArray));
        customersArray = getDataByUrl(customers_url);
        Log('Receive Customers is completed. Count: ' + ArrayCount(customersArray));
        extCodeValuesArray = getDataByUrl(ext_code_values_url);
        Log('Receive ExtCodeValues is completed. Count: ' + ArrayCount(extCodeValuesArray));
    } catch(ex) {
        agent_interrupt = true;
        Log('Receive data ended with an error.', ex);
    }
    Log('Finish receive RetailStores, Customers and ExtCodeValues.');

    if (!agent_interrupt) {
        corporateRests = [];
        //ќпредел¤ем AccountNum организации "ям" дл¤ поиска Corporate ресторанов по полю FranchiseePartnerAccount
        //BEGIN
        Log('Start find Corporate retail stores.');
        extCodeValueCorporate = ArrayOptFind(extCodeValuesArray, "This.ExtCodeValueAlias == '74001' && This.ExtCodePurpose == 'JDECode'");
        if (extCodeValueCorporate != undefined) {
            Log('Finded extCodeValueCorporate.');
            customerCorporate = ArrayOptFind(customersArray, "This.CustAxRecId == " + extCodeValueCorporate.ExtCodeRelationRecId);
            if (customerCorporate != undefined) {
                Log('Finded customerCorporate.');
                corporateRests = ArraySelect(retailStoresArray, "This.FranchiseePartnerAccount == '" + customerCorporate.AccountNum + "'");
            }
        }
        Log('End find Corporate retail stores. Count: ' + ArrayCount(corporateRests));
        //END

        org = getOrCreateOrg();

        for (retailStore in retailStoresArray) {
            isCorporate = false;
            if (ArrayOptFind(corporateRests, "This.RetailStoreAxRecId == " + retailStore.GetOptProperty('RetailStoreAxRecId', 0)) != undefined) {
                isCorporate = true;
            }

            try {
                if (isCorporate) {
                    importCorporateRest(org, processed_subdivisions, retailStore);
                } else {
                    importFranchiseeRest(org, customersArray, extCodeValuesArray, processed_subdivisions, retailStore);
                }
                Log('Import retail store with RetailStoreAxRecId = ' + retailStore.GetOptProperty('RetailStoreAxRecId') + ' completed. Name: ' + retailStore.GetOptProperty('Name'));
            } catch(ex) {
                Log('Import retail store with RetailStoreAxRecId = ' + retailStore.GetOptProperty('RetailStoreAxRecId') + ' ended with an error. Name: ' + retailStore.GetOptProperty('Name'), ex);
            }
        }

        Log('Post processing started');

        all_subdivisions = ArraySelectAll(XQuery("sql: SELECT id, name FROM subdivisions"));

        for (subdiv in all_subdivisions) {
            exist_processed = ArrayOptFind(processed_subdivisions, 'This == ' + subdiv.id) != undefined;
            if (!exist_processed) {
                subdiv_doc = tools.open_doc(subdiv.id);
                is_department = subdiv_doc.TopElem.custom_elems.GetOptChildByKey('is_department');
                is_department = (is_department != null && is_department != undefined) ? is_department.GetOptProperty("value", false) : false;
                if (!tools_web.is_true(is_department)) {
                    try {
                        DeleteDoc(UrlFromDocID(subdiv.id));
                        Log('Delete subdivision completed. Reason: Subdivision not exist in ESB. DocID: ' + subdiv.id + ' . DocName: ' + subdiv.name);
                    } catch(ex) {
                        Log('Delete subdivision failed. Reason: Subdivision not exist in ESB. DocID: ' + subdiv.id + ' . DocName: ' + subdiv.name, ex);
                    }
                }
            }
        }
    }

    Log('Integration by ESB finished.');

    EnableLog('agent_import_org_struct_esb', false);
}

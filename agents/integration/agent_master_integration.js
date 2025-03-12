function Log(message, ex) {
    if (ex == null || ex == undefined) {
        LogEvent(Param.log_file_name, message);
    } else {
        LogEvent(Param.log_file_name, (message + ' Message: ' + ex));
    }
}

EnableLog(Param.log_file_name);

Log('Agent started.');

//DEBUG
DropFormsCache(FilePathToUrl(AppDirectoryPath()+"/custom_tools/custom_agent_esb_integration_tools.js"));
//DropFormsCache(FilePathToUrl(AppDirectoryPath()+"/custom_tools/custom_agent_receive_ldap_data_tools.js"));
//DropFormsCache(FilePathToUrl(AppDirectoryPath()+"/custom_tools/custom_agent_processing_ldap_data_tools.js"));
DropFormsCache(FilePathToUrl(AppDirectoryPath()+"/custom_tools/custom_agent_receive_gem_data_tools.js"));
DropFormsCache(FilePathToUrl(AppDirectoryPath()+"/custom_tools/custom_agent_processing_gem_data_tools.js"));

esb_tools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_agent_esb_integration_tools.js"));
receive_gem_tools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_agent_receive_gem_data_tools.js"));
processing_gem_tools = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/custom_tools/custom_agent_processing_gem_data_tools.js"));

Log('Integration by ESB started.');
try {
    esb_tools.Run(Param.RetailStoresUrl, Param.CustomersUrl, Param.ExtCodeValuesUrl);
    Log('Integration by ESB finished.');
} catch (ex) {
    Log('Integration by ESB finished with error.', ex);
}

Log('Receive data from Gem started.');
try {
    receive_gem_tools.Run(Param.PropertiesGem, Param.deltaGem, Param.StringGemEndpoint, Param.CountUserInPacks);
    Log('Receive data from Gem finished.');
} catch (ex) {
    Log('Receive data from Gem finished with error.', ex);
}

Log('Processing data from Gem started.');
try {
    processing_gem_tools.Run();
    Log('Processing data from Gem finished.');
} catch (ex) {
    Log('Processing data from Gem finished with error.', ex);
}

Log('Agent finished.');
EnableLog(Param.log_file_name, false);
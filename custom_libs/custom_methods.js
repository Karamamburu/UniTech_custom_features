/**
 * @typedef {Object} oEmployeePersonalData
 * @property {bigint} id
 * @property {string} name
 * @property {string} title
 * @property {string} value
*/
/**
 * @typedef {Object} ReturnEmployeePersonalData
 * @property {number} error – код ошибки
 * @property {string} errorText – текст ошибки
 * @property {boolean} result – результат
 * @property {oEmployeePersonalData[]} array – массив
*/
/**
 * @function customGetEmployeePersonalData
 * @memberof Websoft.WT.Staff
 * @description Получение личных данных сотрудника.
 * @description КАСТОМИЗАЦИЯ - возвращает дату в формате "3 сентября"
 * @description КАСТОМИЗАЦИЯ - email всегда кликабельный и приведён к нижнему регистру
 * @description КАСТОМИЗАЦИЯ - дата рождения больше не отрезается слева на 5 символов
 * @description КАСТОМИЗАЦИЯ - org_id теперь возвращает название партнёра, используя метод библиотеки
 * @description КАСТОМИЗАЦИЯ - position_parent_name теперь возвращает "Центр поддержки ресторанов" для офисных сотрудников
 * @description КАСТОМИЗАЦИЯ - position_name теперь возвращает русскоязычные должности для сотрудников ресторанов
 * @author AZ
 * @param {string} [sDisplayFields] - Отображаемые поля
 * @param {boolean} bEmailAsLink - Если установлен, возвращать e-mail как <a href="mailto:...
 * @returns {ReturnEmployeePersonalData}
*/

function customGetEmployeePersonalData( iCurUserID, sDisplayFields, bEmailAsLink )
{
	LibMain = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/wtv/libs/main_library.js"));
	GetReadable = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/getReadable.js"));
	
	oRes = new Object();
	oRes.error = 0;
	oRes.errorText = "";
	oRes.result = true;
	oRes.array = [];

	GetReadable = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/getReadable.js"));

	try
	{
		iCurUserID = Int( iCurUserID );

		teCollaborator = OpenDoc( UrlFromDocID( iCurUserID ) ).TopElem;
		if ( teCollaborator.Name != 'collaborator' )
		{
			oRes.error = 1;
			oRes.errorText = i18n.t( 'peredannyyidob' );
			return oRes;
		}

		try
		{
			if ( sDisplayFields == '' )
				throw ''

			arrDisplayFields = sDisplayFields.split( ';' );
		}
		catch( ex )
		{
			arrDisplayFields = [];
		}

		try
		{
			bEmailAsLink = tools_web.is_true( bEmailAsLink );
		}
		catch( ex )
		{
			bEmailAsLink = false;
		}

		sValue = '';

		if ( ArrayOptFind( arrDisplayFields, "This == 'login' " ) != undefined )
		{
			if ( tools_web.is_true( teCollaborator.disp_login ) && teCollaborator.login.HasValue )
				sValue = teCollaborator.login.Value;
			else
				sValue = '';
	
			oRes.array.push( { 
				id: teCollaborator.id.Value, 
				name: 'login', 
				title: ms_tools.get_const( 'uf_login' ), 
				value: sValue } );
		}

		if ( ArrayOptFind( arrDisplayFields, "This == 'sex' " ) != undefined )
		{
			if ( tools_web.is_true( teCollaborator.disp_sex ) && teCollaborator.sex.HasValue )
				sValue = teCollaborator.sex.Value == 'm' ? i18n.t( 'muzhskoy_1' ) : i18n.t( 'zhenskiy_1' );
			else
				sValue = '';

			oRes.array.push( { 
				id: teCollaborator.id.Value, 
				name: 'sex', 
				title: ms_tools.get_const( 'vpb_sex' ), 
				value: sValue } );
		}

		if ( ArrayOptFind( arrDisplayFields, "This == 'birth_date' " ) != undefined )
		{
			if ( tools_web.is_true( teCollaborator.disp_birthdate ) && teCollaborator.birth_date.HasValue )
			{
				sValue = GetReadable.getReadableShortDate(teCollaborator.birth_date.Value);
			}
			else
				sValue = '';

			oRes.array.push( { 
				id: teCollaborator.id.Value, 
				name: 'birth_date', 
				title: ms_tools.get_const( 'vpb_birthday' ), 
				value: sValue } );
		}

		if ( ArrayOptFind( arrDisplayFields, "This == 'work_address' " ) != undefined )
		{
			try
			{
				sPlaceName = ( teCollaborator.place_id.HasValue ? teCollaborator.place_id.ForeignElem.name.Value : '' );
			}
			catch( ex )
			{
				sPlaceName = '';
			}

			try
			{
				sRegionName = ( teCollaborator.region_id.HasValue ? teCollaborator.region_id.ForeignElem.name.Value : '' );
			}
			catch( ex )
			{
				sRegionName = '';
			}

			sValue = ( sPlaceName != '' ? sPlaceName + ( sRegionName != '' ? ( ', ' + sRegionName ) : '' ) : sRegionName );

			oRes.array.push( { 
				id: teCollaborator.id.Value, 
				name: 'work_address', 
				title: i18n.t( 'rabochiyadres' ), 
				value: sValue } );
		}

		if ( ArrayOptFind( arrDisplayFields, "This == 'email' " ) != undefined )
			oRes.array.push( { 
				id: teCollaborator.id.Value, 
				name: 'email', 
				title: ms_tools.get_const( 'uf_email' ), 
				value: '<a href="mailto:'+ StrLowerCase(teCollaborator.email.Value) +'">'+ StrLowerCase(teCollaborator.email.Value) +'</a>' 
			} );

		if ( ArrayOptFind( arrDisplayFields, "This == 'phone' " ) != undefined )
			oRes.array.push( { 
				id: teCollaborator.id.Value, 
				name: 'phone', 
				title: ms_tools.get_const( 'uf_phone' ), 
				value: teCollaborator.phone.Value } );

		if ( ArrayOptFind( arrDisplayFields, "This == 'position_name' " ) != undefined )
			oRes.array.push( { 
				id: teCollaborator.id.Value, 
				name: 'position_name', 
				title: ms_tools.get_const( 'c_position' ), 
				value: GetReadable.getReadablePositionName(teCollaborator.id.Value)
			} );

		if ( ArrayOptFind( arrDisplayFields, "This == 'position_parent_name' " ) != undefined )
			oRes.array.push( { 
				id: teCollaborator.id.Value, 
				name: 'position_parent_name', 
				title: ms_tools.get_const( 'c_subd' ), 
				value: GetReadable.getReadablePositionParentName(teCollaborator.id.Value)
			} );

		if ( ArrayOptFind( arrDisplayFields, "This == 'org_name' " ) != undefined )
			oRes.array.push( { 
				id: teCollaborator.id.Value, 
				name: 'org_name', 
				title: ms_tools.get_const( 'c_org' ), 
				value: tools.call_code_library_method("get_data_for_lpe", "getPartnerName", [teCollaborator.id.Value]) 
			} );
	}
	catch( ex )
	{
		oRes.error = 1;
		oRes.errorText = i18n.t( 'peredannekorre_6' );
		return oRes;
	}

	return oRes
}

/**
 * @function GetPersonCollaborators
 * @memberof Websoft.WT.Main
 * @description Получения списка сотрудников (коллеги, руководители или подчиненные).
 * @author BG
 * @param {bigint} iPersonID - ID сотрудника
 * @param {string} sTypeCollaborator - Выбор, по кому осуществлять выборку ( colleagues/colleagues_hier/colleagues_org/colleagues_boss/bosses/subordinates/main_subordinates/func_subordinates/all_subordinates )
 * @param {number} [iMaxCnt] - Максимальное количество выводимых сотрудников в блоке
 * @param {boolean} [bShowDismiss=false] - Показывать уволенных сотрудников
 * @param {string} [sSearch] - Поиск по строке
 * @param {string} [bAllHier] - Искать всех руководителей вверх по иерархии
 * @param {bigint[]} [arrBossTypesID] - Типы руководителей
 * @param {oCollectionParam} oCollectionParams - Набор интерактивных параметров (отбор, сортировка, пейджинг)
 * @returns {WTMainPersonCollaboratorsResult}
*/
function customGetPersonCollaborators( iPersonID, sTypeCollaborator, iMaxCnt, bShowDismiss, sSearch, bAllHier, arrBossTypesID, oCollectionParams )
{
	
	LibMain = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/wtv/libs/main_library.js"));
	GetReadable = OpenCodeLib(FilePathToUrl(AppDirectoryPath() + "/wtv/libs/custom_libs/getReadable.js"));

	var oRes = tools.get_code_library_result_object();

	var oPaging = (DataType(oCollectionParams) == 'object' && ObjectType(oCollectionParams) == 'JsObject') ? oCollectionParams.GetOptProperty("paging", {SIZE: null, INDEX: 0}) : {SIZE: null, INDEX: 0};
	oRes.paging = oPaging;

	oRes.array = [];
	oRes.data={};

	var oResArray = new Array();
	var libParam = tools.get_params_code_library('libMain');
	if(!IsArray(arrBossTypesID))
	{
		arrBossTypesID = LibMain.getDefaultBossTypeIDs(libParam);
	}

	var arrDistinct = (DataType(oCollectionParams) == 'object' && ObjectType(oCollectionParams) == 'JsObject' && IsArray(oCollectionParams.GetOptProperty("distincts", null))) ? oCollectionParams.distincts : [];


	try
	{
		iPersonID = Int( iPersonID );
	}
	catch( ex )
	{
		oRes.error = 1;
		oRes.errorText = i18n.t( 'peredannekorre_3' );
		return oRes;
	}
	try
	{
		if( sTypeCollaborator == undefined || sTypeCollaborator == null || sTypeCollaborator == "" )
			throw "error";
	}
	catch( ex )
	{
		sTypeSubordinate = libParam.GetOptProperty("DefaultSubordinateType", "all_subordinates");
	}

	try
	{
		iMaxCnt = OptInt( iMaxCnt );
	}
	catch( ex )
	{
		iMaxCnt = undefined;
	}
	try
	{
		if( bAllHier == undefined || bAllHier == null || bAllHier == "" )
			throw "error";
		bAllHier = tools_web.is_true( bAllHier );
	}
	catch( ex )
	{
		bAllHier = false;
	}
	try
	{
		if( bShowDismiss == undefined || bShowDismiss == null || bShowDismiss == "" )
			throw "error";
		bShowDismiss = tools_web.is_true( bShowDismiss );
	}
	catch( ex )
	{
		bShowDismiss = false;
	}

	var arrCollaborators = []
	try
	{
		arrCollaborators = LibMain.get_user_collaborators( iPersonID, sTypeCollaborator, bShowDismiss, sSearch, bAllHier, arrBossTypesID, oCollectionParams );
	}
	catch(err)
	{
		oRes.error = 1;
		oRes.errorText = err;
		return oRes;
	}


	// формирование возврата distinct
	var bIsAjaxFilter = false;
	if(ArrayOptFirstElem(arrDistinct) != undefined)
	{
		oRes.data.SetProperty("distincts", {});
		bIsAjaxFilter = true;
		var xarrPositions, xarrSubdivision, xarrStatuses;
		for(sFieldName in arrDistinct)
		{
			oRes.data.distincts.SetProperty(sFieldName, []);
			switch(sFieldName)
			{
				case "f_sex":
				{
					oRes.data.distincts.f_sex = [
						{name:i18n.t( 'muzhskoy' ), value: "m"},
						{name:i18n.t( 'zhenskiy' ), value: "w"}
					];
					break;
				}
				case "f_tags":
				{
					oRes.data.distincts.f_tags = [
						{name: i18n.t( 'adaptaciya' ), value: "adaptation"},
						{name: i18n.t( 'oficialnyypree' ), value: "successor"},
						{name: i18n.t( 'rukovoditel' ), value: "boss"},
						{name: i18n.t( 'ekspert' ), value: "expert"},
						{name: i18n.t( 'nastavnik' ), value: "tutor"}
					];

					for(itemPersReserve in tools.xquery("for $elem in career_reserve_types return $elem"))
					{
						oRes.data.distincts.f_tags.push({name: "#" + itemPersReserve.name.Value, value: itemPersReserve.id.Value})
					}
					break;
				}
				case "f_status":
				{
					oRes.data.distincts.f_status = [{name: i18n.t( 'vsesotrudnikii' ), value: "all"}];
					// if(ArrayOptFind(arrCollaborators, "This.is_dismiss.Value == false && This.current_state.Value == ''") != undefined )
						oRes.data.distincts.f_status.push({name: i18n.t( 'rabotaet' ), value: "active"});
					// if(ArrayOptFind(arrCollaborators, "This.is_dismiss.Value == true") != undefined )
						oRes.data.distincts.f_status.push({name: i18n.t( 'uvolen' ), value: "is_dismiss"});

					//var arrSortCollaborators = ArraySort(arrCollaborators, "This.current_state.Value", "+")
					for(itemState in lists.person_states)
					{
						//if(ArrayOptFirstElem(ArraySelectBySortedKey(arrSortCollaborators, itemState.name.Value,  "current_state")) != undefined )
							oRes.data.distincts.f_status.push({name: itemState.name.Value, value: itemState.id.Value});
					}
					//arrSortCollaborators = undefined;
					break;
				}
			}
		}
	}

	if(ObjectType(oPaging) == 'JsObject' && oPaging.SIZE != null)
	{
		var oRetPage = select_page_sort_params(arrCollaborators, oPaging);
		oPaging = oRetPage.oPaging;
		arrCollaborators = oRetPage.oResult;
	}
	else if( OptInt(iMaxCnt) != undefined )
	{
		arrCollaborators = ArrayRange( arrCollaborators, 0, iMaxCnt );
	}

	var iHighEffectivenessLevel = libParam.GetOptProperty("DefaultHighEffectivenessLevel", 80);
	var iEffectivenessPeriod = libParam.GetOptProperty("EffectivenessPeriod", 365);

	var xarrAssessmentForms, xarrAssessmentForm;
	var fldCareerReserveType, arrTagElems;
	if( ArrayOptFirstElem( arrCollaborators ) != undefined )
	{
		var sMergePersonIds = ArrayMerge( arrCollaborators, "This.id", "," );
		var arrCareerReserves = ArraySelectAll(tools.xquery("for $elem_qc in career_reserves where MatchSome( $elem_qc/person_id, (" + sMergePersonIds + ") ) and $elem_qc/status='active' and $elem_qc/position_type='adaptation' order by $elem_qc/person_id return $elem_qc/Fields('id','person_id')"));
		var arrSuccessors = ArraySelectAll(tools.xquery("for $elem_qc in successors where MatchSome( $elem_qc/person_id, (" + sMergePersonIds + ") ) and $elem_qc/status='active' or $elem_qc/status='approved' order by $elem_qc/person_id return $elem_qc/Fields('id','person_id')"));
		var arrPersonReserves = ArraySelectAll(tools.xquery("for $elem_qc in personnel_reserves where MatchSome( $elem_qc/person_id, (" + sMergePersonIds + ") ) and $elem_qc/status='in_reserve' order by $elem_qc/person_id return $elem_qc/Fields('id','person_id','career_reserve_type_id')"));
		var arrFuncManagers = ArraySelectAll(tools.xquery("for $elem_qc in func_managers where MatchSome( $elem_qc/person_id, (" + sMergePersonIds + ") ) order by $elem_qc/person_id return $elem_qc/Fields('id','person_id')"));
		var arrExperts = ArraySelectAll(tools.xquery("for $elem_qc in experts where MatchSome( $elem_qc/person_id, (" + sMergePersonIds + ") ) order by $elem_qc/person_id return $elem_qc/Fields('id','person_id')"));
		var arrTutors = ArraySelectAll(tools.xquery("for $elem_qc in tutors where MatchSome( $elem_qc/person_id, (" + sMergePersonIds + ") ) order by $elem_qc/person_id return $elem_qc/Fields('id','person_id')"));
		var xarrAllAssessmentForms = ArraySelectAll(tools.xquery("for $elem_qc in pas where MatchSome( $elem_qc/person_id, (" + sMergePersonIds + ") ) and $elem_qc/assessment_appraise_type='activity_appraisal' and $elem_qc/is_done = true() and some $appr in assessment_appraises satisfies ($elem_qc/assessment_appraise_id = $appr/id and $appr/status = '1' and($appr/end_date > " + XQueryLiteral(DateOffset(Date(), (0-iEffectivenessPeriod)*86400)) + " or $appr/end_date = null())) order by $elem_qc/person_id ascending, $elem_qc/modification_date descending return $elem_qc/Fields('id','person_id','overall')"));
		
		var arrEfficiencyEstimations = new Array();
		var sMergeEfficiencyEstimationIds = ArrayMerge( ArraySelect( ArraySelectDistinct( arrCollaborators, "This.efficiency_estimation_id" ), "This.efficiency_estimation_id.HasValue" ), "XQueryLiteral( This.efficiency_estimation_id )", "," );
		if( sMergeEfficiencyEstimationIds != "" )
		{
			arrEfficiencyEstimations = ArraySelectAll(tools.xquery("for $elem_qc in efficiency_estimations where MatchSome( $elem_qc/id, (" + sMergeEfficiencyEstimationIds + ") ) order by $elem_qc/id return $elem_qc/Fields('id','name')"));
		}

		var sMergeDevelopmentPotentialIds = ArrayMerge( ArraySelect( ArraySelectDistinct( arrCollaborators, "This.development_potential_id" ), "This.development_potential_id.HasValue" ), "XQueryLiteral( This.development_potential_id )", "," );
		var arrDevelopmentPotentials = new Array();
		if( sMergeDevelopmentPotentialIds != "" )
		{
			arrDevelopmentPotentials = ArraySelectAll(tools.xquery("for $elem_qc in development_potentials where MatchSome( $elem_qc/id, (" + sMergeDevelopmentPotentialIds + ") ) order by $elem_qc/id return $elem_qc/Fields('id','name')"));
		}
		var catEfficiencyEstimation, catDevelopmentPotential;
		for( _col in arrCollaborators )
		{
			obj = ({});
			obj.id = _col.id.Value;
			obj.fullname = GetReadable.getReadableShortName(_col.fullname.Value);
			obj.position_name = GetReadable.getReadablePositionName(_col.id.Value);
			obj.link = LibMain.get_object_link( "collaborator", _col.id );
			obj.image_url = LibMain.get_object_image_url( _col );
			obj.email = tools.call_code_library_method("get_data_for_lpe", "convertEmailToLink", [_col.email.Value]);
			obj.phone = _col.mobile_phone.Value != "" ? _col.mobile_phone.Value : _col.phone.Value;
			obj.org_name = tools.call_code_library_method("get_data_for_lpe", "getPartnerName", [_col.id.Value]);
			obj.position_parent_name = GetReadable.getReadablePositionParentName(_col.id.Value);
			obj.birth_date = "";
			obj.age = "";

			// Стаж
			obj.hire_date = ( _col.hire_date.HasValue ) ? GetReadable.getReadableFullDate(_col.hire_date.Value) : "";
			obj.login = _col.login.Value;
			obj.expirience = "";
			obj.expirience_level = "-";
			if(obj.hire_date != "")
			{
				obj.expirience = (Year(Date())-Year(obj.hire_date))*12 + (Month(Date())-Month(obj.hire_date));
				if(obj.expirience > 36)
					obj.expirience_level = i18n.t( 'boleehlet' );
				else if(obj.expirience > 24)
					obj.expirience_level = i18n.t( 'boleedvuhlet' );
				else if(obj.expirience > 12)
					obj.expirience_level = i18n.t( 'boleegoda' );
				else
					obj.expirience_level = i18n.t( 'dogoda' );
			}
			
			// Пол
			obj.sex = "";
			switch(StrLowerCase(_col.sex.Value))
			{
				case "w":
					obj.sex = i18n.t( 'zhenskiy' );
					break;
				case "m":
					obj.sex = i18n.t( 'muzhskoy' );
					break;
			}

			// Возраст
			if(_col.birth_date.HasValue)
			{
				obj.age = Year(Date())-Year(_col.birth_date.Value);
				if(DateDiff(Date(), Date(Year(Date()), Month(_col.birth_date.Value), Day(_col.birth_date.Value))) < 0)
					obj.age -= 1;
				obj.birth_date = GetReadable.getReadableShortDate(_col.birth_date.Value);
			}

			// Статус
			obj.status = i18n.t( 'rabotaet' );
			obj.status_class = "green_color"
			if(_col.is_dismiss.Value)
			{
				obj.status = i18n.t( 'uvolen' );
				obj.status_class = "red_color"
			}
			else if(_col.current_state.Value != "")
			{
				obj.status = _col.current_state.Value;
				obj.status_class = ""
			}

			// Тэги
			arrTagElems = [];

			if(ArrayOptFindBySortedKey(arrCareerReserves, _col.id.Value, "person_id") != undefined)
				arrTagElems.push(i18n.t( 'adaptaciya' ));

			if(ArrayOptFindBySortedKey(arrSuccessors, _col.id.Value, "person_id") != undefined)
				arrTagElems.push(i18n.t( 'oficialnyypree' ));

			for(itemPersReserve in ArraySelectDistinct(ArraySelectBySortedKey(arrPersonReserves, _col.id.Value, "person_id"), "career_reserve_type_id"))
			{
				fldCareerReserveType = itemPersReserve.career_reserve_type_id.OptForeignElem;
				if(fldCareerReserveType == undefined)
					continue;
				arrTagElems.push("#" + fldCareerReserveType.name.Value)
			}

			if(ArrayOptFindBySortedKey(arrFuncManagers, _col.id.Value, "person_id") != undefined)
				arrTagElems.push(i18n.t( 'rukovoditel' ));

			if(ArrayOptFindBySortedKey(arrExperts, _col.id.Value, "person_id") != undefined)
				arrTagElems.push(i18n.t( 'ekspert' ));

			if(ArrayOptFindBySortedKey(arrExperts, _col.id.Value, "person_id") != undefined)
				arrTagElems.push(i18n.t( 'nastavnik' ));

			obj.tags = ArrayMerge(arrTagElems, "This", ", ");
			obj.f_tags = ArrayMerge(arrTagElems, "This", "|||");

			// эффективность

			xarrAssessmentForm = ArrayOptFindBySortedKey(xarrAllAssessmentForms, _col.id.Value, "person_id");
			if(xarrAssessmentForm != undefined)
			{
				obj.effectiveness = xarrAssessmentForm.overall;
				obj.effectiveness_str = StrInt(xarrAssessmentForm.overall) + "%";
			}
			else
			{
				obj.effectiveness = null;
				obj.effectiveness_str = "-";
			}

			// Оценка эффективности
			if( _col.efficiency_estimation_id.HasValue )
			{
				catEfficiencyEstimation = ArrayOptFindBySortedKey( arrEfficiencyEstimations, _col.efficiency_estimation_id.Value, "id");
				obj.efficiency_estimation_id = _col.efficiency_estimation_id.Value;
				obj.efficiency_estimation = ( catEfficiencyEstimation != undefined ? catEfficiencyEstimation.name.Value : "" );
			}
			else
			{
				obj.efficiency_estimation_id = null;
				obj.efficiency_estimation = "-";
			}
			// Оценка потенциала
			if( _col.development_potential_id.HasValue )
			{
				catDevelopmentPotential = ArrayOptFindBySortedKey( arrDevelopmentPotentials, _col.development_potential_id.Value, "id");
				obj.development_potential_id = _col.development_potential_id.Value;
				obj.development_potential = ( catDevelopmentPotential != undefined ? catDevelopmentPotential.name.Value : "" );
			}
			else
			{
				obj.development_potential_id = null;
				obj.development_potential = "-";

			}
			oRes.array.push( obj );
		}
	}
	arrCareerReserves = undefined;
	arrSuccessors = undefined;
	arrPersonReserves = undefined;
	arrFuncManagers = undefined;
	arrExperts = undefined;
	arrTutors = undefined;
	xarrAllAssessmentForms = undefined;
	arrDevelopmentPotentials = undefined;
	arrEfficiencyEstimations = undefined;
	
	return oRes;
}
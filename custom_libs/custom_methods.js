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
 * @author AZ
 * @param {string} [sDisplayFields] - Отображаемые поля
 * @param {boolean} bEmailAsLink - Если установлен, возвращать e-mail как <a href="mailto:...
 * @returns {ReturnEmployeePersonalData}
*/

function customGetEmployeePersonalData( iCurUserID, sDisplayFields, bEmailAsLink )
{
	oRes = new Object();
	oRes.error = 0;
	oRes.errorText = "";
	oRes.result = true;
	oRes.array = [];

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
	
			oRes.array.push( { id: teCollaborator.id.Value, name: 'login', title: ms_tools.get_const( 'uf_login' ), value: sValue } );
		}

		if ( ArrayOptFind( arrDisplayFields, "This == 'sex' " ) != undefined )
		{
			if ( tools_web.is_true( teCollaborator.disp_sex ) && teCollaborator.sex.HasValue )
				sValue = teCollaborator.sex.Value == 'm' ? i18n.t( 'muzhskoy_1' ) : i18n.t( 'zhenskiy_1' );
			else
				sValue = '';

			oRes.array.push( { id: teCollaborator.id.Value, name: 'sex', title: ms_tools.get_const( 'vpb_sex' ), value: sValue } );
		}

		if ( ArrayOptFind( arrDisplayFields, "This == 'birth_date' " ) != undefined )
		{
			if ( tools_web.is_true( teCollaborator.disp_birthdate ) && teCollaborator.birth_date.HasValue )
			{
				sValue = tools.call_code_library_method("get_readable", "getReadableShortDate", [teCollaborator.birth_date.Value]);
			}
			else
				sValue = '';

			oRes.array.push( { id: teCollaborator.id.Value, name: 'birth_date', title: ms_tools.get_const( 'vpb_birthday' ), value: sValue } );
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

			oRes.array.push( { id: teCollaborator.id.Value, name: 'work_address', title: i18n.t( 'rabochiyadres' ), value: sValue } );
		}

		if ( ArrayOptFind( arrDisplayFields, "This == 'email' " ) != undefined )
			oRes.array.push( { id: teCollaborator.id.Value, name: 'email', title: ms_tools.get_const( 'uf_email' ), value: '<a href="mailto:'+ StrLowerCase(teCollaborator.email.Value) +'">'+ StrLowerCase(teCollaborator.email.Value) +'</a>' } );

		if ( ArrayOptFind( arrDisplayFields, "This == 'phone' " ) != undefined )
			oRes.array.push( { id: teCollaborator.id.Value, name: 'phone', title: ms_tools.get_const( 'uf_phone' ), value: teCollaborator.phone.Value } );

		if ( ArrayOptFind( arrDisplayFields, "This == 'position_name' " ) != undefined )
			oRes.array.push( { id: teCollaborator.id.Value, name: 'position_name', title: ms_tools.get_const( 'c_position' ), value: teCollaborator.position_name.Value } );

		if ( ArrayOptFind( arrDisplayFields, "This == 'position_parent_name' " ) != undefined )
			oRes.array.push( { id: teCollaborator.id.Value, name: 'position_parent_name', title: ms_tools.get_const( 'c_subd' ), value: teCollaborator.position_parent_name.Value } );

		if ( ArrayOptFind( arrDisplayFields, "This == 'org_name' " ) != undefined )
			oRes.array.push( { id: teCollaborator.id.Value, name: 'org_name', title: ms_tools.get_const( 'c_org' ), value: tools.call_code_library_method("get_data_for_lpe", "getPartnerName", [teCollaborator.id.Value]) } );
	}
	catch( ex )
	{
		oRes.error = 1;
		oRes.errorText = i18n.t( 'peredannekorre_6' );
		return oRes;
	}

	return oRes
}

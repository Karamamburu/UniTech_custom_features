// _clear_list - признак очищения списка сотрудников перед добавлением сотрулников по условию. 
// Чтобы сотрудники добавлялись  к существующему списку небходимо установить _clear_list = false;
_clear_list = true;

dynamyc_groupArray = XQuery("for $elem in groups where $elem/is_dynamic=true() return $elem");

for( _group in dynamyc_groupArray )
{
	doc_group = OpenDoc( UrlFromDocID( _group.PrimaryKey ) );
	doc_group.TopElem.dynamic_select_person(_clear_list);
	doc_group.Save();
}

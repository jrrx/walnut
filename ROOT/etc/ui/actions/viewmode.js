({
	key  : 'viewmode',
	text : "i18n:obrowser.viewmode",
	type : "status",
	status : [{
		icon : '<i class="fa fa-th-large"></i>',
		val  : 'thumbnail'
	}, {
		icon : '<i class="fa fa-bars"></i>',
		val  : 'table'
	}],
	init : function(mi){
		var viewmode = this.browser.getViewMode();
		//console.log("viewmode init", mi, viewmode);
		mi.status.forEach(function(si){
			si.on = (si.val == viewmode);
		});
	}
})
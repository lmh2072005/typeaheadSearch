/*typeaheadSearch*/

;(function($){
	var Typeahead = $.fn.typeahead.Constructor;
	function TypeaheadSearch(element, options){
		Typeahead.call(this, element, options);
		this.hiddenEl = this.$element.parent().find('input[name="'+this.options.hiddenName+'"]');
		if(this.hiddenEl.length < 1){
			this.hiddenEl = $('<input type="hidden" name="'+this.options.hiddenName+'" />');
			this.$element.parent().append(this.hiddenEl);
		}
		if(this.options.readOnly){
			this.$element.attr('readonly','readonly');
		}
	}
	TypeaheadSearch.prototype = (function(){
		var f = function(){};
		f.prototype = Typeahead.prototype;
		return  new f();
	})();

	TypeaheadSearch.prototype.render = function(items){
		var that = this;

		items = $(items).map(function (i, item) {
			var dataID = item, dataVal = item;
			if(typeof item == 'object' && !(item instanceof Array)){
				dataID = item[that.options['keyName']];
				dataVal = item[that.options['valName']];
			}
			i = $(that.options.item).attr('data-value', dataVal).attr('data-key', dataID);
			i.find('a').html(that.highlighter(dataVal));
			return i[0];
		})
		var hasActive = false;
		items.find('a').each(function(k, v){
			if($(v).closest('li').data('value') == that.$element.val()){
				$(v).closest('li').addClass('active');
				hasActive = true;
			}
		});
		if(!hasActive){
			items.first().addClass('active');
		}
		this.$menu.html(items);
		return this;
	}
	TypeaheadSearch.prototype.process = function (items) {
		var that = this, newItems = items, isSimple = true;
		if(items instanceof Array && typeof items[0] == 'object'){
			isSimple = false;
			newItems = $.map(items, function (item, i) {
				return item[that.options['valName']];
			})
		}

		items = $.grep(items, function (item) {
			if(typeof item == 'object' && !(item instanceof Array)){
				item = item[that.options['valName']];
			}
			return that.matcher(item);
		})
		if(isSimple){
			items = this.sorter(items);
		}else{
			newItems = this.sorter(newItems);
		}

		if (!items.length) {
			return this.shown ? this.hide() : this;
		}

		return this.render(items.slice(0, this.options.items)).show();
	}

	TypeaheadSearch.prototype.select = function(){
		Typeahead.prototype.select.call(this);
		var val = this.$menu.find('.active').attr('data-key');
		this.hiddenEl.val(val);
		if(typeof this.options.change == 'function'){
			this.options.change(this);
		}
	}
	TypeaheadSearch.prototype.getValue = function(){
		return this.hiddenEl.val();
	}
	TypeaheadSearch.prototype.setValue = function(val){
		if(val === null || val === undefined || val === ''){
			this.hiddenEl.val('');
			this.$element.val('');
			this.options.change(this);
		}else{
			this.$menu.find('li[data-key="'+val+'"]').addClass('active').siblings().removeClass('active');
			this.select();
		}
	}
	TypeaheadSearch.prototype.loadData = function(data){
		this.query = this.$element.val();
		this.render(this.source = this.options.source = data);
		this.setValue('');
	}


	$.fn.typeaheadSearch = function(option){
		var opts  = {
			readOnly:false,
			source: [],//数据源
			remote:'',//远程数据源
			items: option.source && option.source.length || 8,//显示的项数
			keyName:'id',//下拉选择的key对应数据源的名字
			valName:'value',//下拉选择的value对应数据源的名字
			hiddenName:'hiddenID',//选择的值对应的hiddenID
			height:'auto',//下拉选项的高度
			change:function(ui){}//选择项变化时触发的事件
		}
		return $(this).each(function(){
			var $this = $(this),
				data = $this.data('typeaheadSearch'),
				options = typeof option == 'object' && option;
			options = $.extend({}, $.fn.typeahead.defaults, opts, options);
			var initFn = function(){
				$this.data('typeaheadSearch', (data = new TypeaheadSearch($this, options)))

				$this.parent().find('button').on('click', function(){
					data.query = $this.val();
					data.render(data.source).show();
					data.$menu.width($this.parent().width());
					if(!isNaN(parseFloat(data.options.height))){
						data.$menu.css({'height' : data.options.height, 'overflowY' : 'scroll'});
					}
					setTimeout(function(){$this.trigger('focus');},0);
				});

				if (typeof option == 'string') data[option]();

				if(document.documentMode && document.documentMode < 8){
					$this.parent().css({'position':'relative','z-index':'2'});
				}
			}
			if (!data){
				if(options.remote){
					$.get(options.remote, function(result){
						if(typeof result == 'string'){
							result = $.parseJSON(result);
						}
						options.source = result;
						initFn();
					})
				}else{
					initFn();
				}

			}else{
				if (typeof option == 'string') data[option]();
			}
		});
	};

})(window.jQuery);
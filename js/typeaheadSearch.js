;(function($){
    var Typeahead = $.fn.typeahead.Constructor;
    function TypeaheadSearch(element, options) {
        var self = this;
        Typeahead.call(this, element, options);
        this.hiddenEl = this.$element.parent().find('input[name="'+this.options.hiddenName+'"]');
        if(this.hiddenEl.length < 1){
            this.hiddenEl = $('<input type="hidden" name="'+this.options.hiddenName+'" />');
            this.$element.parent().append(this.hiddenEl);
        }
        if(this.options.readOnly){
            this.$element.attr('readonly','readonly');
        }
        this.$element.blur(function () {
            var isListVal = false, ele = $(this);
            $.each(self.options.source, function (k, v) {
                if (ele.val() === v[self.options.valName]) {
                    isListVal = true;
                    self.setValue(v[self.options.keyName]);
                    return false;
                }
            });
            if (!isListVal) {
                if (self.options.selectOnly) {
                    self.setValue('');
                } else {
                    self.hiddenEl.val('');
                }
            }
        });
        if (/AppleWebKit.*Mobile/i.test(navigator.userAgent) ||
            (/MIDP|SymbianOS|NOKIA|SAMSUNG|LG|NEC|TCL|Alcatel|BIRD|DBTEL|Dopod|PHILIPS|HAIER|LENOVO|MOT-|Nokia|SonyEricsson|SIE-|Amoi|ZTE/.test(navigator.userAgent))) {
            this.$element.on('input propertychange', function () {
                self.lookup();
            })
        }
        this.filterData = [];
    }
    TypeaheadSearch.prototype = (function(){
        var f = function(){};
        f.prototype = Typeahead.prototype;
        return  new f();
    })();

    TypeaheadSearch.prototype.render = function (items, isAll) {
        var that = this;
        if (isAll && this.allItems) { //渲染所有数据
            items = this.allItems;
        } else {
            items = $(items).map(function (i, item) {
                var dataID = item, dataVal = item;
                if (typeof item == 'object' && !(item instanceof Array)) {
                    dataID = item[that.options['keyName']];
                    dataVal = item[that.options['valName']];
                }
                i = $(that.options.item).attr('data-value', dataVal).attr('data-key', dataID);
                i.find('a').html(that.highlighter(dataVal));
                return i[0];
            })
            if (isAll) {
                this.allItems = items;
            }
        }
        var hasActive = false;
        if (that.$element.val() !== '') {
            items.each(function (k, v) {
                if ($(v).data('value') == that.$element.val()) {
                    $(v).addClass('active').siblings().removeClass('active');
                    hasActive = true;
                    return false;
                }
            });
        }
        if(!hasActive){
            items.first().addClass('active').siblings().removeClass('active');
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
        this.filterData = items;
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
    TypeaheadSearch.prototype.blur = function () {
        this.focused = false;
    }
    TypeaheadSearch.prototype.mouseleave = function () {
        this.mousedover = false;
    }
    TypeaheadSearch.prototype.lookup = function () {
        Typeahead.prototype.lookup.call(this);
        if (this.query === '' || this.filterData.length == 0) {
            this.hiddenEl.val('');
        }
    }
    TypeaheadSearch.prototype.show = function () {
        var pos = $.extend({}, this.$element.position(), {
            height: this.$element[0].offsetHeight
        });
        var menuTop = pos.top + pos.height;
        if (pos.top + pos.height + this.$menu.height() > $(window).innerHeight() + $(document).scrollTop()) {
            menuTop = pos.top - this.$menu.outerHeight(true);
        }
        this.$menu
          .insertAfter(this.$element)
          .css({
              top: menuTop
          , left: pos.left
          })
          .show()

        this.shown = true
        return this
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
            readOnly: false,//只读，不能输入
            selectOnly: false,//只能输入选择已经存在的
            showButton: true,//是否显示下拉按钮
            source: [],//数据源
            remote:'',//远程数据源
            items: option.source && option.source.length || 8,//显示的项数
            keyName:'id',//下拉选择的key对应数据源的名字
            valName:'value',//下拉选择的value对应数据源的名字
            hiddenName:'hiddenID',//选择的值对应的hiddenID
            height:'auto',//下拉选项的高度
            change: function (ui) { },//选择项变化时触发的事件
            afterInit: function (ui) { } //初始化后触发的事件
        }
        return $(this).each(function(){
            var $this = $(this),
                data = $this.data('typeaheadSearch'),
                options = typeof option == 'object' && option;
            options = $.extend({}, $.fn.typeahead.defaults, opts, options);
            var initFn = function(){
                $this.data('typeaheadSearch', (data = new TypeaheadSearch($this, options)))
                if (data.options.showButton) {
                    $this.parent().find('button').on('click', function () {
                        if (data.shown) {
                            return;
                        }
                        $('.typeaheadSearch .dropdown-menu').hide();//bootstrap dropdown已阻止冒泡
                        data.query = $this.val();
                        data.render(data.source, true).show();
                    });
                } else {
                    $this.parent().find('.btn-group').hide();
                    data.$element.css('border-radius', '4px');
                }
                
                $(document).on('click', function (e) {
                    var t = $(e.target)
                    if (!t.is(data.$menu) || !t.closest('.typeahead').is(data.$menu)) {
                        data.hide();
                    }
                })
                data.$menu.width($this.parent().width());
                if (!isNaN(parseFloat(data.options.height))) {
                    data.$menu.css({ 'height': data.options.height, 'overflowY': 'scroll' });
                }
                if (!isNaN(parseFloat(data.options.width))) {
                    data.$menu.css({ 'width': data.options.width });
                }

                if (typeof option == 'string') data[option]();

                if(document.documentMode && document.documentMode < 8){
                    $this.parent().css({'position':'relative','z-index':'2'});
                }
                if (typeof options.afterInit == 'function') {
                    options.afterInit(data);
                }
            }
            if (!data){
                if (options.source && options.source.length > 1) {
                    initFn();
                } else if (options.remote) {
                    $.get(options.remote, function (result) {
                        if (typeof result == 'string') {
                            result = $.parseJSON(result);
                        }
                        options.source = result;
                        if (!option.items) {
                            options.items = result.length;
                        }
                        initFn();
                    })
                }

            }else{
                if (typeof option == 'string') data[option]();
            }
        });
    };

})(window.jQuery);
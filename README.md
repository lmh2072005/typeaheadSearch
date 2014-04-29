typeaheadSearch
===============
js基于bootstrap typeahead插件 ，带下拉框和输入过滤

html 使用bootstrap form 基本元素样式

html结构:

    <div class="input-append typeaheadSearch">
    <input class="span2" type="text" id="autoComplete" autocomplete="off">
    <div class="btn-group">
        <button class="btn dropdown-toggle" data-toggle="dropdown">
            <span class="caret"></span>
        </button>
    </div>
</div>

调用：

    $('#autoComplete').typeaheadSearch({
            source:[{"Name":"长沙市","Id":1},{"Name":"衡阳市","Id":2},{"Name":"株洲市","Id":3}],
            keyName:'Id',
            valName:'Name',
            hiddenName:'area',
            change : function(ui){ $('#showID').html(ui.getValue());}
        });
        
        
TypeaheadSearch

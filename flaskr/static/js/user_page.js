// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
Date.prototype.Format = function(fmt){
    var o = {
      "M+": this.getMonth() + 1, //月份
      "d+": this.getDate(), //日
      "h+": this.getHours(), //小时
      "m+": this.getMinutes(), //分
    };

    if (/(y+)/.test(fmt)){
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }

    for (var k in o){
        if (new RegExp("(" + k + ")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }

    return fmt;
}

//判断是否是正整数
function isPositiveInteger(s){
    var re = /^[1-9]\d{0,7}$/;
    return re.test(s)
}

//判断是否是整数，包括小数点结尾形式
function isPositiveDecimal(s){
    var re = /^[1-9]\d{0,7}(\.\d{0,2})?$|^0\.\d{0,2}$/;
    return re.test(s)
}

$(function(){
    // 标题栏列表
    $('#detail-btn').on('click', function(){
        $('.tpl-left-nav').toggle();
    });

    //全屏模式
    var $fullText = $('.admin-fullText');
    $('#admin-fullscreen').on('click', function(){
        $.AMUI.fullscreen.toggle();
    });

    $(document).on($.AMUI.fullscreen.raw.fullscreenchange, function(){
        $fullText.text($.AMUI.fullscreen.isFullscreen ? '退出全屏' : '开启全屏');
    });

    //注销账户
    $("#delete-account").click(function(){
        $('#delete-account-confirm').modal({
            relatedTarget: this,
            width: 300,
            onConfirm: function(){
                $.post("/",
                       {"delete-account": ""},
                       function(){
                           window.location.reload();
                       });
            }
        });
    });

    //提交客户
    $("#add-detail").click(function(){
        $('#add-detail-modal').modal({
            relatedTarget: this,
            width: 250,
            onConfirm: function(){
                detailName = $('#add-detail-name').val();
                if(detailName === ''){
                    alert('客户名不能为空！')
                } else{
                    $.post("/",
                           {"add-detail": detailName},
                           function(data){
                               if(data != ""){
                                   alert(`客户【${data}】已存在！`);
                                   $('#add-detail-name').val('');
                               } else{
                                    window.location.reload();
                               }
                           });
                }
            },
            onCancel: function(){
                $('#add-detail-name').val('');
            }
        });
    });

    //修改客户名
    $("#modify-detail").click(function(){
        $('#modify-detail-modal').modal({
            relatedTarget: this,
            width: 300,
            onConfirm: function(){
                newName = $('#modify-detail-name').val();
                if(newName === ''){
                    alert('客户名不能为空！')
                } else{
                    $.post("/",
                           {"modify-detail": newName},
                           function(data){
                               if(data != ""){
                                   alert(`客户【${data}】已存在！`);
                                   $('#modify-detail-name').val('');
                               } else{
                                    window.location.reload();
                               }
                           });
                }
            },
            onCancel: function(){
                $('#modify-detail-name').val('');
            }
        });
    });

    //删除当前客户
    $("#delete-detail").click(function(){
        $('#delete-detail-confirm').modal({
            relatedTarget: this,
            width: 300,
            onConfirm: function(){
                $.post("/",
                       {"delete-detail": ""},
                       function(){
                           window.location.reload();
                       });
            }
        });
    });

    //客户列表
    $('.nav-link').on('click', function(){
        $.post("/",
               {"detail-name": $(this).attr('data-detail-name')},
               function(){
                   window.location.reload();
               });
    });

    //section选择
    $('select').change(function(){
        $.post("/",
               {"section-id": $(this).val()},
               function(){
                   window.location.reload();
               });
    });

    //转发账单
    var share_address = "";
    $('#share-btn').click(function(){
        $.post("/",
               {"share": ""},
               function(data){
                   share_address = data;
                   $('#share-modal').modal({
                       relatedTarget: this,
                       width: 300
                   });
               });
    });

    $('#share-modal').on('open.modal.amui', function(){
        $('#share-qrcode').empty().qrcode(share_address);
    });

    $('#share-modal').on('close.modal.amui', function(){
        share_address = "";
    });

    //客户列表为空时，禁用表格相关按钮
    if(!$('#current_detail').attr('data-detail-name')){
        $('.table-btn').attr('disabled', true);
    }

    //表格配置
    var table = $('#table').DataTable({
        "info": false,
        "lengthChange": false,
        "ordering": false,
        "paging": false,
        "searching": false,

        "language":{
            "sEmptyTable": "快来记一笔吧~",
        }
    });

    //datetimepicker配置
    $('body').on('click', '#date-time', function(){
        $(this).datetimepicker({
            format: 'yyyy-mm-dd hh:ii',
            weekStart: 1,
            autoclose: true,
            todayBtn: true,
            todayHighlight: true,
            minuteStep: 1,
            language:  'zh-CN'
        });

        $(this).datetimepicker('show');
    });

    //datetimepicker语言配置
    $.fn.datetimepicker.dates['zh-CN'] = {
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
        daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        today: "今天",
        suffix: [],
        meridiem: ["上午", "下午"],
    };

    //点击发货按钮
    $('#send-btn').on('click', function(){
        var dateTime = (new Date()).Format("yyyy-MM-dd hh:mm")

        $("#table-body").prepend(
            `<tr class='am-success' id='edit-tr'>
                <td>
                    <input type='text' id='date-time' name='date-time' value='${dateTime}' form='table-form' style='width:134px' readonly required/>
                </td>
                <td>
                    <input type='text' name='product-id' placeholder='请输入' form='table-form' style='width:100px' required/>
                </td>
                <td>
                    <input type='text' id='price' name='price' placeholder='0.00' form='table-form' style='width:100px' required/>
                </td>
                <td>
                    <input type='text' id='quantity' name='quantity' placeholder='0' form='table-form' style='width:100px' required/>
                </td>
                <td>
                    <input type='text' id='total' name='total' placeholder='0.00'' form='table-form' style='width:100px' required/>
                </td>
                <td>
                    <input type='text' name='remark' placeholder='选填' form='table-form' style='width:100px'/>
                </td>
                <td>
                    <button class='am-btn am-btn-link am-btn-sm am-text-success' title='保存' type='submit' form='table-form'>
                        <span class='am-icon-check-square-o'></span>
                    </button>|
                    <button class='am-btn am-btn-link am-btn-sm am-text-warning' id='add-cancel' title='取消' type='button'>
                        <span class='am-icon-times-circle-o'></span>
                    </button>
                </td>
            </tr>`
        );

        $('.table-btn').attr('disabled', true);
    });

    //点击退货按钮
    $('#back-btn').on('click', function(){
        var dateTime = (new Date()).Format("yyyy-MM-dd hh:mm")

        $("#table-body").prepend(
            `<tr class='am-danger' id='edit-tr'>
                <td>
                    <input type='text' id='date-time' name='date-time' value='${dateTime}' form='table-form' style='width:134px' readonly required/>
                </td>
                <td>
                    <input type='text' name='product-id' placeholder='请输入' form='table-form' style='width:100px' required/>
                </td>
                <td>
                    <input type='text' id='price' name='price' placeholder='0.00' form='table-form' style='width:100px' required/>
                </td>
                <td>
                    <div style='width: 112px'>
                        <label style='font-size: 18px'>-</label>
                        <input type='text' id='quantity' name='quantity' placeholder='0' form='table-form' style='width:100px' required/>
                    </div>
                </td>
                <td>
                    <div style='width: 112px'>
                        <label style='font-size: 18px'>-</label>
                        <input type='text' id='total' name='total' placeholder='0.00'' form='table-form' style='width:100px' required/>
                    </div>
                </td>
                <td>
                    <input type='text' id='remark' name='remark' placeholder='选填' form='table-form' style='width:100px'/>
                </td>
                <td>
                    <button class='am-btn am-btn-link am-btn-sm am-text-success' title='保存' type='submit' form='table-form'>
                        <span class='am-icon-check-square-o'></span>
                    </button>|
                    <button class='am-btn am-btn-link am-btn-sm am-text-warning' id='add-cancel' title='取消' type='button'>
                        <span class='am-icon-times-circle-o'></span>
                    </button>
                </td>
            </tr>`
        );

        $('#account-type').val('back');
        $('.table-btn').attr('disabled', true);
    });

    //点击结账按钮
    $('#settle-btn').on('click', function(){
        var dateTime = (new Date()).Format("yyyy-MM-dd hh:mm")

        $("#table-body").prepend(
            `<tr class='am-primary' id='edit-tr'>
                <td>
                    <input type='text' id='date-time' name='date-time' value='${dateTime}' form='table-form' style='width:134px' readonly required/>
                </td>
                <td>
                    结账<input type='text' id='product-id' name='product-id' value='结账' form='table-form' hidden='hidden'/>
                </td>
                <td>
                    —<input type='text' name='price' value='—' form='table-form' hidden='hidden'/>
                </td>
                <td>
                    —<input type='text' name='quantity' value='—' form='table-form' hidden='hidden'/>
                </td>
                <td>
                    <div style='width: 112px'>
                        <label style='font-size: 18px'>-</label>
                        <input type='text' id='total' name='total' placeholder='0.00'' form='table-form' style='width:100px' required/>
                    </div>
                </td>
                <td>
                    <input type='text' name='remark' placeholder='选填' form='table-form' style='width:100px'/>
                </td>
                <td>
                    <button class='am-btn am-btn-link am-btn-sm am-text-success' id='settle-save' title='保存' type='button'>
                        <span class='am-icon-check-square-o'></span>
                    </button>|
                    <button class='am-btn am-btn-link am-btn-sm am-text-warning' id='add-cancel' title='取消' type='button'>
                        <span class='am-icon-times-circle-o'></span>
                    </button>
                </td>
            </tr>`
        );

        $('#account-type').val('settle');
        $('.table-btn').attr('disabled', true);
    });

    //点击结账保存按钮
    $('body').on('click','#settle-save',function(){
        if($('#total').val().length === 0){
            return
        } else {
            $('#clear-confirm').modal({
                relatedTarget: this,
                width: 500,
                onConfirm: function(){
                    $('#product-id').val('结账（结清）');
                    $('#is-clear').val('true');
                    $('#table-form').submit();
                },
                onCancel: function(){
                    $('#table-form').submit();
                }
            });
        }
    });

    //数量input监听
    quantityLength = 0; //全局
    $('body').on('input propertychange', '#quantity', function(){
        var val = $(this).val();

        if (isPositiveInteger(val) || val === ""){
                quantityLength = val.length;
        } else{
            $(this).val(val.slice(0, quantityLength));
        }

        val = $(this).val();
        var priceVal = $('#price').val();

        if (isPositiveDecimal(priceVal) && isPositiveInteger(val)){
            var total = Number(priceVal) * Number(val);
            $('#total').val(total.toString());
        } else{
            $('#total').val('');
        }
    });

    //价格input监听
    priceLength = 0;
    $('body').on('input propertychange', '#price', function(){
        var val = $(this).val();

        if (val[0] === '0' && val[1] != '.'){
            $(this).val('0');
        } else if(isPositiveDecimal(val) || val === ""){
            priceLength = val.length;
        } else{
            $(this).val(val.slice(0, priceLength));
        }

        val = $(this).val();
        var quantityVal = $('#quantity').val();

        if (isPositiveDecimal(val) && isPositiveInteger(quantityVal)){
            if (val[val.length-1] === '.' ){
                val = val.slice(0, length-1);
            }

            var total = Number(val) * Number(quantityVal);
            $('#total').val(total.toString());
        } else{
            $('#total').val('');
        }
    });

    //总价input监听
    totalLength = 0;
    $('body').on('input propertychange', '#total', function(){
        var val = $(this).val();

        if (val[0] === '0' && val[1] != '.'){
            $(this).val('0');
        } else if(isPositiveDecimal(val) || val === ""){
            totalLength = val.length;
        } else{
            $(this).val(val.slice(0, totalLength));
        }
    });

    //金额input移除焦点时，如果结尾是小数点则删除小数点
    $('body').on('blur', '#price, #total', function(){
        var val = $(this).val();
        var length = val.length;

        if (val[length-1] === '.'){
            $(this).val(val.slice(0, length-1));
            val = $(this).val();
        }

        if (Number(val) === 0){
            $(this).val('');
        }
    });

    //点击add取消按钮
    $('body').on('click','#add-cancel',function(){
        $('#edit-tr').remove();
        $('.table-btn').attr('disabled', false);
    });

    //点击modify取消按钮
    $('body').on('click','#edit-cancel',function(){
        window.location.reload();
    });

    //点击编辑按钮
    $('body').on('click','#edit-btn',function(){
        var tr=$(this).parents('tr');
        var tds=tr.children();

        $.each(tds, function(i,val){
            var td=$(val);

            switch (i){
                case 0://时间
                    td.html(`<input type='text' id='date-time' name='date-time' value='${td.text()}' form='table-form' style='width:134px' readonly required/>`);
                    break;
                case 1://货号
                    if (tr.hasClass('am-success')||tr.hasClass('am-danger')){
                        td.html(`<input type='text' name='product-id' value='${td.text()}' form='table-form' style='width:100px' required/>`);
                    }
                    break;
                case 2://单价
                    if (tr.hasClass('am-success')||tr.hasClass('am-danger')){
                        td.html(`<input type='text' id='price' name='price' value='${td.text()}' form='table-form' style='width:100px' required/>`);
                    }
                    break;
                case 3://数量
                    if(tr.hasClass('am-success')){
                        td.html(`<input type='text' id='quantity' name='quantity' value='${td.text()}' form='table-form' style='width:100px' required/>`);
                    } else if(tr.hasClass('am-danger')){
                        var text=td.text();
                        var num=text.slice(1,text.length);
                        td.html(`<div style='width: 112px'>
                                     <label style='font-size: 18px'>-</label>
                                     <input type='text' id='quantity' name='quantity' value='${num}' form='table-form' style='width:100px' required/>
                                 </div>`);
                        $('#account-type').val('back');
                    } else{
                        $('#account-type').val('settle');
                    }
                    break;
                case 4://总价
                    if(tr.hasClass('am-success')){
                        td.html(`<input type='text' id='total' name='total'  value='${td.text()}' form='table-form' style='width:100px' required/>`);
                    } else{
                        var text=td.text();
                        var num=text.slice(1,text.length);
                        td.html(`<div style='width: 112px'>
                                     <label style='font-size: 18px'>-</label>
                                     <input type='text' id='total' name='total' value='${num}' form='table-form' style='width:100px' required/>
                                 </div>`);
                    }
                    break;
                case 5://备注
                    td.html(`<input type='text' name='remark' value='${td.text()}' form='table-form' style='width:100px'/>`);
                    break;
                case 6://操作
                    td.html(`<button class='am-btn am-btn-link am-btn-sm am-text-success' title='保存' type='submit' form='table-form'>
                                 <span class='am-icon-check-square-o'></span>
                             </button>|
                             <button class='am-btn am-btn-link am-btn-sm am-text-warning' id='edit-cancel' title='取消' type='button'>
                                 <span class='am-icon-times-circle-o'></span>
                             </button>`);
                    break;
            };
        });

        $('#operation').val('modify');
        $('#statement-id').val(tr.attr('data-id'));
        $('.table-btn').attr('disabled', true);
    });

    //点击删除按钮
    $('body').on('click','#delete-btn',function(){
        var tr=$(this).parents('tr');

        var tds=tr.children();
        var str=[`<tr class='${tr.attr('class')}'>`];
        $.each(tds, function(i,val){
            if(i<6){
                var td=$(val);
                str.push(`<td>${td.text()}</td>`);
            }
        });
        str.push(`</tr>`);
        $('#delete-body').prepend(str.join('\n'));

        $('#delete-confirm').modal({
            relatedTarget: this,
            onConfirm: function(){
                $('#operation').val('delete');
                $('#statement-id').val($(this.relatedTarget).parents('tr').attr('data-id'));
                $('#table-form').submit();
            },
            onCancel: function(){
                $('#delete-body').empty();
            }
        });
    });
})

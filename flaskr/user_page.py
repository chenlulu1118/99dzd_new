from flask import (
    Blueprint, session, g, redirect, render_template, request, url_for
)
from werkzeug.exceptions import abort
from decimal import Decimal

from flaskr.db import get_db
from flaskr.account import login_required

import time
import hashlib

bp = Blueprint('bp_user_page', __name__)


@bp.route('/', methods=('GET', 'POST'))
@login_required
def user_page():
    db = get_db()
    details = db.execute(
        'SELECT name FROM detail WHERE master_id = ? ORDER BY update_time DESC', (g.user['account_id'],)
    ).fetchall()

    section_infos = []
    statements = []    #没有结清的账单，section_id最大
    sum = Decimal('0')    #首页合计

    if details:
        #初始显示第一个分支
        if session['current_detail'] == '':
            detail_first = details[0]
            session['current_detail'] = detail_first['name']

        detail_id = g.user['account_id'] + session['current_detail']

        #首页显示section_id最大的数据
        section_infos = db.execute(
            'SELECT section_id, clear_date FROM section_info WHERE detail_id = ? ORDER BY section_id DESC',
            (detail_id,)
        ).fetchall()

        if session['current_section'] == -1:
            section_info_max = section_infos[0]
            session['current_section'] = section_info_max['section_id']

        statements = db.execute(
            'SELECT * FROM statement WHERE section_id = ? and detail_id = ? ORDER BY date_time DESC, statement_id DESC', (session['current_section'], detail_id)
        ).fetchall()

        #计算首页合计
        for statement in statements:
            if statement['account_type'] == 'send':
                sum = sum + Decimal(statement['total'])
            else:
                sum = sum - Decimal(statement['total'])

    if request.method == 'POST':
        print(request.form)
        #注销账户
        if 'delete-account' in request.form:
            db = get_db()

            db.execute('PRAGMA foreign_keys = ON')
            db.execute(
                'DELETE FROM master WHERE account_id = ?', (g.user['account_id'],)
            )
            db.commit()

            return redirect(url_for('bp_account.login'))

        #添加分支
        if 'add-detail' in request.form:
            detail_name = request.form['add-detail']
            detail_id = g.user['account_id'] + detail_name
            error = ''

            if is_exist(detail_id,):
                error = detail_name
            else:
                db = get_db()
                db.execute(
                    'INSERT INTO detail (account_id, name, update_time, master_id) VALUES (?, ?, ?, ?)',
                    (detail_id, detail_name, time.time(), g.user['account_id'])
                )
                db.execute(
                    'INSERT INTO section_info (section_id, clear_date, detail_id) VALUES (?, ?, ?)', (0, '未结清', detail_id)
                )
                db.commit()
                session['current_detail'] = detail_name
                session['current_section'] = -1

            return error
        #修改分支
        if 'modify-detail' in request.form:
            new_name = request.form['modify-detail']
            new_detail_id = g.user['account_id'] + new_name
            error = ''

            if is_exist(new_detail_id,):
                error = new_name
            else:
                old_detail_id = g.user['account_id'] + session['current_detail']
                db = get_db()
                print(old_detail_id)

                db.execute('PRAGMA foreign_keys = ON')
                db.execute(
                    'UPDATE detail set account_id = ?, name = ? where account_id = ?',
                    (new_detail_id, new_name, old_detail_id)
                )
                db.commit()

                session['current_detail'] = new_name

            return error


        #删除分支
        if 'delete-detail' in request.form:
            detail_name = session['current_detail']
            detail_id = g.user['account_id'] + detail_name
            db = get_db()

            db.execute('PRAGMA foreign_keys = ON')
            db.execute(
                'DELETE FROM detail WHERE account_id = ?', (detail_id,)
            )
            db.commit()

            session['current_detail'] = ''
            session['current_section'] = -1

            return detail_name

        #选择分支
        if 'detail-name' in request.form:
            detail_name = request.form['detail-name']
            session['current_detail'] = detail_name
            session['current_section'] = -1
            return detail_name

        #选择section
        if 'section-id' in request.form:
            session['current_section'] = int(request.form['section-id'])
            return request.form['section-id']

        #转发账单
        if 'share' in request.form:
            now = time.time()
            deadline = time.strftime('%Y-%m-%d %H:%M', time.localtime(now + 48*60*60))    #分享页面有效期为48小时
            md5 = hashlib.md5()
            md5.update(str(now).encode('utf-8'))
            address = md5.hexdigest()
            db = get_db()

            db.execute(
                'INSERT INTO share_page (address, deadline, sum) VALUES (?, ?, ?)', (address, deadline, str(sum))
            )

            for statement in statements:
                db.execute(
                    'INSERT INTO share_statement (date_time, product_id, price, quantity, total, remark, account_type, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    (statement['date_time'], statement['product_id'], statement['price'], statement['quantity'], statement['total'], statement['remark'], statement['account_type'], address)
                )

            db.commit()

            return 'http://106.14.175.12/share/' + address

        #添加账单
        if 'operation' in request.form:
            operation = request.form['operation']

            if operation == 'add':
                data = {'date_time': request.form['date-time'],
                        'product_id': request.form['product-id'],
                        'price': request.form['price'],
                        'quantity': request.form['quantity'],
                        'total': request.form['total'],
                        'remark': request.form['remark'],
                        'account_type': request.form['account-type'],
                        'is_clear': request.form['is-clear'],
                        'detail_id': g.user['account_id'] + session['current_detail']}
                add_statement(data,)
            elif operation == 'delete':
                statement_id = request.form['statement-id']
                delete_statement(statement_id,)
            elif operation == 'modify':
                data = {'date_time': request.form['date-time'],
                        'product_id': None,
                        'price': None,
                        'quantity': None,
                        'total': request.form['total'],
                        'remark': request.form['remark'],
                        'account_type': request.form['account-type'],
                        'statement_id': request.form['statement-id']}
                if data['account_type'] == 'send' or data['account_type'] == 'back':
                    data['product_id'] = request.form['product-id']
                    data['price'] = request.form['price']
                    data['quantity'] = request.form['quantity']
                modify_statement(data,)

            return redirect(url_for('user_page'))

    datas = {'current_detail': session['current_detail'],
             'current_section': session['current_section'],
             'sum': sum}

    return render_template('user_page.html', details = details,
                                        section_infos = section_infos,
                                        statements = statements,
                                        datas = datas)

#添加账目
def add_statement(data):
    date_time = data['date_time']
    product_id = data['product_id']
    price = data['price']
    quantity = data['quantity']
    total = data['total']
    remark = data['remark']
    account_type = data['account_type']
    is_clear = data['is_clear']
    detail_id = data['detail_id']
    db = get_db()

    #取出该分支的所有结清账单
    clear_statements = db.execute(
        'SELECT date_time, section_id FROM statement WHERE is_clear = ? and detail_id = ? ORDER BY date_time DESC, statement_id DESC',
        ('true', detail_id)
    ).fetchall()
    section_id = 0

    if clear_statements:
        #如果时间晚于结清账单时间，则section_id=结清账单section_id+1;如果不大于最后一个结账清单，则section_id还是=0
        for clear_statement in clear_statements:
            if date_time > clear_statement['date_time']:
                section_id = clear_statement['section_id'] + 1
                break

    db.execute(
        'INSERT INTO statement (date_time, product_id, price, quantity, total, remark, account_type, is_clear, section_id, detail_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        (date_time, product_id, price, quantity, total, remark, account_type, is_clear, section_id, detail_id)
    )
    db.execute(
        'UPDATE detail set update_time = ? where account_id = ?', (time.time(), detail_id)
    )
    db.commit()

    #如果是结清账单，所有晚于此结清账单时间的section_id+1
    if is_clear == 'true':
        statements = db.execute(
            'SELECT statement_id, section_id FROM statement WHERE date_time > ? and detail_id = ?', (date_time, detail_id)
        ).fetchall()

        for statement in statements:
            db.execute(
                'UPDATE statement set section_id = ? where statement_id = ?',
                (statement['section_id'] + 1, statement['statement_id'])
            )
            db.commit()

        #记录section_info
        new_date = date_time[:4] + '年' + date_time[5:7] + '月' + date_time[8:10] + '日'
        section_infos = db.execute(
            'SELECT * FROM section_info WHERE section_id >= ? and detail_id = ? ORDER BY section_id ASC',
            (section_id, detail_id)
        ).fetchall()
        pre_date = ''    #前一个日期
        is_min = True    #是否是第一个section_info

        #结清账单在中间,clear_date从此section_id开始向后平移一个
        for section_info in section_infos:
            if is_min:
                is_min = False
            else:
                new_date = pre_date

            pre_date = section_info['clear_date']
            db.execute(
                'UPDATE section_info set clear_date = ? where section_id = ? and detail_id = ?',
                (new_date, section_id, detail_id)
            )
            db.commit()
            section_id = section_id + 1

        db.execute(
            'INSERT INTO section_info (section_id, clear_date, detail_id) VALUES (?, ?, ?)',
            (section_id, pre_date, detail_id)
        )
        db.commit()
        session['current_section'] = -1

    return

#删除账目
def delete_statement(statement_id):
    db = get_db()
    old_statement = db.execute(
        'SELECT date_time, is_clear, section_id, detail_id FROM statement WHERE statement_id = ?', (statement_id,)
    ).fetchone()
    detail_id = old_statement['detail_id']

    db.execute(
        'DELETE FROM statement WHERE statement_id = ?', (statement_id,)
    )
    db.commit()

    #如果是结清账单，所有晚于此结清账单时间的section_id-1
    if old_statement['is_clear'] == 'true':
        statements = db.execute(
            'SELECT statement_id, section_id FROM statement WHERE date_time > ? and detail_id = ?',
            (old_statement['date_time'], detail_id)
        ).fetchall()

        for statement in statements:
            db.execute(
                'UPDATE statement set section_id = ? where statement_id = ?',
                (statement['section_id'] - 1, statement['statement_id'])
            )
            db.commit()

        #修改section_info
        section_id = old_statement['section_id']
        section_infos = db.execute(
            'SELECT * FROM section_info WHERE section_id > ? and detail_id = ? ORDER BY section_id ASC', (section_id, detail_id)
        ).fetchall()

        for section_info in section_infos:
            #更新前一条的clear_date为自己的
            db.execute(
                'UPDATE section_info set clear_date = ? where section_id = ? and detail_id = ?',
                (section_info['clear_date'], section_id, detail_id)
            )
            db.commit()
            section_id = section_id + 1

        #删除最后一条
        db.execute(
            'DELETE FROM section_info WHERE section_id = ? and detail_id = ?', (section_id, detail_id)
        )
        db.commit()
        session['current_section'] = -1

    return

#修改账目
def modify_statement(data):
    date_time = data['date_time']
    product_id = data['product_id']
    price = data['price']
    quantity = data['quantity']
    total = data['total']
    remark = data['remark']
    account_type = data['account_type']
    statement_id = data['statement_id']
    db = get_db()

    old_statement = db.execute(
        'SELECT date_time, product_id, price, quantity, is_clear, detail_id FROM statement WHERE statement_id = ?',
        (statement_id,)
    ).fetchone()
    is_clear = old_statement['is_clear']
    detail_id = old_statement['detail_id']

    #如果时间没变，直接修改
    if date_time == old_statement['date_time']:
        if account_type == 'settle':
            db.execute(
                'UPDATE statement set total = ?, remark = ? where statement_id = ?', (total, remark, statement_id)
            )
        else:
            db.execute(
                'UPDATE statement set product_id = ?, price = ?, quantity = ?, total = ?, remark = ? where statement_id = ?',
                (product_id, price, quantity, total, remark, statement_id)
            )
        db.execute(
            'UPDATE detail set update_time = ? where account_id = ?', (time.time(), detail_id)
        )
        db.commit()
    #如果时间变了，先删除旧条目再添加新条目
    else:
        delete_statement(statement_id,)

        if account_type == 'settle':
            product_id = old_statement['product_id']
            price = old_statement['price']
            quantity = old_statement['quantity']

        new_data = {'date_time': date_time,
                    'product_id': product_id,
                    'price': price,
                    'quantity': quantity,
                    'total': total,
                    'remark': remark,
                    'account_type': account_type,
                    'is_clear': is_clear,
                    'detail_id': detail_id}

        add_statement(new_data,)

    return

#判断分支是否存在
def is_exist(detail_id):
    db = get_db()

    if db.execute('SELECT name FROM detail WHERE account_id = ?', (detail_id,)).fetchone() is not None:
        return True
    else:
        return False

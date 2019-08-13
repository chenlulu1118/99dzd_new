#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import time

#连接SQLite数据库,如果文件不存在，会自动在当前目录创建:
con = sqlite3.connect('/home/admin/99dzd/instance/flaskr.sqlite', detect_types=sqlite3.PARSE_DECLTYPES)
con.row_factory = sqlite3.Row
cursor = con.cursor()

now = time.strftime('%Y-%m-%d %H:%M', time.localtime(time.time()))
share_pages = cursor.execute('select address from share_page where deadline < ?', (now,)).fetchall()

cursor.execute('PRAGMA foreign_keys = ON')
for share_page in share_pages:
    cursor.execute('DELETE FROM share_page WHERE address = ?', (share_page['address'],))

cursor.close()
con.commit()
con.close()
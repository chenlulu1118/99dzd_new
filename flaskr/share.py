from flask import (
    Blueprint, render_template
)

from flaskr.db import get_db

bp = Blueprint('bp_share', __name__)

@bp.route('/share/<address>', methods=('GET', 'POST'))
def share(address):
    db = get_db()
    share_page = db.execute(
        'SELECT deadline, sum FROM share_page WHERE address = ?', (address,)
    ).fetchone()

    if share_page is None:
        return render_template('share_overdue.html')
    else:
        statements = db.execute(
            'SELECT * FROM share_statement WHERE address = ?', (address,)
        ).fetchall()
        return render_template('share.html', deadline = share_page['deadline'], sum = share_page['sum'], statements = statements)
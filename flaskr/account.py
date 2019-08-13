import functools

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)
from werkzeug.security import check_password_hash, generate_password_hash

from flaskr.db import get_db

bp = Blueprint('bp_account', __name__, url_prefix='/account')


def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for('bp_account.login'))

        return view(**kwargs)

    return wrapped_view


@bp.before_app_request
def load_logged_in_user():
    account_id = session.get('master_id')

    if account_id is None:
        g.user = None
    else:
        g.user = get_db().execute(
            'SELECT * FROM master WHERE account_id = ?', (account_id,)
        ).fetchone()


@bp.route('/register', methods=('GET', 'POST'))
def register():
    if request.method == 'POST':
        account_id = request.form['account_id']
        password = request.form['password']
        db = get_db()
        error = None

        if not account_id:
            error = 'Account_id is required.'
        elif not password:
            error = 'Password is required.'
        elif db.execute(
            'SELECT * FROM master WHERE account_id = ?', (account_id,)
        ).fetchone() is not None:
            error = 'User {0} is already registered.'.format(account_id)

        if error is None:
            db.execute(
                'INSERT INTO master (account_id, password) VALUES (?, ?)',
                (account_id, generate_password_hash(password))
            )
            db.commit()
            session.clear()
            session['master_id'] = account_id
            session['current_detail'] = ''
            session['current_section'] = -1
            return redirect(url_for('user_page'))

        flash(error)

    return render_template('register.html')


@bp.route('/login', methods=('GET', 'POST'))
def login():
    if request.method == 'POST':
        account_id = request.form['account_id']
        password = request.form['password']
        db = get_db()
        error = None
        master = db.execute(
            'SELECT * FROM master WHERE account_id = ?', (account_id,)
        ).fetchone()

        if master is None:
            error = 'Incorrect account_id.'
        elif not check_password_hash(master['password'], password):
            error = 'Incorrect password.'

        if error is None:
            session.clear()
            session['master_id'] = account_id
            session['current_detail'] = ''
            session['current_section'] = -1
            return redirect(url_for('user_page'))

        flash(error)

    return render_template('login.html')


@bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('bp_account.login'))
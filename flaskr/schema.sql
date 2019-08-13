DROP TABLE IF EXISTS master;
DROP TABLE IF EXISTS detail;
DROP TABLE IF EXISTS statement;
DROP TABLE IF EXISTS section_info;
DROP TABLE IF EXISTS share_page;
DROP TABLE IF EXISTS share_statement;

CREATE TABLE master (
  account_id TEXT UNIQUE NOT NULL PRIMARY KEY,
  password TEXT NOT NULL
);

CREATE TABLE detail (
  account_id TEXT UNIQUE NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  update_time REAL NOT NULL,
  master_id TEXT NOT NULL,
  FOREIGN KEY (master_id) REFERENCES master(account_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE statement (
  statement_id INTEGER PRIMARY KEY NOT NULL,
  date_time TEXT NOT NULL,
  product_id TEXT NOT NULL,
  price TEXT NOT NULL,
  quantity TEXT NOT NULL,
  total TEXT NOT NULL,
  remark TEXT NOT NULL,
  account_type TEXT NOT NULL,
  is_clear TEXT NOT NULL,
  section_id INTEGER NOT NULL,
  detail_id TEXT NOT NULL,
  FOREIGN KEY (detail_id) REFERENCES detail(account_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE section_info (
  section_id INTEGER NOT NULL,
  clear_date TEXT NOT NULL,
  detail_id TEXT NOT NULL,
  FOREIGN KEY (detail_id) REFERENCES detail(account_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE share_page (
  address TEXT UNIQUE NOT NULL PRIMARY KEY,
  deadline TEXT NOT NULL,
  sum TEXT NOT NULL
);

CREATE TABLE share_statement (
  date_time TEXT NOT NULL,
  product_id TEXT NOT NULL,
  price TEXT NOT NULL,
  quantity TEXT NOT NULL,
  total TEXT NOT NULL,
  remark TEXT NOT NULL,
  account_type TEXT NOT NULL,
  address TEXT NOT NULL,
  FOREIGN KEY (address) REFERENCES share_page(address) ON DELETE CASCADE
);
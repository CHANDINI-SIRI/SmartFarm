import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "127.0.0.1"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DATABASE", "smartfarm_ai"),
}

pool = pooling.MySQLConnectionPool(
    pool_name="smartfarm_pool",
    pool_size=5,
    pool_reset_session=True,
    **DB_CONFIG
)


def get_connection():
    return pool.get_connection()


def query(sql, params=None, fetch=False, many=False):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        if many:
            cursor.executemany(sql, params)
        else:
            cursor.execute(sql, params or ())

        if fetch:
            return cursor.fetchall()

        connection.commit()
        return cursor.lastrowid

    finally:
        cursor.close()
        connection.close()
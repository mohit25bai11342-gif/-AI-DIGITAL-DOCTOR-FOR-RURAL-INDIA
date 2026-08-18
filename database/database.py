import sqlite3
from datetime import datetime

DATABASE = "database/doctor.db"

def get_connection():
    return sqlite3.connect(DATABASE)

def init_db():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symptoms TEXT,
            prediction TEXT,
            created_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT,
            rating INTEGER,
            created_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine TEXT,
            time TEXT
        )
    """)

    connection.commit()
    connection.close()

def save_patient(symptoms, prediction):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "INSERT INTO patients (symptoms, prediction, created_at) VALUES (?, ?, ?)",
        (symptoms, prediction, datetime.now().isoformat())
    )

    connection.commit()
    connection.close()

def save_feedback(message, rating):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "INSERT INTO feedback (message, rating, created_at) VALUES (?, ?, ?)",
        (message, rating, datetime.now().isoformat())
    )

    connection.commit()
    connection.close()

def save_reminder(medicine, time):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "INSERT INTO reminders (medicine, time) VALUES (?, ?)",
        (medicine, time)
    )

    connection.commit()
    connection.close()

def get_all_reminders():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT id, medicine, time FROM reminders")

    rows = cursor.fetchall()

    connection.close()

    return [
        {
            "id": row[0],
            "medicine": row[1],
            "time": row[2]
        }
        for row in rows
    ]
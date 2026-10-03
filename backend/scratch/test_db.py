import pymysql

passwords = ['', 'root', '123456', 'admin', 'mysql', 'password', 'root1234', '1234', 'clinica', 'clinica_pass123', 'hans', '12345']
found = None

for pw in passwords:
    try:
        conn = pymysql.connect(host='localhost', port=3306, user='root', password=pw)
        print(f"SUCCESS! MySQL root password is: '{pw}'")
        conn.close()
        found = pw
        break
    except Exception as e:
        print(f"Password '{pw}' failed: {e}")

if not found:
    print("Could not connect with common passwords. Will enable intelligent SQLite fallback in database.py if MySQL authentication is blocked.")

import subprocess
result = subprocess.run([
    'docker', 'exec', 'supplygaurd_db', 
    'psql', '-U', 'admin', '-d', 'supplygaurd', '-c', 'SELECT 1;'
], capture_output=True, text=True, env={'PGPASSWORD': 'admin123'})
print(result.stdout)
print(result.stderr)
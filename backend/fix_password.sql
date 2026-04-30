SET password_encryption='md5';
ALTER USER admin WITH PASSWORD 'admin123';
SELECT rolpassword FROM pg_authid WHERE rolname='admin';
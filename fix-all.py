#!/usr/bin/env python3
import os, oss2, subprocess, json

env_file = '.oss_env'
with open(env_file) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()

auth = oss2.Auth(os.environ['OSS_ACCESS_KEY_ID'], os.environ['OSS_ACCESS_KEY_SECRET'])
bucket = oss2.Bucket(auth, 'https://oss-cn-chengdu.aliyuncs.com', 'worldwise')

# Check bucket info
info = bucket.get_bucket_info()
print('Bucket ACL:', info.acl.grant if info.acl else 'unknown')

# Try to disable block public access
try:
    bucket.put_bucket_public_access_block(False)
    print('Block public access disabled')
except Exception as e:
    print(f'Cannot disable block public access via SDK: {e}')

# Set bucket ACL
try:
    bucket.put_bucket_acl(oss2.OBJECT_ACL_PUBLIC_READ)
    print('Bucket ACL set to public-read')
except Exception as e:
    print(f'Failed to set bucket ACL: {e}')

# Re-upload all files
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
FILES_TO_UPLOAD = [
    ('index.html', 'text/html'),
    ('vocab_data.json', 'application/json'),
    ('vercel.json', 'application/json'),
]

scripts_dir = os.path.join(PROJECT_DIR, 'scripts')
if os.path.isdir(scripts_dir):
    for fname in os.listdir(scripts_dir):
        if fname.endswith('.js'):
            FILES_TO_UPLOAD.append((os.path.join('scripts', fname), 'application/javascript'))

print(f'\nUploading {len(FILES_TO_UPLOAD)} files...\n')

for file_path, content_type in FILES_TO_UPLOAD:
    full_path = os.path.join(PROJECT_DIR, file_path)
    if not os.path.exists(full_path):
        continue
    try:
        with open(full_path, 'rb') as f:
            content = f.read()
        bucket.put_object(file_path, content, headers={'Content-Type': content_type})
        print(f'  OK: {file_path}')
    except Exception as e:
        print(f'  FAIL: {file_path} - {e}')

# Verify
print('\nVerifying...')
r = subprocess.run(['curl', '-sI', 'https://worldwise.oss-cn-chengdu.aliyuncs.com/index.html'],
                   capture_output=True, text=True)
for line in r.stdout.split('\n'):
    low = line.lower()
    if 'content-type' in low or 'content-disposition' in low or 'force-download' in low or 'http' in low:
        print(line)

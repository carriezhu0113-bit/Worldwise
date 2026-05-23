#!/usr/bin/env python3
import os, oss2

env_file = '.oss_env'
with open(env_file) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()

auth = oss2.Auth(os.environ['OSS_ACCESS_KEY_ID'], os.environ['OSS_ACCESS_KEY_SECRET'])
bucket = oss2.Bucket(auth, 'https://oss-cn-chengdu.aliyuncs.com', 'worldwise')

# 尝试用 x-oss-force-download: false 覆盖
print('Re-uploading with force-download=false...')
with open('index.html', 'rb') as f:
    content = f.read()

headers = {
    'Content-Type': 'text/html',
    'x-oss-force-download': 'false',
}

result = bucket.put_object('index.html', content, headers=headers)
print(f'Upload status: {result.status}')

# 用 curl 验证
import subprocess
r = subprocess.run(['curl', '-sI', 'https://worldwise.oss-cn-chengdu.aliyuncs.com/index.html'],
                   capture_output=True, text=True)
for line in r.stdout.split('\n'):
    if 'content-type' in line.lower() or 'content-disposition' in line.lower() or 'force-download' in line.lower():
        print(line)

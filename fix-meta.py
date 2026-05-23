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

# 用 copy_object 覆盖，同时设置新的 headers
result = bucket.copy_object(
    bucket.bucket_name, 'index.html', 'index.html',
    headers={
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline',
        'x-oss-metadata-directive': 'REPLACE'
    }
)
print('Copy result:', result.status)

# 验证
resp = bucket.get_object_meta('index.html')
print('Content-Disposition:', repr(resp.headers.get('Content-Disposition')))
print('Content-Type:', repr(resp.headers.get('Content-Type')))

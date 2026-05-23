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

# 尝试关闭 block public access
try:
    bucket.put_bucket_public_access_block(
        oss2.models.PublicAccessBlockConfiguration(
            block_public_acls=False,
            ignore_public_acls=False,
            block_public_policy=False,
            restrict_public_buckets=False
        )
    )
    print('Public access block disabled')
except Exception as e:
    print(f'Failed: {e}')

# 重新上传 index.html 并强制设置 header
with open('index.html', 'rb') as f:
    content = f.read()

result = bucket.put_object(
    'index.html',
    content,
    headers={
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline',
    }
)
print(f'Upload status: {result.status}')

#!/usr/bin/env python3
import os, oss2, json

env_file = '.oss_env'
with open(env_file) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()

auth = oss2.Auth(os.environ['OSS_ACCESS_KEY_ID'], os.environ['OSS_ACCESS_KEY_SECRET'])
bucket = oss2.Bucket(auth, 'https://oss-cn-chengdu.aliyuncs.com', 'worldwise')

# 尝试获取 bucket 的 force download 配置
try:
    result = bucket.get_bucket_info()
    print('Bucket ACL:', result.acl)
    print('Bucket name:', result.name)
except Exception as e:
    print(f'get_bucket_info failed: {e}')

# 尝试用 REST API 关闭 force download
# OSS 的 force download 是通过 bucket policy 或 lifecycle 规则设置的
# 我们尝试删除所有可能相关的规则

# 先查看 lifecycle 规则
try:
    rules = list(oss2.BucketIterator(bucket.get_bucket_lifecycle()))
    print('Lifecycle rules:', rules)
except Exception as e:
    print(f'No lifecycle rules: {e}')

# 查看 bucket policy
try:
    policy = bucket.get_bucket_policy()
    print('Bucket policy:', policy)
except Exception as e:
    print(f'No bucket policy: {e}')

# 尝试用 put_object 重新上传，确保 header 正确
print('\nRe-uploading index.html...')
with open('index.html', 'rb') as f:
    content = f.read()

# 使用正确的 header 方式
headers = {
    'Content-Type': 'text/html',
}

result = bucket.put_object('index.html', content, headers=headers)
print(f'Upload status: {result.status}')

# 验证
import urllib.request
req = urllib.request.Request('https://worldwise.oss-cn-chengdu.aliyuncs.com/index.html', method='HEAD')
try:
    resp = urllib.request.urlopen(req)
    print('Content-Type:', resp.headers.get('Content-Type'))
    print('Content-Disposition:', resp.headers.get('Content-Disposition'))
    print('x-oss-force-download:', resp.headers.get('x-oss-force-download'))
except Exception as e:
    print(f'Verify failed: {e}')

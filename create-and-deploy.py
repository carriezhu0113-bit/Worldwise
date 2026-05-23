#!/usr/bin/env python3
"""
创建新 Bucket 并上传文件
用法: python3 create-and-deploy.py
"""
import os
import sys
import time
import oss2

# 加载配置
env_file = os.path.join(os.path.dirname(__file__), '.oss_env')
if not os.path.exists(env_file):
    print("错误: 请先配置 .oss_env 文件")
    sys.exit(1)

with open(env_file) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()

ACCESS_KEY_ID = os.environ.get('OSS_ACCESS_KEY_ID', '')
ACCESS_KEY_SECRET = os.environ.get('OSS_ACCESS_KEY_SECRET', '')
BUCKET_NAME = os.environ.get('OSS_BUCKET', 'worldwise-english')
ENDPOINT = os.environ.get('OSS_ENDPOINT', 'oss-cn-chengdu.aliyuncs.com')

if not ACCESS_KEY_ID or not ACCESS_KEY_SECRET:
    print("错误: 请在 .oss_env 中配置 AccessKey")
    sys.exit(1)

# 初始化
auth = oss2.Auth(ACCESS_KEY_ID, ACCESS_KEY_SECRET)
bucket = oss2.Bucket(auth, f'https://{ENDPOINT}', BUCKET_NAME)

# 1. 创建 Bucket
print(f"正在创建 Bucket: {BUCKET_NAME}...")
try:
    bucket.create_bucket()
    bucket.put_bucket_acl(oss2.OBJECT_ACL_PUBLIC_READ)
    print("Bucket 创建成功，ACL 已设置为公共读")
except oss2.exceptions.ServerError as e:
    if e.status == 409:
        print("Bucket 已存在，跳过创建")
    elif e.status == 403:
        print("Bucket 已存在，跳过创建")
    else:
        print(f"创建失败: {e}")
        sys.exit(1)
except Exception as e:
    print(f"创建失败: {e}")
    sys.exit(1)

# 2. 设置静态网站托管
print("\n正在配置静态网站托管...")
try:
    bucket.put_bucket_website(oss2.models.BucketWebsite('index.html', 'index.html'))
    print("静态网站托管已开启")
except Exception as e:
    print(f"配置失败: {e}")

# 3. 上传文件
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

print(f"\n开始上传 {len(FILES_TO_UPLOAD)} 个文件...\n")

success = 0
failed = 0

for file_path, content_type in FILES_TO_UPLOAD:
    full_path = os.path.join(PROJECT_DIR, file_path)
    if not os.path.exists(full_path):
        print(f"  跳过 (不存在): {file_path}")
        continue

    try:
        with open(full_path, 'rb') as f:
            content = f.read()

        bucket.put_object(
            file_path,
            content,
            headers={
                'Content-Type': content_type,
                'Content-Disposition': 'inline',
            }
        )
        print(f"  上传成功: {file_path} ({len(content)} bytes)")
        success += 1
    except Exception as e:
        print(f"  上传失败: {file_path} - {e}")
        failed += 1

print(f"\n部署完成! 成功: {success}, 失败: {failed}")
print(f"访问地址: https://{BUCKET_NAME}.{ENDPOINT}/index.html")

#!/usr/bin/env python3
"""
删除旧 Bucket 并重新创建（解决强制下载问题）
用法: python3 recreate-bucket.py
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
service = oss2.Service(auth, f'https://{ENDPOINT}')
bucket = oss2.Bucket(auth, f'https://{ENDPOINT}', BUCKET_NAME)

# 1. 删除 Bucket 中所有文件
print(f"正在清空 Bucket: {BUCKET_NAME}...")
try:
    for obj in oss2.ObjectIterator(bucket):
        print(f"  删除: {obj.key}")
        bucket.delete_object(obj.key)
    print("Bucket 已清空")
except Exception as e:
    print(f"清空失败: {e}")

# 2. 删除 Bucket
print(f"\n正在删除 Bucket: {BUCKET_NAME}...")
try:
    bucket.delete_bucket()
    print("Bucket 已删除")
except Exception as e:
    print(f"删除失败: {e}")
    print("请手动在控制台删除后重试")
    sys.exit(1)

# 等待删除生效
print("\n等待 3 秒...")
time.sleep(3)

# 3. 重新创建 Bucket
print(f"正在创建 Bucket: {BUCKET_NAME}...")
try:
    bucket.create_bucket()
    # 设置 ACL 为公共读
    bucket.put_bucket_acl(oss2.OBJECT_ACL_PUBLIC_READ)
    print("Bucket 创建成功，ACL 已设置为公共读")
except Exception as e:
    print(f"创建失败: {e}")
    sys.exit(1)

# 4. 设置静态网站托管
print("\n正在配置静态网站托管...")
try:
    bucket.put_bucket_website(oss2.models.BucketWebsite('index.html', 'index.html'))
    print("静态网站托管已开启")
except Exception as e:
    print(f"配置失败: {e}")

print(f"\nBucket 重建完成!")
print(f"访问地址: https://{BUCKET_NAME}.{ENDPOINT}/index.html")

#!/usr/bin/env python3
"""
创建全新 Bucket 并上传文件（解决强制下载问题）
"""
import os, sys, time, oss2, subprocess

env_file = '.oss_env'
with open(env_file) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()

ACCESS_KEY_ID = os.environ.get('OSS_ACCESS_KEY_ID', '')
ACCESS_KEY_SECRET = os.environ.get('OSS_ACCESS_KEY_SECRET', '')
ENDPOINT = os.environ.get('OSS_ENDPOINT', 'oss-cn-chengdu.aliyuncs.com')

if not ACCESS_KEY_ID or not ACCESS_KEY_SECRET:
    print("错误: 请在 .oss_env 中配置 AccessKey")
    sys.exit(1)

# 使用新名字
BUCKET_NAME = 'worldwise-web'

auth = oss2.Auth(ACCESS_KEY_ID, ACCESS_KEY_SECRET)

# 1. 删除旧 bucket（如果存在）
print(f"尝试删除旧 bucket: worldwise...")
try:
    old_bucket = oss2.Bucket(auth, f'https://{ENDPOINT}', 'worldwise')
    for obj in oss2.ObjectIterator(old_bucket):
        old_bucket.delete_object(obj.key)
    old_bucket.delete_bucket()
    print("旧 bucket 已删除")
except Exception as e:
    print(f"删除旧 bucket 失败（可能不存在）: {e}")

time.sleep(2)

# 2. 创建新 bucket
print(f"\n创建新 bucket: {BUCKET_NAME}...")
bucket = oss2.Bucket(auth, f'https://{ENDPOINT}', BUCKET_NAME)
try:
    bucket.create_bucket()
    print("Bucket 创建成功")
except Exception as e:
    print(f"创建失败: {e}")
    sys.exit(1)

# 3. 设置 ACL 为公共读
print("设置 ACL 为公共读...")
bucket.put_bucket_acl(oss2.OBJECT_ACL_PUBLIC_READ)

# 4. 开启静态网站托管
print("开启静态网站托管...")
bucket.put_bucket_website(oss2.models.BucketWebsite('index.html', 'index.html'))

# 5. 上传文件
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

print(f"\n上传 {len(FILES_TO_UPLOAD)} 个文件...\n")

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

# 6. 更新 .oss_env
with open(env_file, 'w') as f:
    f.write(f"""# 阿里云 OSS 部署配置
OSS_ACCESS_KEY_ID={ACCESS_KEY_ID}
OSS_ACCESS_KEY_SECRET={ACCESS_KEY_SECRET}
OSS_BUCKET={BUCKET_NAME}
OSS_ENDPOINT={ENDPOINT}
""")
print(f"\n已更新 .oss_env 文件")

# 7. 验证
print("\n验证访问...")
time.sleep(2)
r = subprocess.run(['curl', '-sI', f'https://{BUCKET_NAME}.{ENDPOINT}/index.html'],
                   capture_output=True, text=True)
for line in r.stdout.split('\n'):
    low = line.lower()
    if 'content-type' in low or 'content-disposition' in low or 'force-download' in low or 'http' in low:
        print(line)

print(f"\n部署完成!")
print(f"访问地址: https://{BUCKET_NAME}.{ENDPOINT}/index.html")

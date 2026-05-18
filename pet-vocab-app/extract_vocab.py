import re
import json

# Read the markdown file
with open('/Users/zhubaizhen/Library/Mobile Documents/iCloud~md~obsidian/Documents/CarrieThinking/PET词汇场景分类手册.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse scenes and words
scenes = {}
current_scene = None
current_subtitle = ''

lines = content.split('\n')
i = 0
while i < len(lines):
    line = lines[i].strip()
    
    # Detect scene header (## 一、日常生活 (Daily Life))
    scene_match = re.match(r'^##\s+([一二三四五六七八九十百]+[、][^\(]+)\s*\(([^)]+)\)', line)
    if scene_match:
        scene_name = scene_match.group(1).strip()
        subtitle = scene_match.group(2).strip()
        current_scene = f"scene{len(scenes) + 1}"
        current_subtitle = subtitle
        scenes[current_scene] = {
            'title': scene_name,
            'subtitle': subtitle,
            'words': []
        }
        i += 1
        continue
    
    # Detect table rows
    if line.startswith('|') and current_scene:
        # Skip header and separator rows
        if '单词' in line or '---' in line or '|------' in line:
            i += 1
            continue
        
        # Parse word row
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 7:
            word = parts[1]
            pos = parts[2]
            phonetic = parts[3]
            meaning = parts[4]
            phrase = parts[5]
            synonyms = parts[6]
            
            if word and word != '单词':
                scenes[current_scene]['words'].append({
                    'word': word,
                    'phonetic': phonetic,
                    'pos': pos,
                    'meaning': meaning,
                    'phrase': phrase,
                    'synonyms': synonyms
                })
    
    i += 1

# Save to JSON
output = {
    'scenes': scenes,
    'total_scenes': len(scenes),
    'total_words': sum(len(s['words']) for s in scenes.values())
}

with open('/Users/zhubaizhen/Library/Mobile Documents/iCloud~md~obsidian/Documents/CarrieThinking/pet-vocab-app/vocab_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Total scenes: {len(scenes)}")
print(f"Total words: {output['total_words']}")
print("\nScene breakdown:")
for key, scene in scenes.items():
    print(f"  {key}: {scene['title']} - {len(scene['words'])} words")

import xlrd
import json

# Open the workbook
wb = xlrd.open_workbook('/Users/zhubaizhen/Library/Mobile Documents/iCloud~md~obsidian/Documents/CarrieThinking/Attachments/PET词汇表中英+音标3216个.xls')
ws = wb.sheet_by_index(0)

# Extract all words
all_words = []
for i in range(1, ws.nrows):
    row = ws.row_values(i)
    word = str(row[1]).strip() if row[1] else ''
    phonetic = str(row[2]).strip() if row[2] else ''
    meaning = str(row[3]).strip() if row[3] else ''
    if word:
        all_words.append({
            'word': word,
            'phonetic': phonetic,
            'meaning': meaning
        })

# Save to JSON
with open('/Users/zhubaizhen/Library/Mobile Documents/iCloud~md~obsidian/Documents/CarrieThinking/pet_words.json', 'w', encoding='utf-8') as f:
    json.dump(all_words, f, ensure_ascii=False, indent=2)

print(f"Total words extracted: {len(all_words)}")
print("Saved to pet_words.json")

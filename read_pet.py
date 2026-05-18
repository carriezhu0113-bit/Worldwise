import xlrd, json

wb = xlrd.open_workbook('/Users/zhubaizhen/Library/Mobile Documents/iCloud~md~obsidian/Documents/CarrieThinking/Attachments/PET词汇表中英+音标3216个.xls')
ws = wb.sheet_by_index(0)

all_words = {}
for i in range(1, ws.nrows):
    row = ws.row_values(i)
    word = str(row[1]).strip().lower() if row[1] else ''
    if word:
        all_words[word] = {
            'phonetic': str(row[2]).strip() if row[2] else '',
            'meaning': str(row[3]).strip() if row[3] else ''
        }

with open('pet_words.json', 'w') as f:
    json.dump(all_words, f, ensure_ascii=False)

print(f'Total unique words: {len(all_words)}')

test_words = ['school', 'teacher', 'hospital', 'doctor', 'restaurant', 'hotel', 'airport', 'weather', 'family', 'computer']
for w in test_words:
    if w in all_words:
        print(f'  {w}: {all_words[w]}')
    else:
        print(f'  {w}: NOT FOUND')

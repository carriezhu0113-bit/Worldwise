import xlrd
import json

# Open the workbook
wb = xlrd.open_workbook('/Users/zhubaizhen/Library/Mobile Documents/iCloud~md~obsidian/Documents/CarrieThinking/Attachments/PET词汇表中英+音标3216个.xls')
ws = wb.sheet_by_index(0)

# Print sheet info
print(f"Sheet name: {ws.name}")
print(f"Number of rows: {ws.nrows}")
print(f"Number of columns: {ws.ncols}")

# Print header row
print("\nHeader row:")
for i, cell in enumerate(ws.row_values(0)):
    print(f"  Column {i}: {cell}")

# Print first 20 rows as sample
print("\nFirst 20 rows:")
for i in range(1, min(21, ws.nrows)):
    row = ws.row_values(i)
    print(f"Row {i}: {row}")

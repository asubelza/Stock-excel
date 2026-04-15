import tkinter as tk
from tkinter import ttk, messagebox
import openpyxl
from openpyxl import load_workbook
import os
from datetime import datetime

print("DEBUG: Starting imports")

EXCEL_FILE = "planilla_base.xlsx"

try:
    print("DEBUG: About to load workbook")
    wb = load_workbook(EXCEL_FILE)
    print("DEBUG: Workbook loaded successfully")
except Exception as e:
    print(f"DEBUG ERROR loading excel: {e}")
    wb = None

print("DEBUG: Creating root")
root = tk.Tk()
root.title("Gestion de Stock")
root.geometry("1100x750")

theme = {
    'bg': '#F5F7FA', 'fg': '#2C3E50', 'accent': '#3498DB',
    'toolbar': '#FFFFFF', 'tree_bg': '#FFFFFF', 'tree_fg': '#2C3E50',
    'tree_sel': '#3498DB', 'entry_bg': '#FFFFFF', 'entry_fg': '#2C3E50',
    'button': '#3498DB', 'watermark': '#7F8C8D', 'warning': '#E74C3C', 'success': '#27AE60'
}

print("DEBUG: Creating login window")
login_win = tk.Toplevel(root)
login_win.title("Login")
login_win.geometry("300x220")
login_win.configure(bg=theme['bg'])

ttk.Label(login_win, text="Gestion de Stock", font=('Arial', 14, 'bold')).pack(pady=20)
ttk.Label(login_win, text="Usuario:").pack(pady=5)
user_var = tk.StringVar()
ttk.Entry(login_win, textvariable=user_var, width=20).pack()
ttk.Label(login_win, text="Contrasena:").pack(pady=5)
pass_var = tk.StringVar()
pass_entry = ttk.Entry(login_win, textvariable=pass_var, show="*", width=20)
pass_entry.pack()
pass_entry.bind('<Return>', lambda e: print("DEBUG: Enter pressed"))

label = tk.Label(login_win, text="TEST - If you see this, app works!", font=('Arial', 12, 'bold'), fg='red')
label.pack(pady=30)

print("DEBUG: about to mainloop")
root.mainloop()
print("DEBUG: mainloop ended")
import tkinter as tk
from tkinter import ttk, messagebox
import openpyxl
from openpyxl import load_workbook
import os
from datetime import datetime

print("DEBUG: Starting")

EXCEL_FILE = "planilla_base.xlsx"

root = tk.Tk()
root.title("Gestion de Stock")
root.geometry("1100x750")

print("DEBUG: Loading Excel")
try:
    wb = load_workbook(EXCEL_FILE)
    print("DEBUG: Excel loaded OK")
except Exception as e:
    print(f"DEBUG ERROR: {e}")
    messagebox.showerror("Error", f"No se pudo cargar Excel: {e}")

print("DEBUG: Creating login")
login_win = tk.Toplevel(root)
login_win.title("Login")
login_win.geometry("300x220")

ttk.Label(login_win, text="Gestion de Stock", font=('Arial', 14, 'bold')).pack(pady=20)
ttk.Label(login_win, text="Usuario:").pack(pady=5)
user_var = tk.StringVar()
ttk.Entry(login_win, textvariable=user_var, width=20).pack()

print("DEBUG: About to run")
root.mainloop()
print("DEBUG: Done")
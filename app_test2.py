import tkinter as tk
from tkinter import ttk, messagebox
import openpyxl
from openpyxl import load_workbook
import os
from datetime import datetime

class StockApp:
    def __init__(self):
        print("DEBUG: Starting")
        
        EXCEL_FILE = "planilla_base.xlsx"
        
        LIGHT_THEME = {
            'bg': '#F5F7FA', 'fg': '#2C3E50', 'accent': '#3498DB',
            'toolbar': '#FFFFFF', 'tree_bg': '#FFFFFF', 'tree_fg': '#2C3E50',
            'tree_sel': '#3498DB', 'entry_bg': '#FFFFFF', 'entry_fg': '#2C3E50',
            'button': '#3498DB', 'watermark': '#7F8C8D', 'warning': '#E74C3C', 'success': '#27AE60'
        }
        
        self.root = tk.Tk()
        self.root.title("Gestion de Stock")
        self.root.geometry("1100x750")
        
        print("DEBUG: Creating class vars")
        self.wb = None
        self.ws_productos = None
        self.ws_movimientos = None
        self.ws_usuarios = None
        self.ws_proveedores = None
        self.products = []
        self.depositos = ['Principal']
        self.dark_mode = False
        self.current_theme = LIGHT_THEME
        self.usuario_actual = None
        self.status_label = None
        
        print("DEBUG: Loading Excel")
        try:
            self.wb = load_workbook(EXCEL_FILE)
            print("DEBUG: Excel loaded OK")
        except Exception as e:
            print(f"DEBUG ERROR: {e}")
            messagebox.showerror("Error", f"Excel error: {e}")
            return
        
        print("DEBUG: Login")
        self.show_login()
        
        print("DEBUG: About to mainloop")
        self.root.mainloop()
        print("DEBUG: Done")
    
    def show_login(self):
        login_win = tk.Toplevel(self.root)
        login_win.title("Login")
        login_win.geometry("300x220")
        login_win.configure(bg='#F5F7FA')
        
        ttk.Label(login_win, text="Gestion de Stock", font=('Arial', 14, 'bold')).pack(pady=20)
        self.user_var = tk.StringVar()
        ttk.Label(login_win, text="Usuario:").pack(pady=5)
        ttk.Entry(login_win, textvariable=self.user_var, width=20).pack()
        
        self.pass_var = tk.StringVar()
        ttk.Label(login_win, text="Contrasena:").pack(pady=5)
        self.pass_entry = ttk.Entry(login_win, textvariable=self.pass_var, show="*", width=20)
        self.pass_entry.pack()
        self.pass_entry.bind('<Return>', lambda e: print("Enter pressed"))
        
        tk.Label(login_win, text="TEST - App works!", font=('Arial', 12, 'bold'), fg='green', bg='#F5F7FA').pack(pady=30)

if __name__ == "__main__":
    app = StockApp()
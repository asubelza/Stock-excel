import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import openpyxl
from openpyxl import load_workbook
import os
from datetime import datetime

EXCEL_FILE = "planilla_base.xlsx"

LIGHT_THEME = {
    'bg': '#F5F7FA',
    'fg': '#2C3E50',
    'accent': '#3498DB',
    'toolbar': '#FFFFFF',
    'tree_bg': '#FFFFFF',
    'tree_fg': '#2C3E50',
    'tree_sel': '#3498DB',
    'entry_bg': '#FFFFFF',
    'entry_fg': '#2C3E50',
    'label': '#5D6D7E',
    'button': '#3498DB',
    'watermark': '#7F8C8D',
    'border': '#E0E4E8'
}

DARK_THEME = {
    'bg': '#1A1A2E',
    'fg': '#EAEAEA',
    'accent': '#4A90D9',
    'toolbar': '#16213E',
    'tree_bg': '#16213E',
    'tree_fg': '#EAEAEA',
    'tree_sel': '#4A90D9',
    'entry_bg': '#252545',
    'entry_fg': '#EAEAEA',
    'label': '#B0B0B0',
    'button': '#4A90D9',
    'watermark': '#6C7A89',
    'border': '#2D2D4A'
}

class StockApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Gestión de Stock - App Portable")
        self.root.geometry("1000x700")
        self.root.configure(bg=LIGHT_THEME['bg'])
        
        self.wb = None
        self.ws = None
        self.products = []
        self.dark_mode = False
        self.current_theme = LIGHT_THEME
        
        self.setup_styles()
        self.setup_ui()
        self.load_excel()
    
    def setup_styles(self):
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.update_theme()
    
    def update_theme(self):
        theme = DARK_THEME if self.dark_mode else LIGHT_THEME
        self.current_theme = theme
        
        self.root.configure(bg=theme['bg'])
        
        self.style.configure('TFrame', background=theme['bg'])
        self.style.configure('TLabel', background=theme['bg'], foreground=theme['fg'])
        self.style.configure('Treeview', background=theme['tree_bg'], foreground=theme['tree_fg'], fieldbackground=theme['tree_bg'])
        self.style.configure('Treeview.Heading', background=theme['toolbar'], foreground=theme['fg'])
        self.style.map('Treeview', background=[('selected', theme['tree_sel'])])
        self.style.configure('TButton', background=theme['button'], foreground=theme['fg'])
        self.style.configure('TEntry', fieldbackground=theme['entry_bg'], foreground=theme['entry_fg'])
        
        for widget in self.root.winfo_children():
            self.refresh_widget_theme(widget)
        
        if hasattr(self, 'watermark_label'):
            self.watermark_label.configure(fg=theme['watermark'], bg=theme['bg'])
    
    def refresh_widget_theme(self, widget):
        theme = self.current_theme
        try:
            widget_class = widget.winfo_class()
            if widget_class in ('TFrame', 'TLabelframe', 'TFrame'):
                widget.configure(style='TFrame')
            elif widget_class == 'TLabel':
                widget.configure(foreground=theme['fg'])
            elif widget_class == 'TButton':
                widget.configure(style='TButton')
        except:
            pass
        
        for child in widget.winfo_children():
            self.refresh_widget_theme(child)
    
    def toggle_theme(self):
        self.dark_mode = not self.dark_mode
        self.update_theme()
    
    def setup_ui(self):
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        toolbar = ttk.Frame(main_frame)
        toolbar.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(toolbar, text="Agregar Producto", command=self.add_product).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="Editar", command=self.edit_product).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="Eliminar", command=self.delete_product).pack(side=tk.LEFT, padx=2)
        ttk.Separator(toolbar, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=5)
        ttk.Button(toolbar, text="Conteo Stock", command=self.stock_count).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="Aplicar Descuento", command=self.apply_discount).pack(side=tk.LEFT, padx=2)
        ttk.Separator(toolbar, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=5)
        ttk.Button(toolbar, text="Guardar Excel", command=self.save_excel).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="Actualizar", command=self.load_excel).pack(side=tk.LEFT, padx=2)
        ttk.Separator(toolbar, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=5)
        ttk.Button(toolbar, text="Modo Oscuro" if not self.dark_mode else "Modo Claro", command=self.toggle_theme).pack(side=tk.LEFT, padx=2)
        
        search_frame = ttk.Frame(main_frame)
        search_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(search_frame, text="Buscar:").pack(side=tk.LEFT)
        self.search_var = tk.StringVar()
        self.search_var.trace('w', lambda *a: self.filter_products())
        ttk.Entry(search_frame, textvariable=self.search_var, width=30).pack(side=tk.LEFT, padx=5)
        
        ttk.Label(search_frame, text="Filtrar Rubro:").pack(side=tk.LEFT, padx=(20, 0))
        self.rubro_var = tk.StringVar()
        self.rubro_combo = ttk.Combobox(search_frame, textvariable=self.rubro_var, state="readonly")
        self.rubro_combo.pack(side=tk.LEFT, padx=5)
        self.rubro_combo.bind('<<ComboboxSelected>>', lambda e: self.filter_products())
        
        self.tree_frame = ttk.Frame(main_frame)
        self.tree_frame.pack(fill=tk.BOTH, expand=True)
        
        cols = ('SKU', 'Nombre', 'Tipo', 'Estado', 'Moneda', 'Precio', 'Costo', 'Stock Min', 'Rubro')
        self.tree = ttk.Treeview(self.tree_frame, columns=cols, show='headings')
        
        for col in cols:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=100 if col != 'Nombre' else 200)
        
        self.tree.column('SKU', width=100)
        self.tree.column('Nombre', width=200)
        self.tree.column('Tipo', width=50)
        self.tree.column('Estado', width=50)
        self.tree.column('Moneda', width=60)
        self.tree.column('Precio', width=80)
        self.tree.column('Costo', width=80)
        self.tree.column('Stock Min', width=80)
        self.tree.column('Rubro', width=100)
        
        scrollbar = ttk.Scrollbar(self.tree_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.LEFT, fill=tk.Y)
        
        status_frame = ttk.Frame(main_frame)
        status_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.status_label = ttk.Label(status_frame, text="")
        self.status_label.pack(side=tk.LEFT)
        
        ttk.Label(status_frame, text="Total productos:").pack(side=tk.RIGHT)
        self.total_label = ttk.Label(status_frame, text="0")
        self.total_label.pack(side=tk.RIGHT)
        
        self.watermark_label = tk.Label(
            self.root,
            text="Desarrollado por asubelzacg",
            font=('Arial', 9, 'bold'),
            fg=LIGHT_THEME['watermark'],
            bg=LIGHT_THEME['bg']
        )
        self.watermark_label.place(relx=0.5, rely=0.99, anchor='center')
    
    def load_excel(self):
        if not os.path.exists(EXCEL_FILE):
            messagebox.showerror("Error", f"No se encontró {EXCEL_FILE}")
            return
        
        try:
            self.wb = load_workbook(EXCEL_FILE)
            self.ws = self.wb.active
            
            self.products = []
            start_row = 4
            
            for row in range(start_row, self.ws.max_row + 1):
                sku = self.ws[f'C{row}'].value
                nombre = self.ws[f'B{row}'].value
                if sku or nombre:
                    self.products.append({
                        'row': row,
                        'Nombre': nombre,
                        'SKU': sku,
                        'Tipo': self.ws[f'D{row}'].value,
                        'Estado': self.ws[f'E{row}'].value,
                        'Moneda': self.ws[f'F{row}'].value,
                        'Rubro': self.ws[f'H{row}'].value,
                        'Stock Min': self.ws[f'U{row}'].value,
                        'precio': self.ws[f'P{row}'].value,
                        'costo': self.ws[f'R{row}'].value,
                        'cod_barra': self.ws[f'T{row}'].value,
                    })
            
            self.update_rubros()
            self.filter_products()
            self.status_label.config(text=f"Excel cargado: {EXCEL_FILE}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Error al cargar Excel: {e}")
    
    def update_rubros(self):
        rubros = sorted(set(p['Rubro'] for p in self.products if p['Rubro']))
        self.rubro_combo['values'] = ['Todos'] + rubros
    
    def filter_products(self, _=None):
        self.tree.delete(*self.tree.get_children())
        
        search = self.search_var.get().lower()
        rubro = self.rubro_var.get()
        
        for p in self.products:
            if search and search not in (p['Nombre'] or '').lower() and search not in (p['SKU'] or '').lower():
                continue
            if rubro and rubro != 'Todos' and p['Rubro'] != rubro:
                continue
            
            self.tree.insert('', tk.END, values=(
                p['SKU'] or '',
                p['Nombre'] or '',
                p['Tipo'] or '',
                p['Estado'] or '',
                p['Moneda'] or '',
                p['precio'] or '',
                p['costo'] or '',
                p['Stock Min'] or '',
                p['Rubro'] or '',
            ))
        
        self.total_label.config(text=str(len(self.products)))
    
    def add_product(self):
        self.open_editor()
    
    def edit_product(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("Seleccionar", "Seleccioná un producto para editar")
            return
        
        vals = self.tree.item(sel[0])['values']
        sku, nombre = vals[0], vals[1]
        
        for p in self.products:
            if p['SKU'] == sku and p['Nombre'] == nombre:
                self.open_editor(p)
                return
    
    def open_editor(self, product=None):
        win = tk.Toplevel(self.root)
        win.title("Editar Producto" if product else "Agregar Producto")
        win.geometry("500x650")
        
        theme = self.current_theme
        win.configure(bg=theme['bg'])
        
        fields = [
            ('Nombre', 'B'),
            ('SKU', 'C'),
            ('Tipo (P/S)', 'D'),
            ('Estado (A/I)', 'E'),
            ('Moneda (ARS/USD)', 'F'),
            ('Rubro', 'H'),
            ('Subrubro', 'I'),
            ('Descripcion', 'J'),
            ('Cod Proveedor', 'K'),
            ('Precio Unitario', 'P'),
            ('Tasa IVA', 'Q'),
            ('Costo Interno', 'R'),
            ('Cod Barra', 'T'),
            ('Stock Minimo', 'U'),
        ]
        
        entries = {}
        
        for i, (label, col) in enumerate(fields):
            lbl = ttk.Label(win, text=label)
            lbl.grid(row=i, column=0, sticky=tk.W, padx=5, pady=5)
            
            entry = ttk.Entry(win, width=40)
            entry.grid(row=i, column=1, padx=5, pady=5)
            entries[col] = entry
            
            if product is not None:
                try:
                    val = product[i]
                    if val:
                        entry.insert(0, str(val))
                except (IndexError, TypeError):
                    pass
        
        def save():
            row = self.ws.max_row + 1
            
            for col, entry in entries.items():
                self.ws[f'{col}{row}'].value = entry.get() or None
            
            self.ws[f'A{row}'].value = self.ws['A3'].value
            self.ws[f'E{row}'].value = 'A'
            
            self.wb.save(EXCEL_FILE)
            win.destroy()
            self.load_excel()
            messagebox.showinfo("Éxito", "Producto guardado")
        
        ttk.Button(win, text="Guardar", command=save).grid(row=len(fields), column=1, pady=20)
        
        tk.Label(
            win,
            text="Desarrollado por asubelzacg",
            font=('Arial', 8, 'bold'),
            fg=theme['watermark'],
            bg=theme['bg']
        ).grid(row=len(fields)+1, column=0, columnspan=2, pady=10)
    
    def delete_product(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("Seleccionar", "Seleccioná un producto para eliminar")
            return
        
        if messagebox.askyesno("Eliminar", "¿Confirmar eliminación?"):
            item = self.tree.item(sel[0])['values']
            for p in self.products:
                if p['SKU'] == item[1]:
                    self.ws.delete_rows(p['row'], 1)
                    self.wb.save(EXCEL_FILE)
                    self.load_excel()
                    messagebox.showinfo("Eliminado", "Producto eliminado")
                    return
    
    def stock_count(self):
        win = tk.Toplevel(self.root)
        win.title("Conteo de Stock")
        win.geometry("600x450")
        
        theme = self.current_theme
        win.configure(bg=theme['bg'])
        
        header = ttk.Label(win, text="Productos con stock bajo mínimo:", font=('', 12, 'bold'))
        header.pack(pady=10)
        
        cols = ('SKU', 'Nombre', 'Stock Min', 'Estado')
        tree = ttk.Treeview(win, columns=cols, show='headings')
        for col in cols:
            tree.heading(col, text=col)
            tree.column(col, width=150)
        tree.pack(fill=tk.BOTH, expand=True, padx=10)
        
        low_stock = [p for p in self.products if p['Stock Min'] and str(p['Stock Min']).strip() != '']
        
        for p in low_stock:
            tree.insert('', tk.END, values=(
                p['SKU'] or '',
                p['Nombre'] or '',
                p['Stock Min'] or '',
                p['Estado'] or '',
            ))
        
        ttk.Label(win, text=f"Total: {len(low_stock)} productos").pack(pady=10)
        
        tk.Label(
            win,
            text="Desarrollado por asubelzacg",
            font=('Arial', 8, 'bold'),
            fg=theme['watermark'],
            bg=theme['bg']
        ).pack(pady=5)
    
    def apply_discount(self):
        win = tk.Toplevel(self.root)
        win.title("Aplicar Descuento")
        win.geometry("400x300")
        
        theme = self.current_theme
        win.configure(bg=theme['bg'])
        
        ttk.Label(win, text="Porcentaje de descuento (%):").pack(pady=10)
        disc_var = tk.StringVar()
        ttk.Entry(win, textvariable=disc_var, width=10).pack()
        
        ttk.Label(win, text="Filtrar por Rubro (dejar vacío para todos):").pack(pady=10)
        rubro_disc = tk.StringVar()
        ttk.Combobox(win, textvariable=rubro_disc, values=['Todos'] + list(self.rubro_combo['values'])).pack()
        
        def aplicar():
            try:
                descuento = float(disc_var.get())
            except ValueError:
                messagebox.showerror("Error", "Porcentaje inválido")
                return
            
            count = 0
            for p in self.products:
                if rubro_disc.get() and rubro_disc.get() != 'Todos' and p['Rubro'] != rubro_disc.get():
                    continue
                
                if p['precio']:
                    try:
                        nuevo = float(p['precio']) * (1 - descuento/100)
                        self.ws[f'P{p["row"]}'].value = nuevo
                        count += 1
                    except:
                        pass
            
            self.wb.save(EXCEL_FILE)
            win.destroy()
            self.load_excel()
            messagebox.showinfo("Éxito", f"Descuento aplicado a {count} productos")
        
        ttk.Button(win, text="Aplicar", command=aplicar).pack(pady=20)
        
        tk.Label(
            win,
            text="Desarrollado por asubelzacg",
            font=('Arial', 8, 'bold'),
            fg=theme['watermark'],
            bg=theme['bg']
        ).pack(pady=5)
    
    def save_excel(self):
        if self.wb:
            self.wb.save(EXCEL_FILE)
            messagebox.showinfo("Guardado", f"Excel guardado: {EXCEL_FILE}")

if __name__ == "__main__":
    root = tk.Tk()
    app = StockApp(root)
    root.mainloop()
import tkinter as tk
from tkinter import messagebox
import sys

try:
    root = tk.Tk()
    root.title("Test")
    root.geometry("300x200")
    
    label = tk.Label(root, text="Test window - click OK if you see this", font=("Arial", 14))
    label.pack(pady=20)
    
    btn = tk.Button(root, text="OK", command=lambda: messagebox.showinfo("OK", "Works!"))
    btn.pack(pady=10)
    
    root.mainloop()
except Exception as e:
    with open("test_error.log", "w") as f:
        f.write(str(e))
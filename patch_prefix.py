with open('web_app.py', 'r') as f:
    content = f.read()

# Cambiar redirect('/') por redirect('/stock/')
content = content.replace("return redirect('/')", "return redirect('/stock/')")
content = content.replace("redirect('/')", "redirect('/stock/')")

# Cambiar redirect('/login') por redirect('/stock/login')
content = content.replace("redirect('/login')", "redirect('/stock/login')")
content = content.replace("return redirect('/login')", "return redirect('/stock/login')")

# Cambiar redirect('/stock') por redirect('/stock/')
content = content.replace("redirect('/stock')", "redirect('/stock/')")

with open('web_app.py', 'w') as f:
    f.write(content)

print("Rutas actualizadas!")

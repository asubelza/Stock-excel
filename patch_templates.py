import os
import re

templates_dir = 'templates'
for filename in os.listdir(templates_dir):
    if filename.endswith('.html'):
        filepath = os.path.join(templates_dir, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Solo parchear si no tiene /stock/ ya
        if '/stock/' not in content and '/stock"' not in content:
            # Cambiar href="/" a href="/stock/"
            content = re.sub(r'href="/"', 'href="/stock/"', content)
            # Cambiar href="/ algo" a href="/stock/algo"
            content = re.sub(r'href="/([a-z_]+)"', r'href="/stock/\1"', content)
            # Cambiar fetch('/api/ a fetch('/stock/api/
            content = re.sub(r"fetch\('/api/", "fetch('/stock/api/", content)
            
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Parcheado: {filename}")

print("Templates actualizados!")

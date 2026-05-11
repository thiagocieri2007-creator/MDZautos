INSTRUCCIONES PARA LA CONCESIONARIA

¡Bienvenido a tu nueva aplicación de gestión de concesionaria! Esta aplicación funciona completamente en tu navegador web sin necesidad de instalar nada más.

PASOS PARA ABRIR LA APLICACIÓN:
1. Haz doble clic en el archivo "index.html" que está en esta carpeta.
2. La aplicación se abrirá en tu navegador web (Chrome, Firefox, Edge, etc.).

CÓMO AGREGAR VEHÍCULOS:
1. En la barra de navegación superior, haz clic en "Admin".
2. Ingresa la contraseña (por defecto es "admin123").
3. Haz clic en "Agregar Vehículo".
4. Completa todos los campos obligatorios marcados con *.
5. Sube al menos una foto del vehículo (haz clic en "Seleccionar archivos").
6. Haz clic en "Guardar Vehículo".
7. ¡Listo! El vehículo aparecerá en el catálogo.

CÓMO EXPORTAR DATOS PARA MOVER A OTRA COMPUTADORA:
1. Ve a Admin → Backup & Restore.
2. Haz clic en "Exportar datos (JSON)".
3. Se descargará un archivo llamado "backup_concesionaria_FECHA.json".
4. Copia este archivo a la nueva computadora.

CÓMO IMPORTAR DATOS EN LA NUEVA COMPUTADORA:
1. Copia toda la carpeta "mi-concesionaria" a la nueva computadora.
2. Abre index.html en la nueva computadora.
3. Ve a Admin → Backup & Restore.
4. Haz clic en "Seleccionar archivo" y elige el archivo JSON exportado.
5. Haz clic en "Importar datos (JSON)".
6. Recarga la página (F5) para ver los datos importados.

CÓMO CAMBIAR EL NOMBRE DE LA CONCESIONARIA Y WHATSAPP:
1. Abre el archivo "app.js" con el Bloc de Notas o cualquier editor de texto.
2. Al principio del archivo verás una sección llamada "CONFIGURACIÓN".
3. Cambia los valores de:
   - dealershipName: el nombre de tu concesionaria
   - tagline: el eslogan
   - whatsappPhone: tu número de WhatsApp (sin + ni espacios, ej: 5491100000000)
4. Guarda el archivo y recarga la página en el navegador.

CÓMO CAMBIAR LA CONTRASEÑA DE ADMIN:
1. Abre "app.js" con el Bloc de Notas.
2. En la sección CONFIG, cambia el valor de "adminPassword".
3. Guarda y recarga la página.

NOTAS IMPORTANTES:
- Todos los datos se guardan automáticamente en tu navegador.
- Las fotos se convierten a formato especial y se guardan junto con los datos.
- Si borras el historial del navegador, perderás los datos (por eso es importante hacer backup).
- La aplicación funciona sin conexión a internet una vez cargada.
- Para compartir con clientes, simplemente envíales el link directo al vehículo o el catálogo completo.

¡Disfruta tu nueva concesionaria digital!
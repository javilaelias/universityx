# Manual de Usuario — Universidad X

**Plataforma de Aprendizaje Adaptativo**  
Versión 1.0 · Junio 2026

---

## Tabla de contenidos

1. [Introducción](#1-introducción)
2. [Acceso a la plataforma](#2-acceso-a-la-plataforma)
3. [Guía del Estudiante](#3-guía-del-estudiante)
4. [Guía del Instructor](#4-guía-del-instructor)
5. [Guía del Administrador](#5-guía-del-administrador)
6. [Credenciales y certificados PDF](#6-credenciales-y-certificados-pdf)
7. [Soporte técnico](#7-soporte-técnico)

---

## 1. Introducción

Universidad X es una plataforma LMS (Learning Management System) diseñada para el aprendizaje adaptativo. Permite a los estudiantes tomar cursos en línea, a los instructores crear y gestionar contenido, y a los administradores supervisar toda la operación.

### Roles disponibles

| Rol | Descripción |
|-----|-------------|
| **Estudiante** | Puede explorar el catálogo, matricularse en cursos, consumir contenido y obtener credenciales al completar un curso. |
| **Instructor** | Puede crear y gestionar cursos propios: módulos, contenido, publicación. También tiene acceso como estudiante. |
| **Administrador** | Tiene todas las capacidades del instructor más permisos sobre cualquier curso de la plataforma. |

---

## 2. Acceso a la plataforma

### 2.1 Registro de nueva cuenta

1. Abrir la URL de la plataforma en el navegador.
2. Hacer clic en **¿No tienes cuenta? → Regístrate**.
3. Completar el formulario:
   - **Nombre completo** — nombre y apellido(s).
   - **Correo electrónico** — debe ser una dirección válida.
   - **Contraseña** — mínimo 8 caracteres.
   - **Confirmar contraseña** — debe coincidir con la anterior.
4. Hacer clic en **Crear cuenta**.
5. Al completarse el registro, la plataforma redirige automáticamente al inicio de sesión con el mensaje *"¡Cuenta creada! Inicia sesión."*

> **Nota:** Las cuentas nuevas tienen el rol **Estudiante** por defecto. Para obtener acceso de Instructor, contactar al administrador de la plataforma.

### 2.2 Inicio de sesión

1. Ingresar el **correo electrónico** y **contraseña**.
2. (Opcional) Activar **Recordar sesión por 30 días** para mantener la sesión activa.
3. Hacer clic en **Iniciar sesión**.

Si el correo o la contraseña son incorrectos, se mostrará el mensaje *"Correo o contraseña incorrectos."* — revisar que el correo no tenga espacios adicionales.

### 2.3 Inicio de sesión con cuenta institucional (SSO)

Si la institución tiene configurado el acceso único (Google Workspace o Microsoft Entra ID):

1. Hacer clic en el botón correspondiente (**Continuar con Google** / **Continuar con Microsoft**).
2. Completar la autenticación en la ventana emergente de la institución.
3. La plataforma creará o vinculará la cuenta automáticamente.

### 2.4 Cambiar idioma y tema

- El selector de **idioma** (Español / English) se encuentra en el menú de navegación superior.
- El selector de **tema** (claro / oscuro) también está disponible en la misma barra.

---

## 3. Guía del Estudiante

### 3.1 Dashboard

Al iniciar sesión, el estudiante llega al **Dashboard** (`/dashboard`), que muestra:

- Resumen de cursos en progreso con barra de avance porcentual.
- Botón de acceso directo al próximo contenido pendiente de cada curso.
- Contador de notificaciones no leídas.

### 3.2 Explorar el catálogo de cursos

1. Hacer clic en **Cursos** en la barra de navegación.
2. Usar el buscador y los filtros disponibles:
   - **Búsqueda por texto** — busca en título y descripción.
   - **Nivel** — Principiante / Intermedio / Avanzado.
3. Hacer clic en una tarjeta de curso para ver su detalle.

La página de detalle muestra la descripción completa, el nivel, el idioma, el instructor y el currículo completo (módulos y contenidos).

### 3.3 Matricularse en un curso

1. En la página de detalle del curso, hacer clic en **Matricularme**.
2. El curso aparecerá en el Dashboard y en la sección **Mis cursos**.

> Los cursos solo están disponibles para matrícula si el instructor los ha **publicado**.

### 3.4 Consumir contenido

1. Desde el Dashboard o desde **Mis cursos**, hacer clic en **Continuar** o en el nombre del curso.
2. El visor de curso muestra el listado de módulos y contenidos en el panel izquierdo.
3. Hacer clic en un ítem de contenido para abrirlo:
   - **Video** — se reproduce en el visor integrado.
   - **Documento** — se abre en el lector en línea o se descarga.
   - **Quiz** — se presenta el cuestionario de evaluación.
   - **Tarea / Sesión en vivo** — muestra las instrucciones correspondientes.
4. Al terminar un ítem, marcar **Completado** para registrar el progreso.

### 3.5 Quizzes (cuestionarios)

1. Al abrir un contenido de tipo **Quiz**, se presentan las preguntas con opciones de respuesta.
2. Seleccionar la respuesta para cada pregunta y hacer clic en **Enviar respuestas**.
3. La plataforma mostrará el resultado y la retroalimentación por pregunta.
4. El progreso del curso se actualiza automáticamente.

> Se requiere obtener **≥ 60%** en los quizzes para que el contenido cuente como completado hacia la certificación.

### 3.6 Ver el progreso de un curso

En la página del curso, el indicador de progreso muestra el porcentaje de ítems completados respecto al total. El progreso también se puede consultar en el Dashboard.

### 3.7 Perfil y credenciales

1. Hacer clic en el nombre de usuario o avatar en la esquina superior derecha → **Perfil**.
2. La página de perfil muestra:
   - Nombre completo, correo y rol.
   - Sección **Microcredenciales** con todos los badges obtenidos.

#### Reclamar una credencial

Una vez completado un curso al **100%**, aparecerá el botón **Reclamar credenciales**:

1. Hacer clic en **Reclamar credenciales**.
2. Si el progreso es 100%, se emite el badge automáticamente.
3. La credencial aparece en la lista con la fecha de emisión.

#### Descargar el certificado PDF

En cada badge de la sección Microcredenciales hay dos acciones:

- **Verificar** — abre la página pública de verificación del certificado (URL compartible).
- **PDF** — descarga directamente el certificado en formato PDF.

### 3.8 Verificar un certificado públicamente

Cualquier persona (sin necesidad de iniciar sesión) puede verificar una credencial accediendo a:

```
https://<dominio-plataforma>/verify/<ID-de-credencial>
```

La página muestra el nombre del receptor, el curso completado, la fecha de emisión y una indicación de **Credencial verificada**. También permite descargar el PDF desde ahí.

---

## 4. Guía del Instructor

> El rol de **Instructor** da acceso a todo lo descrito en la [Guía del Estudiante](#3-guía-del-estudiante) y además al Panel Instructor.

### 4.1 Acceder al Panel Instructor

En la barra de navegación aparece el enlace **Panel Instructor** (ícono de lápiz). Al hacer clic se abre el listado de cursos propios.

### 4.2 Mis cursos — vista general

La pantalla principal muestra una cuadrícula con todos los cursos creados por el instructor. Cada tarjeta indica:

- Título del curso y nivel.
- Cantidad de estudiantes matriculados.
- Cantidad de módulos.
- Estado: **Publicado** (verde) / **Borrador** (gris).
- Tres acciones: **Editar**, **Publicar/Despublicar**, **Eliminar**.

### 4.3 Crear un nuevo curso

1. Hacer clic en **+ Nuevo curso**.
2. Completar el formulario:
   - **Título** — nombre completo del curso (mínimo 3 caracteres).
   - **Slug** — identificador en la URL, se genera automáticamente desde el título pero puede editarse. Solo acepta letras minúsculas, números y guiones (`-`).
   - **Descripción** — presentación del curso para los estudiantes.
   - **Nivel** — Principiante / Intermedio / Avanzado.
   - **Idioma** — código de idioma (ej. `es`, `en`).
   - **Etiquetas** — palabras clave separadas por comas.
3. Hacer clic en **Crear curso**.

El curso se crea en estado **Borrador** (no visible para estudiantes). La plataforma redirige automáticamente al editor de currículo.

### 4.4 Editar los detalles del curso

En la pantalla de edición del curso, la pestaña **Detalles** permite modificar todos los campos del formulario de creación más:

- **URL de miniatura** — enlace a la imagen de portada del curso.

Hacer clic en **Guardar cambios** para confirmar. Aparecerá el mensaje *"Guardado ✓"*.

### 4.5 Gestionar el currículo

La pestaña **Currículo** muestra el árbol de módulos y contenidos del curso.

#### Agregar un módulo

1. En la sección inferior de la pestaña, completar el formulario **Agregar módulo**:
   - **Título del módulo**.
   - **Posición** — orden de aparición (número entero positivo).
2. Hacer clic en **Agregar módulo**.

El módulo aparece en la lista como un acordeón expandible.

#### Editar un módulo

1. Hacer clic en el botón **Editar** (lápiz) junto al nombre del módulo.
2. Modificar el título, descripción, posición o si el contenido es descargable.
3. Hacer clic en **Guardar** para confirmar los cambios.

#### Eliminar un módulo

1. Hacer clic en el ícono de papelera junto al módulo.
2. Confirmar la eliminación en el diálogo de confirmación del navegador.

> **Atención:** Eliminar un módulo elimina también todos sus ítems de contenido.

#### Agregar contenido a un módulo

1. Expandir el módulo haciendo clic sobre él.
2. En la sección **Agregar contenido**, completar:
   - **Tipo** — Video / Documento / Quiz / Tarea / Sesión en vivo.
   - **Título**.
   - **URL del contenido** — enlace al recurso (video, PDF, etc.).
   - **Duración** — en segundos (opcional, para videos).
   - **Posición** — orden dentro del módulo.
   - **Vista previa gratuita** — si está activo, los usuarios no matriculados pueden ver este ítem.
3. Hacer clic en **Agregar**.

#### Editar o eliminar un ítem de contenido

- **Editar**: hacer clic en el lápiz junto al ítem, modificar los campos y hacer clic en **Guardar**.
- **Eliminar**: hacer clic en la papelera junto al ítem y confirmar.

### 4.6 Publicar y despublicar un curso

Un curso en estado **Borrador** no es visible en el catálogo público. Para publicarlo:

**Desde el Panel Instructor:**
- Hacer clic en el botón **Publicar** en la tarjeta del curso.

**Desde el editor del curso:**
- Hacer clic en el botón **Publicar** en la esquina superior derecha del editor.

El estado cambia a **Publicado** de inmediato y el curso aparece en el catálogo para todos los estudiantes.

Para **despublicar** un curso ya activo (por ejemplo, para realizar cambios), hacer clic en el mismo botón (que ahora dirá **Despublicar**). Los estudiantes ya matriculados conservan el acceso a su progreso.

### 4.7 Eliminar un curso

1. En el Panel Instructor, hacer clic en el ícono de papelera de la tarjeta del curso.
2. Confirmar la eliminación.

> **Atención:** Esta acción es irreversible. Se eliminará el curso, todos sus módulos, contenidos y matrículas asociadas.

---

## 5. Guía del Administrador

El rol de **Administrador** tiene las mismas capacidades que el Instructor, con las siguientes diferencias:

- Puede editar, publicar, despublicar y eliminar **cualquier curso** de la plataforma, no solo los propios.
- En el Panel Instructor verá los cursos de todos los instructores.
- Puede emitir credenciales para cualquier usuario independientemente del progreso (mediante la API interna).

> La gestión avanzada de usuarios (asignar roles, activar/desactivar cuentas) se realiza actualmente a través de la base de datos o la API. Una interfaz de administración web está prevista en futuras versiones.

---

## 6. Credenciales y certificados PDF

Universidad X emite credenciales compatibles con el estándar **Open Badges 3.0**, que pueden ser verificadas externamente por cualquier institución o empleador.

### 6.1 Proceso de emisión

1. El estudiante completa un curso al **100%** (todos los ítems marcados como completados y quizzes con ≥ 60%).
2. El botón **Reclamar credenciales** aparece habilitado en la página de **Perfil**.
3. Al hacer clic, la plataforma emite la credencial y la registra en el perfil.

### 6.2 Formatos disponibles

| Formato | Descripción |
|---------|-------------|
| **Open Badge 3.0 (JSON)** | Credencial verificable en formato estándar. Accesible via el enlace *"Verificar"* en el perfil. |
| **Certificado PDF** | Documento A4 horizontal descargable con nombre del receptor, curso, fecha e ID de verificación. |
| **Página de verificación** | URL pública compartible: `<dominio>/verify/<ID>`. No requiere cuenta. |

### 6.3 Compartir la credencial

La URL de verificación (`/verify/<ID>`) puede compartirse directamente en LinkedIn, correo electrónico o cualquier perfil profesional. Quien acceda verá los datos del certificado y el indicador de **Credencial verificada**.

---

## 7. Soporte técnico

### 7.1 Crear un ticket de soporte

1. Hacer clic en **Soporte** en la barra de navegación.
2. Hacer clic en **Nuevo ticket**.
3. Completar el asunto y la descripción del problema.
4. Hacer clic en **Enviar**.

### 7.2 Seguimiento de tickets

En la sección **Soporte** se listan todos los tickets del usuario con su estado:

- **Abierto** — pendiente de atención.
- **En progreso** — siendo atendido por el equipo de soporte.
- **Resuelto** — cerrado.

Al hacer clic en un ticket se puede ver el hilo de conversación con el equipo de soporte y agregar respuestas adicionales.

### 7.3 Contacto directo

Para problemas urgentes o de acceso que impidan usar la plataforma, contactar al equipo de soporte en:

- **Correo:** soporte@universidadx.com
- **Interno:** a través del sistema de tickets con asunto *"URGENTE — [descripción breve]"*

---

*Universidad X · Plataforma de Aprendizaje Adaptativo · v1.0*

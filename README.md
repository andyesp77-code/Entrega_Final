# Simulador de cajero automático

## Guía de uso

El simulador permite ingresar como administrador o como cliente. El
administrador gestiona las cuentas; los clientes consultan su saldo y realizan
operaciones bancarias. Es una práctica: no se maneja dinero real.

Para comenzar, abre el simulador con un servidor local, por ejemplo con la
extensión **Live Server** de Visual Studio Code (si abres el archivo
**index.html** con doble clic, las cuentas no se pueden cargar). Al abrirse, el
simulador carga las cuentas registradas; cuando termina, se habilitan los
campos de acceso. Escribe el usuario y la clave y selecciona **Ingresar**.
También puedes presionar
**Enter** desde los campos de acceso. El usuario puede escribirse en mayúsculas
o minúsculas.

### Cuentas de prueba

| Usuario | Clave | Perfil |
| --- | ---: | --- |
| JUAN | 1234 | Cliente |
| PEDRO | 2345 | Cliente |
| MARIA | 3456 | Cliente |
| ANA | 4567 | Cliente |
| ANDREA | 5678 | Cliente |
| ADMIN | 2990 | Administrador |

Estas son las cuentas con las que el simulador comienza la primera vez. Si
luego se cambian claves o se eliminan cuentas, la tabla deja de coincidir con
los datos guardados (ver **Datos guardados**).

## Opciones del administrador

Ingresa con ADMIN para acceder a estas opciones:

- **Listar usuarios:** muestra las cuentas registradas, su ID, clave, tipo de
  cuenta y saldo inicial. El saldo de ADMIN figura como no aplicable.
- **Buscar usuario:** busca nombres completos o parciales. La búsqueda no
  distingue mayúsculas de minúsculas. Si dejas el campo vacío, se muestran
  todos los usuarios.
- **Nuevo usuario:** permite registrar una cuenta con nombre, clave, tipo de
  cuenta y saldo inicial. El ID se asigna automáticamente y el nombre se guarda
  en mayúsculas.
- **Blanquear clave:** establece la clave de la cuenta seleccionada en 1111.
  Cuando ese cliente ingrese, verá un aviso que le recomienda cambiarla.
- **Cambiar clave:** permite cambiar la clave de una cuenta indicando su ID.
- **Eliminar usuario:** elimina la cuenta indicada por ID. ADMIN no se puede
  eliminar.
- **Salir:** termina la sesión. Para volver a ingresar, recarga la página.

Para blanquear, cambiar la clave o eliminar una cuenta, consulta su ID en el
listado o en los resultados de búsqueda. El formulario muestra el nombre
asociado al ID cuando sales del campo, o avisa si el usuario no existe.

Al registrar un usuario:

- El nombre no puede estar vacío ni repetirse y admite hasta 20 caracteres.
- La clave debe ser un número de cuatro dígitos entre 1000 y 9999 (no puede
  comenzar con 0).
- El tipo de cuenta debe ser **Sueldo** o **Caja de Ahorro**.
- El saldo inicial debe ser un importe mayor o igual a cero. Se aceptan
  hasta dos decimales con punto (por ejemplo, 1500.50), sin comas ni el
  signo $.

## Opciones del cliente

Ingresa con una de las cuentas de cliente y su clave. El saldo actual aparece
al entrar. Puedes realizar estas operaciones:

- **Consultar saldo:** muestra el saldo disponible sin modificar la cuenta.
- **Consultar movimientos:** muestra el historial de depósitos y extracciones.
  Puedes filtrar por **Todos**, **Ingresos** (depósitos) o **Egresos**
  (extracciones).
- **Depositar:** suma el importe ingresado al saldo.
- **Extraer:** descuenta el importe si hay fondos suficientes.
- **Cambiar clave:** cambia la clave de la cuenta con la que ingresaste. La
  nueva clave sigue la misma regla: cuatro dígitos entre 1000 y 9999.
- **Salir:** termina la sesión. Para volver a ingresar, recarga la página.

Los importes de depósito y extracción deben ser números mayores que cero. Se
aceptan hasta dos decimales con punto, sin comas ni el signo $. Si el importe
no respeta ese formato, el campo lo indica y la operación no se envía. En
pantalla, los importes
se muestran con punto de miles y coma decimal (por ejemplo, $1.500,50), y los
decimales aparecen solo cuando el importe los tiene. No se puede extraer más
que el saldo disponible: en ese caso se informa **Saldo Insuficiente**. Los
depósitos y extracciones confirmados se incorporan al historial; las consultas,
los cambios de clave, las cancelaciones y las operaciones rechazadas no generan
movimientos.

Al consultar los movimientos se muestran el saldo inicial de la cuenta y, por
cada operación, la fecha y hora, el importe, el saldo anterior y el saldo
posterior, además del saldo actual. Si no hay movimientos, la pantalla lo
informa. Un filtro sin resultados también se indica en el listado. Al elegir
cualquier otra opción del menú, o después de un depósito o una extracción, el
historial se oculta: selecciona **Consultar movimientos** otra vez para verlo
actualizado.

Unos segundos después de ingresar aparece un aviso con información sobre la
clave (si fue blanqueada) o sobre el último movimiento. Puedes usar el cajero
sin esperar a que aparezca; al elegir cualquier opción del menú, el aviso se
oculta.

## Restricciones y mensajes

- Hay hasta **tres intentos** para ingresar. Cada usuario o clave incorrectos
  cuenta como un intento. Al agotarlos, el acceso queda bloqueado hasta recargar
  la página.
- Si falta un dato o la clave no tiene cuatro dígitos entre 1000 y 9999, el
  simulador lo avisa y **no** se descuenta un intento.
- Una sesión de cliente se cierra después de **cinco minutos sin actividad**.
  Para volver a usar el simulador, recarga la página. El panel de administrador
  no se cierra por inactividad.
- **ADMIN** es una cuenta administrativa: no puede consultar saldo ni realizar
  depósitos o extracciones.
- El administrador también puede cambiar o blanquear la clave de ADMIN. Si lo
  hace, debe recordar la nueva clave para volver a ingresar.
- El ID de una cuenta se utiliza para administrarla; el inicio de sesión se
  realiza con el nombre y la clave.
- El administrador puede ver las claves de todas las cuentas en el listado.
- Cuando una operación se completa, el simulador lo confirma de dos formas:
  - **Depósitos y extracciones:** se abre una ventana con el importe y el saldo
    actual. Selecciona **OK** para cerrarla y continuar.
  - **Las demás operaciones** (cambio y blanqueo de clave, alta y eliminación de
    usuarios): aparece un mensaje breve en la parte superior de la pantalla,
    que se cierra solo a los pocos segundos.
- Algunos rechazos también se avisan con ese mensaje breve, en rojo:
  **Saldo Insuficiente**, el intento de eliminar a ADMIN, el alta de un usuario
  ya registrado y el bloqueo por superar los tres intentos de ingreso. El motivo
  queda además en el recuadro **Resultado**.
- Si una operación no se completa, el simulador muestra un mensaje. Los datos
  ingresados se conservan en el formulario para que puedas corregirlos. Al
  cancelar, el formulario se limpia, la operación no se realiza y aparece un
  mensaje breve en naranja que indica **Operación cancelada**.
- Si las cuentas no se pueden cargar (por ejemplo, porque el simulador se abrió
  sin un servidor local o porque los datos guardados están dañados), el acceso
  queda deshabilitado y la pantalla de inicio informa el problema. Revisa cómo
  abriste el simulador y recarga la página.

## Datos guardados

Los usuarios, sus claves, saldos e historiales se conservan en el navegador
usado para el simulador, incluso al recargar o cerrar la página. Los cambios de
clave y las cuentas nuevas o eliminadas también se mantienen.

Si se abre el simulador en otro navegador o dispositivo, no se comparten
automáticamente los datos. Borrar los datos del navegador elimina la
información guardada y el simulador vuelve a comenzar con las cuentas de
prueba. Recargar la página restablece la sesión y el filtro de movimientos,
pero no borra las cuentas ni sus operaciones.

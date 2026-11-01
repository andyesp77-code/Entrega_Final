// ******* Funciones de validación y persistencia de datos ******//

//Función que valida que la clave sea un número entero de 4 dígitos (entre 1000 y 9999)
function validarClave(clave) {
    const claveNumero = parseInt(clave);

    return claveNumero >= 1000 && claveNumero <= 9999;
}

//función que valida los movimientos de un usuario
function validarMovimientos(usuario) {
    if (usuario.movimientos === undefined) {
        return true;
    }

    const { movimientos } = usuario;

    if (movimientos.some((movimiento) =>
        typeof movimiento?.importe !== `number` || movimiento.importe <= 0 ||
        (movimiento.tipo !== `Depósito` && movimiento.tipo !== `Extracción`)
    )) {
        return false;
    }

    return usuario.nombre !== `ADMIN` || movimientos.length === 0;
}

//función que valida que el id sea un número entero positivo
function validarId(id) {
    return id > 0 && id === parseInt(id);
}

//función que valida los datos de un usuario y de los saldos de su cuenta
function validarUsuario(usuario) {
    if (!validarId(usuario?.id)) {
        return false;
    }

    if (typeof usuario.nombre !== `string` || usuario.nombre === `` ||
        usuario.nombre !== usuario.nombre.trim().toUpperCase()) {
        return false;
    }

    if (typeof usuario.clave !== `number` || !validarClave(usuario.clave)) {
        return false;
    }

    const saldos = [usuario.saldoInicio, usuario.saldoActual];

    if (saldos.some((saldo) => typeof saldo !== `number` || saldo < 0)) {
        return false;
    }

    const tipoCuentaValido = usuario.nombre === `ADMIN`
        ? usuario.tipoCta === `Administrador`
        : usuario.tipoCta === `Sueldo` || usuario.tipoCta === `Caja Ahorro`;

    if (!tipoCuentaValido) {
        return false;
    }

    return validarMovimientos(usuario);
}

//Función que valida los datos del simulador antes de guardarlos y al recuperarlos de localStorage
function validarDatosGuardados(datos) {
    const usuarios = datos?.usuariosRegistrados;

    //** se rechaza los datos si encuentra algún usuario inválido */
    if (usuarios.some((usuario) => !validarUsuario(usuario))) {
        return false;
    }

    //** se obtiene el mayor id de los usuarios registrados */
    const mayorId = usuarios.reduce((maxId, usuario) => Math.max(maxId, usuario.id), 0);

    //** devuelve true si existe el usuario ADMIN y el próximo id es válido */
    return usuarios.some((usuario) => usuario.nombre === `ADMIN`) &&
        validarId(datos.proximoIdUsuario) &&
        datos.proximoIdUsuario > mayorId;
}

//Muestra un mensaje emergente con Toastify. tipo: "exito", "error" o "aviso"
function mostrarMensaje(texto, tipo) {
    Toastify({
        text: texto,
        duration: 3000,
        close: false,
        gravity: `top`,
        position: `center`,
        stopOnFocus: false,
        className: `toast-${tipo}`
    }).showToast();
}

//****** PERSISTENCIA DE DATOS EN LOCAL STORAGE ******//
//Valida los datos, los guarda en localStorage y recién después actualiza el array en memoria
function guardarDatos(datos, mensajeResultado) {
    try {
        if (!validarDatosGuardados(datos)) {
            mensajeResultado.textContent = `La operación produce datos no válidos y no se guardó`;
            return false;
        }

        localStorage.setItem(claveAlmacenamiento, JSON.stringify(datos));
    } catch (err) {
        mensajeResultado.textContent = err.message;
        return false;
    }

    usuariosRegistrados.splice(0, usuariosRegistrados.length,...datos.usuariosRegistrados);
    proximoIdUsuario = datos.proximoIdUsuario;
    return true;
}

// Reemplaza un usuario modificado dentro de una copia del array y guarda el resultado
function guardarUsuario(usuarioActualizado, mensajeResultado) {
    const usuariosActualizados = usuariosRegistrados.map((usuario) =>
        usuario.id === usuarioActualizado.id ? usuarioActualizado : usuario
    );

    return guardarDatos({
        usuariosRegistrados: usuariosActualizados,
        proximoIdUsuario
    }, mensajeResultado);
}

//****** CONSUMO DE DATOS DESDE data.json  ******//
//Obtiene los usuarios iniciales del archivo data.json
//Si la consulta falla, se lanza un error que llega al try-catch de cargarDatos, que se lo informa al usuario
async function obtenerUsuariosIniciales() {
    try {
        const response = await fetch(urlUsuarios);

        //si el estado no está entre 200 y 299 (ej: 404 archivo no encontrado) se lanza un error manual
        if (!response.ok) {
            throw new Error(`error ${response.status}`);
        }

        const usuarios = await response.json();

        return {
            usuariosRegistrados: usuarios,
            proximoIdUsuario: usuarios.reduce((maxId, usuario) => Math.max(maxId, usuario.id), 0) + 1
        };
    } catch (err) {
        throw new Error(`No se pudo obtener el archivo de usuarios (${err.message})`);
    }
}

//Recupera los datos de localStorage. Si no existen, obtiene los usuarios de data.json
//Si la carga falla, informa el error y el ingreso queda deshabilitado
async function cargarDatos() {
    let datosCargados = false;

    deshabilitarIngreso(true);
    mensajeInicio.textContent = `Cargando usuarios registrados, aguarde un momento...`;

    try {
        let datos = JSON.parse(
            localStorage.getItem(claveAlmacenamiento) ?? `null`
        );

        //si localStorage no tiene datos, los usuarios se obtienen de data.json mediante fetch
        if (datos === null) {
            datos = await obtenerUsuariosIniciales();
        }

        if (!validarDatosGuardados(datos)) {
            throw new Error(`Los datos no tienen un formato válido`);
        }

        datosCargados = guardarDatos({
            usuariosRegistrados: datos.usuariosRegistrados.map((usuario) => ({
                ...usuario, movimientos: usuario.movimientos ?? []
            })),
            proximoIdUsuario: datos.proximoIdUsuario
        }, mensajeInicio);

        if (datosCargados) {
            mensajeInicio.textContent = `Usuarios cargados. Dispone de 3 intentos para ingresar`;
        }
    } catch (err) {
        mensajeInicio.textContent = `No se pudieron cargar los usuarios: ${err.message}. Recargue la página para intentar nuevamente`;
    } finally {
        deshabilitarIngreso(!datosCargados);
    }
}

//****** FUNCIONES DEL PANEL ADMINISTRADOR ******//
//Responsabilidad: las funciones que realizan la gestión de usuarios
//Listado de usuarios registrados en el sistema 
function listarUsuarios(usuarios = usuariosRegistrados) {
    listaUsuarios.innerHTML = ``;

    usuarios.forEach((usuario) => {
        const textoSaldoInicio = usuario.nombre === `ADMIN` ? `No aplica` : `$${formatearImporte(usuario.saldoInicio)}`;

        const contenedor = document.createElement(`div`);
        contenedor.className = `usuario`;
        contenedor.innerHTML = `<h4></h4>
                               <p>ID: ${usuario.id}</p>
                               <p>Clave: ${usuario.clave}</p>
                               <p>Tipo de Cuenta: ${usuario.tipoCta}</p>
                               <p>Saldo inicial: ${textoSaldoInicio}</p>`;
        contenedor.querySelector(`h4`).textContent = `Nombre: ${usuario.nombre}`;
        listaUsuarios.appendChild(contenedor);
    });

    cantidadUsuarios.textContent = `${usuarios.length} usuarios`;
    contenedorUsuarios.classList.remove(`oculto`);

    mensajeAdministrador.textContent = usuarios.length === 0
        ? `No hay usuarios para mostrar.`
        : `Listado de usuarios actualizado.`;
}

//Acepta búsqueda por nombres parciales y mostrará todos los que coincidan con el texto ingresado
function buscarUsuario(nombreUsuario) {
    nombreUsuario = nombreUsuario.trim().toUpperCase();

    const usuariosEncontrados = usuariosRegistrados.filter((usuario) => usuario.nombre.includes(nombreUsuario));

    listarUsuarios(usuariosEncontrados);

    mensajeAdministrador.textContent = usuariosEncontrados.length === 0
        ? `No se encontraron usuarios`
        : `Usuarios encontrados: ${usuariosEncontrados.length}`;
}

//Devuelve el usuario que tiene el id correcto
function obtenerUsuarioPorId(idUsuario) {
    return usuariosRegistrados.find((usuario) => usuario.id === idUsuario);
}

//Busca un usuario por su id y muestra el nombre en el mensaje de resultado
function buscarUsuarioPorId(inputIdUsuario, mensajeUsuario) {
    const idIngresado = inputIdUsuario.value.trim();
    mensajeUsuario.textContent = ``;

    if (idIngresado === ``) {
        return;
    }

    const usuario = obtenerUsuarioPorId(parseFloat(idIngresado));

    mensajeUsuario.textContent = usuario
        ? `Nombre: ${usuario.nombre}`
        : `Usuario no encontrado`;
}

//Blanquear la clave fijando un valor de 1111
function blanquearClave(idUsuario) {
    const usuario = obtenerUsuarioPorId(idUsuario);

    if (!usuario) {
        mensajeAdministrador.textContent = `Usuario no encontrado`;
        return false;
    }

    if (!guardarUsuario({ ...usuario, clave: 1111 }, mensajeAdministrador)) {
        return false;
    }

    mostrarMensaje(`La clave de ${usuario.nombre} fue blanqueada. Nueva clave: 1111`, `exito`);
    return true;
}

//Cambiar la clave de un usuario por una nueva clave ingresada
function cambiarClaveDeUsuario(idUsuario, clave, mensajeResultado) {
    if (!validarClave(clave)) {
        mensajeResultado.textContent = `La clave debe ser un número entero entre 1000 y 9999`;
        return false;
    }

    const usuario = obtenerUsuarioPorId(idUsuario);

    if (!usuario) {
        mensajeResultado.textContent = `Usuario no encontrado`;
        return false;
    }

    if (!guardarUsuario({ ...usuario, clave }, mensajeResultado)) {
        return false;
    }
    mostrarMensaje(`La clave de ${usuario.nombre} fue cambiada con éxito. Nueva clave: ${clave}`, `exito`);
    return true;
}

//Elimina un usuario del sistema, excepto el usuario ADMIN
function eliminarUsuario(idUsuario) {
    const usuario = obtenerUsuarioPorId(idUsuario);

    if (!usuario) {
        mensajeAdministrador.textContent = `Usuario no encontrado`;
        return false;
    }

    if (usuario.nombre === `ADMIN`) {
        mensajeAdministrador.textContent = `El usuario ADMIN no puede ser eliminado`;
        mostrarMensaje(`El usuario ADMIN no puede ser eliminado`, `error`);
        return false;
    }

    const usuariosActualizados = usuariosRegistrados.filter((usuario) => usuario.id !== idUsuario);

    if (!guardarDatos({
        usuariosRegistrados: usuariosActualizados,
        proximoIdUsuario
    }, mensajeAdministrador)) {
        return false;
    }

    mostrarMensaje(`El usuario ${usuario.nombre} fue eliminado del sistema`, `exito`);
    return true;
}

//ingresar un nuevo usuario al sistema
function registroUsuario(nombre, clave, saldoInicio, tipoCta) {
    nombre = nombre.trim().toUpperCase();

    if (!validarClave(clave)) {
        mensajeAdministrador.textContent = `La clave debe ser un número entero entre 1000 y 9999`;
        return false;
    }

    const usuarioYaRegistrado = usuariosRegistrados.some((usuario) => usuario.nombre === nombre);

    if (usuarioYaRegistrado) {
        mensajeAdministrador.textContent = `El usuario ya está registrado`;
        mostrarMensaje(`El usuario ${nombre} ya está registrado`, `error`);
        return false;
    }

    if (isNaN(saldoInicio) || saldoInicio < 0 || saldoInicio === Infinity) {
        mensajeAdministrador.textContent = `El saldo inicial debe ser un número válido mayor o igual a cero`;
        return false;
    }

    if (tipoCta !== `Sueldo` && tipoCta !== `Caja Ahorro`) {
        mensajeAdministrador.textContent = `Seleccione Sueldo o Caja de Ahorro como tipo de cuenta`;
        return false;
    }

    const nuevoUsuario = new Usuario(proximoIdUsuario, nombre, clave, saldoInicio, saldoInicio, tipoCta);

    if (!guardarDatos({
        usuariosRegistrados: [...usuariosRegistrados, nuevoUsuario],
        proximoIdUsuario: proximoIdUsuario + 1
    }, mensajeAdministrador)) {
        return false;
    }

    mostrarMensaje(`Nuevo usuario registrado: ${nombre} - ID: ${nuevoUsuario.id}`, `exito`);
    return true;
}

//****** FUNCIONES DE LA OPERACION DEL CAJERO AUTOMATICO ******//
//Devuelve el número con dos dígitos (ej: 5 -> 05)
function dosDigitos(numero) {
    return numero < 10 ? `0${numero}` : `${numero}`;
}

//Devuelve el importe con punto de miles y coma decimal. Muestra 2 decimales solo si el importe los tiene (ej: 1500 -> 1.500, 1500.5 -> 1.500,50)
function formatearImporte(importe) {
    const decimales = importe === parseInt(importe) ? 0 : 2;

    return importe.toLocaleString(`es-AR`, {
        minimumFractionDigits: decimales,
        maximumFractionDigits: 2
    });
}

//Devuelve la fecha y hora del sistema con formato DD-MM-AAAA hh:mm
function obtenerFechaMovimiento() {
    const fechaActual = new Date();
    const dia = dosDigitos(fechaActual.getDate());
    const mes = dosDigitos(fechaActual.getMonth() + 1);
    const anio = fechaActual.getFullYear();
    const horas = dosDigitos(fechaActual.getHours());
    const minutos = dosDigitos(fechaActual.getMinutes());

    return `${dia}-${mes}-${anio} ${horas}:${minutos}`;
}

//Responsabilidades: Las funciones que realizan la gestión de la cuenta del usuario
//Registrar un movimiento en el historial de movimientos del usuario
function registrarMovimiento(usuario, tipo, importe, saldoAnterior) {
    const movimiento = {
        tipo,
        importe,
        saldoAnterior,
        saldoActual: usuario.saldoActual,
        fecha: obtenerFechaMovimiento()
    };

    usuario.movimientos.push(movimiento);
}

//Realiza un movimiento de depósito o extracción, actualiza el saldo y registra el movimiento
function realizarMovimiento(usuario, valor, tipo) {
    if (tipo === `Extracción` && valor > usuario.saldoActual) {
        mostrarMensaje(`Saldo Insuficiente`, `error`);
        saldoActualCliente.textContent = `Saldo actual: $${formatearImporte(usuario.saldoActual)}`;
        return false;
    }

    const usuarioActualizado = { ...usuario, movimientos: [...usuario.movimientos] };
    const saldoAnterior = usuarioActualizado.saldoActual;
    usuarioActualizado.saldoActual = tipo === `Depósito`
        ? saldoAnterior + valor
        : saldoAnterior - valor;
    registrarMovimiento(usuarioActualizado, tipo, valor, saldoAnterior);

    if (!guardarUsuario(usuarioActualizado, mensajeOperacion)) {
        return false;
    }
    //aplicación de SweetAlert para mostrar un mensaje emergente con el resultado de la operación
    Swal.fire({
        title: tipo === `Depósito`
            ? `Depósito realizado`
            : `Extracción realizada`,
        text: `Importe: $${formatearImporte(valor)}. Saldo actual: $${formatearImporte(usuarioActualizado.saldoActual)}`,
        icon: `success`,
        draggable: true
    });
    mensajeOperacion.textContent = `Seleccione una operación`;
    saldoActualCliente.textContent = `Saldo actual: $${formatearImporte(usuarioActualizado.saldoActual)}`;

    //** oculta el listado de movimientos para no mostrar datos desactualizados */
    contenedorMovimientos.classList.add(`oculto`);
    return true;
}

//Funciones que llaman a realizarMovimiento con el tipo de movimiento correspondiente (depósito o extracción)
function extraccionDinero(usuario, valor) {
    return realizarMovimiento(usuario, valor, `Extracción`);
}

function depositoDinero(usuario, valor) {
    return realizarMovimiento(usuario, valor, `Depósito`);
}

//Consulta del saldo actual del usuario
function consultarSaldo(usuario) {
    mensajeOperacion.textContent = `Consulta de saldo realizada`;
    saldoActualCliente.textContent = `Saldo actual: $${formatearImporte(usuario.saldoActual)}`;
}

//Listado de movimientos del usuario, filtrando por tipo de movimiento
function listarMovimientos(usuario) {
    const { saldoInicio, saldoActual, movimientos } = usuario;
    const tipoSeleccionado = selectFiltroMovimientos.value;
    const movimientosFiltrados = tipoSeleccionado === ``
        ? movimientos
        : movimientos.filter((movimiento) => movimiento.tipo === tipoSeleccionado);
    const saldoReferencia = movimientos[0]?.saldoAnterior ?? saldoActual;
    const mensajeSinMovimientos = movimientos.length === 0
        ? `No hay movimientos registrados.`
        : `No hay movimientos de este tipo.`;

    saldoInicialMovimientos.textContent = `Saldo inicial de la cuenta: $${formatearImporte(saldoInicio)}`;
    saldoReferenciaMovimientos.textContent = saldoReferencia === saldoInicio
        ? ``
        : `Saldo al comenzar el registro: $${formatearImporte(saldoReferencia)}`;

    listaMovimientos.innerHTML = movimientosFiltrados.length === 0
        ? `<p>${mensajeSinMovimientos}</p>`
        : ``;

    movimientosFiltrados.forEach(({ tipo, importe, saldoAnterior, saldoActual: saldoMovimiento, fecha }, indice) => {
        const contenedor = document.createElement(`div`);
        const signo = tipo === `Depósito` ? `+` : `-`;

        contenedor.className = `movimiento`;
        contenedor.innerHTML = `<h4>${indice + 1}. ${tipo}</h4>
                               <p>Fecha: ${fecha ?? `No registrada`}</p>
                               <p>Importe: ${signo}$${formatearImporte(importe)}</p>
                               <p>Saldo anterior: $${formatearImporte(saldoAnterior)}</p>
                               <p>Saldo después del movimiento: $${formatearImporte(saldoMovimiento)}</p>`;
        listaMovimientos.appendChild(contenedor);
    });

    saldoActualMovimientos.textContent = `Saldo actual: $${formatearImporte(saldoActual)}`;
    contenedorMovimientos.classList.remove(`oculto`);
}

// Inicio del simulador - el finally de cargarDatos habilita el ingreso solo si los datos se cargan correctamente
cargarDatos();

//FUNCIONES DE INTERFAZ Y VALIDACIONES
//Muestra el panel indicado (inicio, cliente o administrador) y oculta los demás
function mostrarPanel(panel) {
    panelInicio.classList.add(`oculto`);
    panelCliente.classList.add(`oculto`);
    panelAdministrador.classList.add(`oculto`);
    panel.classList.remove(`oculto`);
}

// Permite mostrar un formulario específico dentro de un panel, ocultando los demás
function mostrarFormulario(panel, formulario) {
    panel.querySelectorAll(`form`).forEach((formularioActual) => {
        if (formularioActual !== formulario) {
            formularioActual.classList.add(`oculto`);
        }
    });

    formulario.classList.remove(`oculto`);
}

//permite limpiar los campos de un formulario y un mensaje de usuario opcional
function limpiarCamposFormulario(formulario, mensajeUsuario = null) {
    formulario.querySelectorAll(`input, select`).forEach((input) => {
        input.value = ``;
    });

    if (mensajeUsuario) {
        mensajeUsuario.textContent = ``;
    }
}

//Permite limpiar los campos de un formulario y ocultarlo, al cancelar o al completar una operación
function cerrarFormulario(formulario, mensajeUsuario = null) {
    limpiarCamposFormulario(formulario, mensajeUsuario);
    formulario.classList.add(`oculto`);
}

//Permite cancelar un formulario, limpiar sus campos y volver al mensaje inicial del panel
function cancelarFormulario(formulario, mensajeResultado, mensajeUsuario = null) {
    cerrarFormulario(formulario, mensajeUsuario);
    mensajeResultado.textContent = mensajeResultado === mensajeOperacion
        ? `Seleccione una operación`
        : `Seleccione una opción`;
    mostrarMensaje(`Operación cancelada`, `aviso`);
}

//Cierra los formularios del panel del cliente y limpia sus campos, al elegir una consulta
function cerrarFormulariosCliente() {
    panelCliente.querySelectorAll(`form`).forEach((formulario) => {
        cerrarFormulario(formulario);
    });
}

//FUNCIONES DEL MENU DE INICIO
//Habilita o deshabilita los campos y el botón de ingreso
function deshabilitarIngreso(deshabilitado) {
    inputUsuario.disabled = deshabilitado;
    inputClave.disabled = deshabilitado;
    btnIngresar.disabled = deshabilitado;
}

//Función Salir compartida entre los dos menús (administrador y cliente)
function salir() {
    clearTimeout(temporizadorAviso);
    clearTimeout(temporizadorInactividad);
    idUsuarioActual = null;
    limpiarInterfaz();
    deshabilitarIngreso(true);
    mostrarPanel(panelInicio);
    bienvenidaInicio.textContent = `Gracias por utilizar el simulador`;
    mensajeInicio.textContent = `Simulador finalizado - Recargue la página para iniciar nuevamente`;
    intentosInicio.textContent = ``;
}

//Cierra la sesión del cliente cuando no usa el cajero durante el tiempo de inactividad (5 minutos)
function cerrarSesionPorInactividad() {
    salir();
    mensajeInicio.textContent = `Sesión finalizada por inactividad - Recargue la página para iniciar nuevamente`;
}

//Cancela el temporizador anterior y, si hay una sesión abierta, vuelve a contar el tiempo de inactividad desde cero
//El clic en Salir también llega al panel: como salir() deja idUsuarioActual en null, no se arranca otro temporizador
function reiniciarInactividad() {
    clearTimeout(temporizadorInactividad);

    if (idUsuarioActual === null) {
        return;
    }

    temporizadorInactividad = setTimeout(cerrarSesionPorInactividad, tiempoInactividad);
}

//Limpia campos, formularios y listados. No modifica los datos guardados ni la sesión
function limpiarInterfaz() {
    const aplicacion = document.getElementById(`aplicacion`);

    limpiarCamposFormulario(aplicacion);

    aplicacion.querySelectorAll(`form`).forEach((formulario) => {
        formulario.classList.add(`oculto`);
    });

    mensajeUsuarioBlanqueoClave.textContent = ``;
    mensajeUsuarioCambioClave.textContent = ``;
    mensajeUsuarioEliminacion.textContent = ``;
    limpiarListadoUsuarios();

    listaMovimientos.innerHTML = ``;
    saldoInicialMovimientos.textContent = ``;
    saldoReferenciaMovimientos.textContent = ``;
    saldoActualMovimientos.textContent = ``;
    contenedorMovimientos.classList.add(`oculto`);

    mensajeAvisoCliente.textContent = ``;
    contenedorAvisoCliente.classList.add(`oculto`);
}

//FUNCIONES DEL AVISO AL CLIENTE con temporizador
//Arma el aviso del cliente - clave blanqueada o su último movimiento
function obtenerAvisoCliente(usuario) {
    if (usuario.clave === 1111) {
        return `Su clave fue blanqueada. Le recomendamos cambiarla desde "Cambiar clave"`;
    }

    const ultimoMovimiento = usuario.movimientos[usuario.movimientos.length - 1];

    if (!ultimoMovimiento) {
        return `Aún no registra movimientos en su cuenta`;
    }

    const { tipo, importe, fecha } = ultimoMovimiento;
    return `Último movimiento: ${tipo} de $${formatearImporte(importe)} - Fecha: ${fecha ?? `No registrada`}`;
}

//Muestra el aviso 3 segundos después de ingresar, sin bloquear el uso del cajero
function programarAvisoCliente(idUsuario) {
    temporizadorAviso = setTimeout(() => {
        mensajeAvisoCliente.textContent = obtenerAvisoCliente(obtenerUsuarioPorId(idUsuario));
        contenedorAvisoCliente.classList.remove(`oculto`);
    }, 3000);
}

//Al elegir una opción del menú, cancela el aviso pendiente y oculta el que ya se mostró
function ocultarAvisoCliente() {
    clearTimeout(temporizadorAviso);
    mensajeAvisoCliente.textContent = ``;
    contenedorAvisoCliente.classList.add(`oculto`);
}

//****ENTRADA DE DATOS PARA USUARIOS REGISTRADOS EN EL SISTEMA*****
// Valida usuario y clave. Si el usuario no logra ingresar en 3 intentos, no puede acceder al sistema
function ingresarAlSistema() {
    const nombreIngresado = inputUsuario.value.trim();
    const claveIngresada = inputClave.value.trim();

    if (nombreIngresado === `` || claveIngresada === ``) {
        mensajeInicio.textContent = `El dato es obligatorio`;
        return;
    }

    if (!validarClave(claveIngresada)) {
        mensajeInicio.textContent = `La clave debe ser un número entero entre 1000 y 9999`;
        return;
    }

    const nombre = nombreIngresado.toUpperCase();
    const clave = parseInt(claveIngresada);
    const usuarioActual = usuariosRegistrados.find((usuario) => usuario.nombre === nombre);

    //** usuario inexistente o clave incorrecta: suma un intento y bloquea al tercero */
    if (!usuarioActual || usuarioActual.clave !== clave) {
        intentos++;
        mensajeInicio.textContent = `Usuario o clave incorrecta. Intento ${intentos} de 3`;
        intentosInicio.textContent = `Intento ${intentos} de 3`;
        inputClave.value = ``;

        if (intentos === 3) {
            mensajeInicio.textContent = `Superó los 3 intentos permitidos. No puede acceder al sistema`;
            mostrarMensaje(`Acceso bloqueado por superar los 3 intentos`, `error`);
            deshabilitarIngreso(true);
        }
        return;
    }

    idUsuarioActual = usuarioActual.id;
    inputUsuario.value = ``;
    inputClave.value = ``;

    if (usuarioActual.nombre === `ADMIN`) {
        mensajeAdministrador.textContent = `Hola, ADMIN. Bienvenido al panel administrativo`;
        mostrarPanel(panelAdministrador);
    } else {
        bienvenidaCliente.textContent = `Hola, ${nombre}. Bienvenido al Simulador de Cajero Automático`;
        saldoActualCliente.textContent = `Saldo actual: $${formatearImporte(usuarioActual.saldoActual)}`;
        mostrarPanel(panelCliente);
        programarAvisoCliente(usuarioActual.id);
        reiniciarInactividad();
    }
}

//FUNCIONES DEL MENU ADMINISTRADOR
//Responsabilidades: Lectura del formulario, validaciones y limpieza de listados y campos
function limpiarListadoUsuarios() {
    listaUsuarios.innerHTML = ``;
    cantidadUsuarios.textContent = `0 usuarios`;
    contenedorUsuarios.classList.add(`oculto`);
}

function solicitarRegistroUsuario() {
    const nombreUsuario = inputUsuarioRegistro.value.trim();
    const clave = inputClaveRegistro.value.trim();
    const tipoCta = selectTipoCuentaRegistro.value;
    const saldoInicio = inputSaldoInicioRegistro.value.trim();

    limpiarListadoUsuarios();

    if (nombreUsuario === `` || clave === `` || tipoCta === `` || saldoInicio === ``) {
        mensajeAdministrador.textContent = `El dato es obligatorio`;
        return;
    }

    const saldoNumero = isNaN(saldoInicio) ? NaN : parseFloat(saldoInicio);

    if (registroUsuario(nombreUsuario, parseInt(clave), saldoNumero, tipoCta)) {
        cerrarFormulario(formularioRegistroUsuario);
        mensajeAdministrador.textContent = `Seleccione una opción`;
    }
}

function solicitarBlanqueoClave() {
    const idUsuario = inputUsuarioBlanqueoClave.value.trim();

    limpiarListadoUsuarios();

    if (idUsuario === ``) {
        mensajeAdministrador.textContent = `El dato es obligatorio`;
        return;
    }

    if (blanquearClave(parseFloat(idUsuario))) {
        cerrarFormulario(formularioBlanqueoClave, mensajeUsuarioBlanqueoClave);
        mensajeAdministrador.textContent = `Seleccione una opción`;
    }
}

function solicitarCambioClave() {
    const idUsuario = inputUsuarioCambioClave.value.trim();
    const clave = inputNuevaClave.value.trim();

    limpiarListadoUsuarios();

    if (idUsuario === `` || clave === ``) {
        mensajeAdministrador.textContent = `El dato es obligatorio`;
        return;
    }

    if (cambiarClaveDeUsuario(parseFloat(idUsuario), parseInt(clave), mensajeAdministrador)) {
        cerrarFormulario(formularioCambioClave, mensajeUsuarioCambioClave);
        mensajeAdministrador.textContent = `Seleccione una opción`;
    }
}

function solicitarEliminacionUsuario() {
    const idUsuario = inputUsuarioEliminacion.value.trim();

    limpiarListadoUsuarios();

    if (idUsuario === ``) {
        mensajeAdministrador.textContent = `El dato es obligatorio`;
        return;
    }

    if (eliminarUsuario(parseFloat(idUsuario))) {
        cerrarFormulario(formularioEliminacionUsuario, mensajeUsuarioEliminacion);
        mensajeAdministrador.textContent = `Seleccione una opción`;
    }
}

//FUNCIONES DEL MENU DE USUARIO CAJERO AUTOMATICO
//Responsabilidades: Lectura del importe, validaciones y limpieza del formulario.
function solicitarOperacion(usuario, inputImporte, formulario, operacion) {
    const datoValor = inputImporte.value.trim();

    if (datoValor === ``) {
        mensajeOperacion.textContent = `El dato es obligatorio.`;
        return;
    }

    const valor = isNaN(datoValor) ? NaN : parseFloat(datoValor);
    if (isNaN(valor) || valor <= 0 || valor === Infinity) {
        mensajeOperacion.textContent = `Debe ingresar un importe válido mayor que cero.`;
    } else if (operacion(usuario, valor)) {
        cerrarFormulario(formulario);
    }
}

function solicitarCambioClaveUsuario(idUsuario) {
    const claveNueva = inputNuevaClaveUsuario.value.trim();

    if (claveNueva === ``) {
        mensajeOperacion.textContent = `El dato es obligatorio.`;
        return;
    }

    if (cambiarClaveDeUsuario(idUsuario, parseInt(claveNueva), mensajeOperacion)) {
        cerrarFormulario(formularioCambioClaveUsuario);
        mensajeOperacion.textContent = `Seleccione una operación`;
    }
}

//Elementos del DOM - paneles de la aplicacion
const panelInicio = document.getElementById(`panel-inicio`);
const panelCliente = document.getElementById(`panel-cliente`);
const panelAdministrador = document.getElementById(`panel-administrador`);

//Elementos del DOM - panel de inicio
const bienvenidaInicio = document.getElementById(`bienvenida-inicio`);
const inputUsuario = document.getElementById(`input-usuario`);
const inputClave = document.getElementById(`input-clave`);
const btnIngresar = document.getElementById(`btn-ingresar`);
const mensajeInicio = document.getElementById(`mensaje-inicio`);
const intentosInicio = document.getElementById(`intentos-inicio`);

//Elementos del DOM - panel del cliente
const bienvenidaCliente = document.getElementById(`bienvenida-cliente`);
const btnConsultarSaldo = document.getElementById(`btn-consultar-saldo`);
const btnConsultarMovimientos = document.getElementById(`btn-consultar-movimientos`);
const btnDepositar = document.getElementById(`btn-depositar`);
const formularioDeposito = document.getElementById(`formulario-deposito`);
const inputImporteDeposito = document.getElementById(`input-importe-deposito`);
const btnCancelarDeposito = document.getElementById(`btn-cancelar-deposito`);
const btnExtraer = document.getElementById(`btn-extraer`);
const formularioExtraccion = document.getElementById(`formulario-extraccion`);
const inputImporteExtraccion = document.getElementById(`input-importe-extraccion`);
const btnCancelarExtraccion = document.getElementById(`btn-cancelar-extraccion`);
const btnCambiarClaveUsuario = document.getElementById(`btn-cambiar-clave`);
const formularioCambioClaveUsuario = document.getElementById(`formulario-cambio-clave-usuario`);
const inputNuevaClaveUsuario = document.getElementById(`input-nueva-clave-usuario`);
const btnCancelarCambioClaveUsuario = document.getElementById(`btn-cancelar-cambio-clave-usuario`);
const mensajeOperacion = document.getElementById(`mensaje-operacion`);
const saldoActualCliente = document.getElementById(`saldo-actual`);
const contenedorMovimientos = document.getElementById(`contenedor-movimientos`);
const selectFiltroMovimientos = document.getElementById(`select-filtro-movimientos`);
const saldoInicialMovimientos = document.getElementById(`saldo-inicial-movimientos`);
const saldoReferenciaMovimientos = document.getElementById(`saldo-referencia-movimientos`);
const listaMovimientos = document.getElementById(`lista-movimientos`);
const saldoActualMovimientos = document.getElementById(`saldo-actual-movimientos`);
const contenedorAvisoCliente = document.getElementById(`aviso-cliente`);
const mensajeAvisoCliente = document.getElementById(`mensaje-aviso-cliente`);
const btnSalirCliente = document.getElementById(`btn-salir-cliente`);

//Elementos del DOM - panel del administrador
const btnListarUsuarios = document.getElementById(`btn-listar-usuarios`);
const btnNuevoUsuario = document.getElementById(`btn-nuevo-usuario`);
const formularioRegistroUsuario = document.getElementById(`formulario-registro-usuario`);
const inputUsuarioRegistro = document.getElementById(`input-usuario-registro`);
const inputClaveRegistro = document.getElementById(`input-clave-registro`);
const selectTipoCuentaRegistro = document.getElementById(`select-tipo-cuenta-registro`);
const inputSaldoInicioRegistro = document.getElementById(`input-saldo-inicio-registro`);
const btnCancelarRegistro = document.getElementById(`btn-cancelar-registro`);
const btnBlanquearClave = document.getElementById(`btn-blanquear-clave`);
const formularioBlanqueoClave = document.getElementById(`formulario-blanqueo-clave`);
const inputUsuarioBlanqueoClave = document.getElementById(`input-usuario-blanqueo-clave`);
const mensajeUsuarioBlanqueoClave = document.getElementById(`mensaje-usuario-blanqueo-clave`);
const btnCancelarBlanqueoClave = document.getElementById(`btn-cancelar-blanqueo-clave`);
const btnCambiarClaveAdmin = document.getElementById(`btn-cambiar-clave-admin`);
const formularioCambioClave = document.getElementById(`formulario-cambio-clave`);
const inputUsuarioCambioClave = document.getElementById(`input-usuario-cambio-clave`);
const mensajeUsuarioCambioClave = document.getElementById(`mensaje-usuario-cambio-clave`);
const inputNuevaClave = document.getElementById(`input-nueva-clave`);
const btnCancelarCambioClave = document.getElementById(`btn-cancelar-cambio-clave`);
const btnEliminarUsuario = document.getElementById(`btn-eliminar-usuario`);
const formularioEliminacionUsuario = document.getElementById(`formulario-eliminacion-usuario`);
const inputUsuarioEliminacion = document.getElementById(`input-usuario-eliminacion`);
const mensajeUsuarioEliminacion = document.getElementById(`mensaje-usuario-eliminacion`);
const btnCancelarEliminacion = document.getElementById(`btn-cancelar-eliminacion`);
const btnSalirAdmin = document.getElementById(`btn-salir-admin`);
const contenedorUsuarios = document.getElementById(`contenedor-usuarios`);
const listaUsuarios = document.getElementById(`lista-usuarios`);
const btnBuscarUsuario = document.getElementById(`btn-buscar-usuario`);
const formularioBusquedaUsuario = document.getElementById(`formulario-busqueda-usuario`);
const inputUsuarioBusqueda = document.getElementById(`input-usuario-busqueda`);
const btnCancelarBusqueda = document.getElementById(`btn-cancelar-busqueda`);
const cantidadUsuarios = document.getElementById(`cantidad-usuarios`);
const mensajeAdministrador = document.getElementById(`mensaje-administrador`);

//SECCION DE EVENTOS DE LA APLICACION
// Capturo el click del boton para ***INGRESAR AL SISTEMA***
btnIngresar.addEventListener(`click`, ingresarAlSistema);

//Capturo el enter para simular presionar el boton de ingreso al sistema
panelInicio.addEventListener(`keydown`, (e) => {
    if (e.key === `Enter` && !btnIngresar.disabled) {
        e.preventDefault();
        ingresarAlSistema();
    }
});

// Capturo el click del boton para ***LISTAR USUARIOS***
btnListarUsuarios.addEventListener(`click`, () => {
    listarUsuarios();
});

// Capturo el click del boton para ***BUSCAR USUARIO***
btnBuscarUsuario.addEventListener(`click`, () => {
    mostrarFormulario(panelAdministrador, formularioBusquedaUsuario);
    mensajeAdministrador.textContent = `Ingrese un nombre completo o parcial para buscar. Se mostrarán los que coincidan con el ingreso`;
});

formularioBusquedaUsuario.addEventListener(`submit`, (e) => {
    e.preventDefault();
    buscarUsuario(inputUsuarioBusqueda.value);
});

// Capturo el click del boton para cancelar busqueda de usuario
btnCancelarBusqueda.addEventListener(`click`, () => {
    cancelarFormulario(formularioBusquedaUsuario, mensajeAdministrador);
});

// Capturo el click del boton para ***REGISTRAR UN NUEVO USUARIO***
btnNuevoUsuario.addEventListener(`click`, () => {
    mostrarFormulario(panelAdministrador, formularioRegistroUsuario);
    mensajeAdministrador.textContent = `Ingrese el usuario, la clave de 4 dígitos, el tipo de cuenta y el saldo inicial`;
});

formularioRegistroUsuario.addEventListener(`submit`, (e) => {
    e.preventDefault();
    solicitarRegistroUsuario();
});

// Capturo el click del boton para cancelar el registro de un nuevo usuario
btnCancelarRegistro.addEventListener(`click`, () => {
    cancelarFormulario(formularioRegistroUsuario, mensajeAdministrador);
});

// Capturo el click del boton para ***SOLICITAR BLANQUEO DE CLAVE***
btnBlanquearClave.addEventListener(`click`, () => {
    mostrarFormulario(panelAdministrador, formularioBlanqueoClave);
    mensajeAdministrador.textContent = `Ingrese el ID del usuario a blanquear`;
    buscarUsuarioPorId(inputUsuarioBlanqueoClave, mensajeUsuarioBlanqueoClave);
});

inputUsuarioBlanqueoClave.addEventListener(`blur`, () => {
    buscarUsuarioPorId(inputUsuarioBlanqueoClave, mensajeUsuarioBlanqueoClave);
});

inputUsuarioBlanqueoClave.addEventListener(`input`, () => {
    mensajeUsuarioBlanqueoClave.textContent = ``;
});

formularioBlanqueoClave.addEventListener(`submit`, (e) => {
    e.preventDefault();
    solicitarBlanqueoClave();
});

// Capturo el click del boton para cancelar el blanqueo de clave
btnCancelarBlanqueoClave.addEventListener(`click`, () => {
    cancelarFormulario(formularioBlanqueoClave, mensajeAdministrador, mensajeUsuarioBlanqueoClave);
});

// Capturo el click del boton para ***SOLICITAR CAMBIO DE CLAVE***
btnCambiarClaveAdmin.addEventListener(`click`, () => {
    mostrarFormulario(panelAdministrador, formularioCambioClave);
    mensajeAdministrador.textContent = `Ingrese el ID del usuario y la nueva clave de 4 dígitos`;
    buscarUsuarioPorId(inputUsuarioCambioClave, mensajeUsuarioCambioClave);
});

inputUsuarioCambioClave.addEventListener(`blur`, () => {
    buscarUsuarioPorId(inputUsuarioCambioClave, mensajeUsuarioCambioClave);
});

inputUsuarioCambioClave.addEventListener(`input`, () => {
    mensajeUsuarioCambioClave.textContent = ``;
});

// Capturo el submit del formulario para cambiar la clave de un usuario
formularioCambioClave.addEventListener(`submit`, (e) => {
    e.preventDefault();
    solicitarCambioClave();
});

// Capturo el click del boton para cancelar el cambio de clave
btnCancelarCambioClave.addEventListener(`click`, () => {
    cancelarFormulario(formularioCambioClave, mensajeAdministrador, mensajeUsuarioCambioClave);
});

// Capturo el click del boton para ***SOLICITAR ELIMINACION DE USUARIO***
btnEliminarUsuario.addEventListener(`click`, () => {
    mostrarFormulario(panelAdministrador, formularioEliminacionUsuario);
    mensajeAdministrador.textContent = `Ingrese el ID del usuario a eliminar`;
    buscarUsuarioPorId(inputUsuarioEliminacion, mensajeUsuarioEliminacion);
});

inputUsuarioEliminacion.addEventListener(`blur`, () => {
    buscarUsuarioPorId(inputUsuarioEliminacion, mensajeUsuarioEliminacion);
});

inputUsuarioEliminacion.addEventListener(`input`, () => {
    mensajeUsuarioEliminacion.textContent = ``;
});

formularioEliminacionUsuario.addEventListener(`submit`, (e) => {
    e.preventDefault();
    solicitarEliminacionUsuario();
});

// Capturo el click del boton para cancelar la eliminacion de usuario
btnCancelarEliminacion.addEventListener(`click`, () => {
    cancelarFormulario(formularioEliminacionUsuario, mensajeAdministrador, mensajeUsuarioEliminacion);
});

// Capturo el click de cualquier boton del menu del cliente para ocultar el aviso
document.querySelectorAll(`#menu-cliente button`).forEach((boton) => {
    boton.addEventListener(`click`, ocultarAvisoCliente);
});

// Capturo los clics y lo que se escribe en el panel del cliente para reiniciar el tiempo de inactividad
panelCliente.addEventListener(`click`, reiniciarInactividad);
panelCliente.addEventListener(`input`, reiniciarInactividad);

// Capturo el click del boton para ***CONSULTAR SALDO***
btnConsultarSaldo.addEventListener(`click`, () => {
    contenedorMovimientos.classList.add(`oculto`);
    cerrarFormulariosCliente();
    consultarSaldo(obtenerUsuarioPorId(idUsuarioActual));
});

// Capturo el click del boton para ***CONSULTAR  MOVIMIENTOS***
btnConsultarMovimientos.addEventListener(`click`, () => {
    cerrarFormulariosCliente();
    listarMovimientos(obtenerUsuarioPorId(idUsuarioActual));
    mensajeOperacion.textContent = `Consulta de movimientos realizada`;
});

// Permite filtrar los movimientos según el criterio seleccionado en el select
selectFiltroMovimientos.addEventListener(`input`, () => {
    listarMovimientos(obtenerUsuarioPorId(idUsuarioActual));
});

// Capturo el click del boton para ***DEPOSITAR DINERO***
btnDepositar.addEventListener(`click`, () => {
    contenedorMovimientos.classList.add(`oculto`);
    mostrarFormulario(panelCliente, formularioDeposito);
    mensajeOperacion.textContent = `Ingrese el importe a depositar`;
});

formularioDeposito.addEventListener(`submit`, (e) => {
    e.preventDefault();
    solicitarOperacion(obtenerUsuarioPorId(idUsuarioActual), inputImporteDeposito, formularioDeposito, depositoDinero);
});

// Capturo el click del boton para cancelar el deposito
btnCancelarDeposito.addEventListener(`click`, () => {
    cancelarFormulario(formularioDeposito, mensajeOperacion);
});

// Capturo el click del boton para ***EXTRAER DINERO***
btnExtraer.addEventListener(`click`, () => {
    contenedorMovimientos.classList.add(`oculto`);
    mostrarFormulario(panelCliente, formularioExtraccion);
    mensajeOperacion.textContent = `Ingrese el importe a extraer`;
});

formularioExtraccion.addEventListener(`submit`, (e) => {
    e.preventDefault();
    solicitarOperacion(obtenerUsuarioPorId(idUsuarioActual), inputImporteExtraccion, formularioExtraccion, extraccionDinero);
});

// Capturo el click del boton para cancelar la extraccion
btnCancelarExtraccion.addEventListener(`click`, () => {
    cancelarFormulario(formularioExtraccion, mensajeOperacion);
});

// Capturo el click del boton para ***CAMBIAR CLAVE DEL USUARIO***
btnCambiarClaveUsuario.addEventListener(`click`, () => {
    contenedorMovimientos.classList.add(`oculto`);
    mostrarFormulario(panelCliente, formularioCambioClaveUsuario);
    mensajeOperacion.textContent = `Ingrese su nueva clave de 4 dígitos`;
});

formularioCambioClaveUsuario.addEventListener(`submit`, (e) => {
    e.preventDefault();
    solicitarCambioClaveUsuario(idUsuarioActual);
});

// Capturo el click del boton para cancelar el cambio de clave del usuario
btnCancelarCambioClaveUsuario.addEventListener(`click`, () => {
    cancelarFormulario(formularioCambioClaveUsuario, mensajeOperacion);
});

// Capturo el click de los botones para salir del simulador
btnSalirAdmin.addEventListener(`click`, salir);
btnSalirCliente.addEventListener(`click`, salir);

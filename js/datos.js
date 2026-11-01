class Usuario {
    constructor(id, nombre, clave, saldoInicio, saldoActual, tipoCta){
        this.id = id;
        this.nombre = nombre;
        this.clave = clave;
        this.saldoInicio = saldoInicio;
        this.saldoActual = saldoActual;
        this.tipoCta = tipoCta;
        this.movimientos = [];
    }
}

// Usuarios del sistema (incluye al Administrador). Empieza vacío y se completa al iniciar:
// desde localStorage si hay datos guardados, o desde db/data.json 
const usuariosRegistrados = [];

//Variables generales
let intentos = 0;
let idUsuarioActual = null;
let temporizadorAviso = null;
let temporizadorInactividad = null;
const tiempoInactividad = 5 * 60 * 1000; //5 minutos expresados en milisegundos
let proximoIdUsuario = 1; //se actualiza al cargar los usuarios
const claveAlmacenamiento = `simuladorCajero`;
const urlUsuarios = `./db/data.json`; //ruta local del archivo con los usuarios iniciales

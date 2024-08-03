var bd;
var cajaContactos;

function IniciarBaseDatos() {
  var busqueda = document.querySelector("#formulario-busqueda");
  busqueda.addEventListener("submit", buscarContacto);
  cajaContactos = document.querySelector(".caja-contactos");
  var BtnGuardar = document.querySelector("#btn-guardar");
  BtnGuardar.addEventListener("click", AlmacenarContacto);
  var solicitud = indexedDB.open("Datos-De-Contactos");
  solicitud.addEventListener("error", MostrarError);
  solicitud.addEventListener("success", Comenzar);
  solicitud.addEventListener("upgradeneeded", CrearAlmacen);
}

function MostrarError(evento) {
  alert("Tenemos un ERROR:" + evento.code + "/" + evento.message);
}

function Comenzar(evento) {
  bd = evento.target.result;
  Mostrar();
}

function CrearAlmacen(evento) {
  var basededatos = evento.target.result;
  var almacen = basededatos.createObjectStore("Contactos", { keyPath: "id" });
  almacen.createIndex("BuscarNombre", "nombre", { unique: false });
}

function AlmacenarContacto() {
  var N = document.querySelector("#nombre").value.toLowerCase();
  var I = document.querySelector("#id").value;
  var E = document.querySelector("#edad").value;
  var transaccion = bd.transaction(["Contactos"], "readwrite");
  var almacen = transaccion.objectStore("Contactos");
  transaccion.addEventListener("complete", Mostrar);
  almacen.add({
    nombre: N,
    id: I,
    edad: E,
  });
  document.querySelector("#nombre").value = "";
  document.querySelector("#id").value = "";
  document.querySelector("#edad").value = "";
}

function Mostrar() {
  cajaContactos.innerHTML = "";
  var transaccion = bd.transaction(["Contactos"]);
  var almacen = transaccion.objectStore("Contactos");
  var puntero = almacen.openCursor();
  puntero.addEventListener("success", MostrarContactos);
}

function MostrarContactos(evento) {
  var puntero = evento.target.result;
  if (puntero) {
    cajaContactos.innerHTML +=
      "<div>" +
      puntero.value.nombre +
      " / " +
      puntero.value.id +
      " / " +
      puntero.value.edad +
      "<input type='button' class='btn-eliminar' value='Eliminar' onclick='eliminarContacto(\"" +
      puntero.value.id +
      "\")'>" +
      "<input type='button' class='btn-editar' value='Editar' onclick='editarContacto(\"" +
      puntero.value.id +
      "\")'>" +
      "</div>";
    puntero.continue();
  }
}

function editarContacto(clave) {
  var transaccion = bd.transaction(["Contactos"], "readwrite");
  var almacen = transaccion.objectStore("Contactos");
  var solicitud = almacen.get(clave);
  solicitud.addEventListener("success", function () {
    var contacto = solicitud.result;
    document.querySelector("#nombre").value = contacto.nombre;
    document.querySelector("#id").value = contacto.id;
    document.querySelector("#edad").value = contacto.edad;
    document.querySelector("#btn-guardar").value = "Actualizar";

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function seleccionarContacto(clave) {
  var padreBoton = document.querySelector(".padre-boton");
  padreBoton.innerHTML =
    "<input type='button' class='btn.actualizar' value ='Actualizar' onclick ='actualizarContacto()'>";
  var transaccion = bd.transaction(["Contactos"], "readwrite");
  var almacen = transaccion.objectStore("Contactos");
  var solicitud = almacen.get(clave);
  solicitud.addEventListener("success", function () {
    document.querySelector("#nombre").value = solicitud.result.nombre;
    document.querySelector("#id").value = solicitud.result.id;
    document.querySelector("#edad").value = solicitud.result.edad;
  });
}

function buscarContacto(evento) {
  evento.preventDefault();
  document.querySelector(".resultado-busqueda").innerHTML = "";
  var buscar = document.querySelector("#buscar-nombre").value.toLowerCase();
  var transaccion = bd.transaction(["Contactos"]);
  var almacen = transaccion.objectStore("Contactos");
  var indice = almacen.index("BuscarNombre");
  var rango = IDBKeyRange.only(buscar);
  var puntero = indice.openCursor(rango);
  puntero.addEventListener("success", mostrarBusqueda);
}

function mostrarBusqueda(evento) {
  var resultadoBusqueda = document.querySelector(".resultado-busqueda");
  var puntero = evento.target.result;
  if (puntero) {
    resultadoBusqueda.innerHTML +=
      "<div>" +
      puntero.value.nombre +
      " / " +
      puntero.value.id +
      " / " +
      puntero.value.edad +
      "</div>";
    puntero.continue();
  }
  document.querySelector("#buscar-nombre").value = "";
}

function eliminarContacto(clave) {
  var transaccion = bd.transaction(["Contactos"], "readwrite");
  var almacen = transaccion.objectStore("Contactos");
  var solicitud = almacen.delete(clave);

  var mensajeDiv = document.createElement("div");
  mensajeDiv.style.position = "fixed";
  mensajeDiv.style.top = "50%";
  mensajeDiv.style.left = "50%";
  mensajeDiv.style.transform = "translate(-50%, -50%)";
  mensajeDiv.style.background = "white";
  mensajeDiv.style.padding = "20px";
  mensajeDiv.style.border = "1px solid #ccc";
  mensajeDiv.style.borderRadius = "1.5rem";
  mensajeDiv.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
  mensajeDiv.style.color = "black";

  solicitud.addEventListener("success", function () {
    mensajeDiv.innerHTML = "Contacto eliminado con éxito";
    document.body.appendChild(mensajeDiv);
    setTimeout(function () {
      mensajeDiv.remove();
    }, 2200);
    Mostrar();
  });

  solicitud.addEventListener("error", function () {
    mensajeDiv.innerHTML = "Error al eliminar contacto";
    document.body.appendChild(mensajeDiv);
    setTimeout(function () {
      mensajeDiv.remove();
    }, 3000);
  });
}

function actualizarContacto() {
  const id = document.querySelector("#id").value;
  const nombre = document.querySelector("#nombre").value.toLowerCase();
  const edad = document.querySelector("#edad").value;

  const contacto = { nombre, id, edad };

  ActualizarContactoBD(contacto)
    .then(() => {
      Mostrar();
      // alert("Contacto actualizado con éxito");
      document.querySelector("#btn-guardar").value = "Guardar";
    })
    .catch((error) => {
      MostrarError(error);
    });
}

function ActualizarContactoBD(contacto) {
  return new Promise((resolve, reject) => {
    const transaction = bd.transaction(["Contactos"], "readwrite");
    const almacen = transaction.objectStore("Contactos");
    const solicitud = almacen.put(contacto);
    solicitud.onsuccess = resolve;
    solicitud.onerror = reject;
  });
}

window.addEventListener("load", IniciarBaseDatos);

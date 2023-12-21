"use scrict"
/*2.CREAR EL OBJECTO DE BASE DE DATOS*/
const auth = firebase.auth();
const db = firebase.firestore();

/*3.CONFIGURAR APLICACION*/
const collectionStr = "tiquetes";

/*4.CARGAR LAS FUNCIONES DE FIREBASE*/
const onFindAll = callback => db.collection(collectionStr).orderBy('Id', 'desc').onSnapshot(callback);
const onInsert = obj => db.collection(collectionStr).doc().set(obj);
const onUpdate = (paramId,newObj) => db.collection(collectionStr).doc(paramId).update(newObj);
const onDelete = paramId => db.collection(collectionStr).doc(paramId).delete();
const findById = paramId => db.collection(collectionStr).doc(paramId).get();

const collectionStrUsers = "Usuarios";
const onInsertUser = (id,obj) => db.collection(collectionStrUsers).doc(id).set(obj);
const findByIdUser = paramId => db.collection(collectionStrUsers).doc(paramId).get();

const dataTable = document.querySelector("#tblDatos > tbody");
var IdSeleccionadoTiquete = "";
var formularioCrearIncidencia;


function Limpiar(){
    //Limpiar el Modal
    $("#txtEmail").val("");
    $("#txtPassword").val("");
    $("#txtNombre").val("");
    
    //Cierra el modal
    $("#modalRegistro").modal('hide');
    $(".modal-backdrop").remove();
    
    //Limpiar el Modal
    $("#txtEmail1").val("");
    $("#txtPassword1").val("");
    
    
    //Cierra el modal 
    $("#modalInicioSesion").modal('hide');
    $(".modal-backdrop").remove();
};

function LimpiarEditar(){
    $("#inputAsuntoVer").hide();
    $("#inputDescripcionVer").hide();
    $("#inputNotasVer").hide();
    $("#inputOwnerVer").hide();

    $("#txtAsuntoVer").show();
    $("#txtDescripcionVer").show();
    $("#txtNotasVer").show();
    $("#txtOwnerVer").show();

    $(".acceptarEditar").hide();

    $(".formEditar").trigger("reset");
    IdSeleccionadoTiquete ="";
    $("#modalVerIncidencia").modal('hide');
    $(".modal-backdrop").remove();
}

// Variable global para almacenar el contador de IDs
let idCounter = 1;

// Función para generar identificadores únicos y consecutivos
async function generateUniqueId() {
    let isUnique = false;
    let newId = '';

    while (!isUnique) {
       
        newId = String(idCounter).padStart(4, '0');

        // Verificar si el ID ya existe en la base de datos
        const idExists = await checkIfIdExists(newId);

        // Incrementar el contador para el próximo intento
        idCounter++;

        // Si el ID no existe en la base de datos, marcar como único y salir del bucle
        if (!idExists) {
            isUnique = true;
        }
    }

    return newId;
}

// Función para verificar si un ID ya existe en la base de datos
async function checkIfIdExists(id) {
    const snapshot = await db.collection(collectionStr).where('Id', '==', id).get();
    return !snapshot.empty;
}

async function getCurrentUserName() {
    // Obtener el usuario actual
    const user = auth.currentUser;

    if (user) {
        try {
            // Realizar una consulta a la colección "Usuarios"
            const userDoc = await db.collection("Usuarios").doc(user.uid).get();

            // Verificar si el documento existe y si hay un campo "nombre"
            if (userDoc.exists) {
                const userData = userDoc.data();

                if (userData && userData.nombre) {
                    return userData.nombre;
                } else {
                
                    return "Campo no encontrado";
                }
            } else {
                
                return "NombreUsuarioDefault";
            }
        } catch (error) {
            console.error("Error al obtener el nombre del usuario:", error);
            
            return "NombreUsuarioDefault";
        }
    } else {
        
        return "NombreUsuarioDefault";
    }
}

$(document).ready(()=>{

    formularioCrearIncidencia = document.getElementById("frmCrearIncidencia");


    $("#cerrarModal").click(()=>{
        Limpiar();
    });

    $("#cerrarModal1").click(()=>{
        Limpiar();
    });

    $("#buttonHamburgerMenu").click(()=>{
        $("#navbarSupportedContent").toggle("slow");
    });

    $("#aceptarModalRegistro").click((event)=>{
        event.preventDefault();
        const email = $("#txtEmail").val();
        const password = $("#txtPassword").val();
        const nombre = $("#txtNombre").val();

        auth.createUserWithEmailAndPassword(email,password)
        .then(async res =>{
            
            
            let user = {
                nombre: nombre,
                email: email
            }
            await onInsertUser(res.user.uid,user);
            Limpiar();
            console.log("Sign-up");
        }).catch(err =>{
            //console.log(err);
            if(err.message === "The email address is badly formatted."){
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "¡Faltan datos o el correo no es valido!",
                })
            }
        });;
    });

    //Normal LogIn
    $("#aceptarModalInicioSesion").click((event)=>{
        event.preventDefault();
        const email = $("#txtEmail1").val();
        const password = $("#txtPassword1").val();

        auth.signInWithEmailAndPassword(email,password)
        .then(userCredential =>{
            Limpiar();
            console.log("Sign-In");
        }).catch(err =>{
            //console.log(err);
            if(err.message === "The email address is badly formatted."){
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "¡No enviaste credenciales o el correo no es valido!",
                })
            }
        });
    });

    //Google LogIn
    $("#googleLogin").click((ev)=>{
        //console.log("Click google");
        ev.preventDefault();
        const provider = new firebase.auth.GoogleAuthProvider();

        auth.signInWithPopup(provider)
            .then(async res =>{
                console.log("Google Sign-In");
                //console.log(res.user);

                let user = {
                    nombre: res.user.displayName,
                    email: res.user.email,
                    foto: res.user.photoURL
                }
                    
                await onInsertUser(res.user.uid,user);
                Limpiar();
            })
            .catch(err =>{
                console.log(err);
            });

    });

    $(".cerrarS").click((event)=>{
        event.preventDefault();
        auth.signOut().then(()=>{
            //console.log("Sign-Out");
        });
    });

    auth.onAuthStateChanged(async(user) =>{
        if(user){
            $(".usuarios").show("");
            //console.log("Sign-In");
            /*Oculto los botones y muestro el cerrar sesión*/
            $("#InicioSesion").hide();
            $("#Registro").hide();
            $("#InicioSesion1").hide();
            $("#Registro1").hide();
            $(".cerrarS").show();
            $(".Formulario").css("display","none");
            $(".infoPicnic").css("display","none");
            $(".carousel").css("display","none");
            $(".otrosArtistas").css("display","none");;
            $(".footerFinal").css("display","none");
            $(".acceptarEditar").hide();
            
            /*Coloco el usuario en el Nav-Bar*/
            const docSeleccionado = await findByIdUser(user.uid);
            const contactoSeleciondo = docSeleccionado.data();
            $("#Usuario").html(contactoSeleciondo.nombre);
            $("#Usuario").show();
            $("#Usuario1").html(contactoSeleciondo.nombre);
            $("#Usuario1").show();
            $(".imgGoogle").attr("src",`${user.photoURL}`)
            $(".imgGoogle1").attr("src",`${user.photoURL}`)
            /*Muestro el Owner*/

            /*Muestro los datos en la tabla*/
            await onFindAll(query =>{
                dataTable.innerHTML = "";
                query.forEach((doc) => {
                    let tiquete = doc.data();

                    //console.log(tiquete.Fecha.toDate());

                    /*Para Objener la Hora AM Y PM y sin hora Militar*/
                    // Extrae la hora
                    const horas = tiquete.Fecha.toDate().getHours();
                    // Convierte a formato de 12 horas y determina si es AM o PM
                    const horasFormato12 = horas % 12 || 12; // Si horas es 0, muestra 12 en lugar de 0
                    const amOpm = horas < 12 ? 'AM' : 'PM';
                    
                    //console.log(doc.id);
                    /*Editamos el HTML*/
                    dataTable.innerHTML +=`
                    <tr>
                        <td><a href="#" class="link-primary ver-tiquete" data-bs-toggle="modal" data-bs-target="#modalVerIncidencia" data-id=${doc.id}>${tiquete.Id}</a></td>
                        <td>${tiquete.Asunto}</td>
                        <td>${tiquete.Descripcion}</td>
                        <td>${tiquete.Categoria}</td>
                        <td>${tiquete.Prioridad}</td>
                        <td>${tiquete.Estado}</td>
                        <td>${tiquete.AsignadoA}</td>
                        <td>${tiquete.Creador}</td>
                        <td>${tiquete.Fecha.toDate().toLocaleDateString()}</td>
                        <td>${horasFormato12}:${tiquete.Fecha.toDate().getMinutes()} ${amOpm}</td>
                    </tr>
                    `;
                });

                $(".ver-tiquete").click(async(ev)=>{
                    //console.log(ev.target.dataset.id);
                    IdSeleccionadoTiquete = ev.target.dataset.id;
                    const docSeleccionadoTiquete = await findById(IdSeleccionadoTiquete);
                    const contactoSeleciondoTiquete = docSeleccionadoTiquete.data();
                    //console.log(contactoSeleciondoTiquete);

                    const horas = contactoSeleciondoTiquete.Fecha.toDate().getHours();
                    const horasFormato12 = horas % 12 || 12; 
                    const amOpm = horas < 12 ? 'AM' : 'PM';
                    const hora = horasFormato12+":"+ contactoSeleciondoTiquete.Fecha.toDate().getMinutes()+" "+amOpm;
                    

                    $("#txtAsuntoVer").show();
                    $("#txtDescripcionVer").show();
                    $("#txtNotasVer").show();
                    $("#txtOwnerVer").show();

                    $("#txtIdVer").html(contactoSeleciondoTiquete.Id);
                    $("#txtAsuntoVer").html(contactoSeleciondoTiquete.Asunto);
                    $("#txtDescripcionVer").html(contactoSeleciondoTiquete.Descripcion);
                    $("#txtNotasVer").html(contactoSeleciondoTiquete.Notas);
                    $("#txtOwnerVer").html(contactoSeleciondoTiquete.Owner);
                    $("#txtCreadorVer").html(contactoSeleciondoTiquete.Creador);
                    $("#txtFechaVer").html(contactoSeleciondoTiquete.Fecha.toDate().toLocaleDateString());
                    $("#txtHoraVer").html(hora);
                });



                
                $(".editar").click(async()=>{
                        
                    console.log(IdSeleccionadoTiquete);
                    const docSeleccionadoTiquete = await findById(IdSeleccionadoTiquete);
                    const contactoSeleciondoTiquete = docSeleccionadoTiquete.data();

                    $("#EditarIncidencia").html("Modificar")
                    $("#txtAsuntoVer").hide();
                    $("#txtDescripcionVer").hide();
                    $("#txtNotasVer").hide();
                    $("#txtOwnerVer").hide();

                    $("#inputAsuntoVer").show();
                    $("#inputDescripcionVer").show();
                    $("#inputNotasVer").show();
                    $("#inputOwnerVer").show();

                    $("#inputAsuntoVer").val(contactoSeleciondoTiquete.Asunto);
                    $("#inputDescripcionVer").val(contactoSeleciondoTiquete.Descripcion);
                    $("#inputNotasVer").val(contactoSeleciondoTiquete.Notas);
                    $("#inputOwnerVer").val(contactoSeleciondoTiquete.Owner);

                    $(".acceptarEditar").show();
                });

                $(".acceptarEditar").click(async()=>{
                    const docSeleccionadoTiquete = await findById(IdSeleccionadoTiquete);
                    const contactoSeleciondoTiquete = docSeleccionadoTiquete.data();
                    let tiquete ={
                        Id: contactoSeleciondoTiquete.Id,
                        Asunto: $("#inputAsuntoVer").val(),
                        Descripcion: $("#inputDescripcionVer").val(),
                        Notas: $("#inputNotasVer").val(),
                        Owner: $("#inputOwnerVer").val(),
                        Creador: contactoSeleciondoTiquete.Creador,
                        Fecha: contactoSeleciondoTiquete.Fecha
                    }

                    await onUpdate(IdSeleccionadoTiquete,tiquete); 
                    LimpiarEditar();
                });

                $(".btn-close").click(()=>{
                    LimpiarEditar();
                });
            });
        }else{
            //console.log("Sing-Out");
            $(".cerrarS").hide();
            $("#InicioSesion").show();
            $("#Registro").show();
            $("#Registro1").show();
            $("#InicioSesion1").show();

            $(".usuarios").hide();
            $("#Usuario").hide();
            $("#Usuario1").hide();
            $(".Formulario").show();
            $(".infoPicnic").show();
            $(".otrosArtistas").show();
            $(".carousel").show();
            $(".footerFinal").show();
            $(".imgGoogle").attr("src","")
            $(".imgGoogle1").attr("src","")
        }


                // Manejar el evento de envío del formulario de creación de incidencias
                formularioCrearIncidencia.addEventListener("submit", async (event) => {
                    event.preventDefault();

                    // Obtener valores del formulario
                    const asunto = document.getElementById("txtAsunto").value;
                    const descripcion = document.getElementById("txtDescripcion").value;
                    const categoria = document.getElementById("txtCategoria").value;
                    const prioridad = document.getElementById("selPrioridad").value;
                    const estado = document.getElementById("selEstado").value;
                    const asignadoA = document.getElementById("txtAsignadoA").value;
                    const notas = document.getElementById("txtNotas").value;

                    // Validar que se hayan proporcionado los datos necesarios
                    if (!asunto || !descripcion || !categoria || !prioridad || !estado || !asignadoA) {
                        // Mostrar mensaje de error o realizar alguna acción
                        return;
                    }

                    // Crear objeto de incidencia con los nuevos campos
                    const fecha = new Date(); // Obtener la fecha actual
                    const horas = fecha.getHours();
                    const horasFormato12 = horas % 12 || 12;
                    const amOpm = horas < 12 ? 'AM' : 'PM';
                    const hora = `${horasFormato12}:${fecha.getMinutes()} ${amOpm}`;

                    const id = await generateUniqueId(); // Generar un ID único y consecutivo

                    const creador = await getCurrentUserName(); 

                    const nuevaIncidencia = {
                        Id: id,
                        Asunto: asunto,
                        Descripcion: descripcion,
                        Categoria: categoria,
                        Prioridad: prioridad,
                        Estado: estado,
                        AsignadoA: asignadoA,
                        Notas: notas,
                        Creador: creador,
                        Dueño: creador, //creador es igual a dueño
                        Fecha: fecha,
                        Hora: hora
                        
                    };

                    try {
                        // Insertar incidencia en la base de datos
                        await onInsert(nuevaIncidencia);
                        
                        // Limpiar el formulario después de la inserción
                        formularioCrearIncidencia.reset();

                        // Cerrar el modal de creación de incidencias
                        $("#modalCrearIncidencia").modal("hide");
                        $(".modal-backdrop").remove();
                    } catch (error) {
                        console.error("Error al insertar la incidencia:", error);
                        // Manejar el error según sea necesario
                    }
                });


                    
                        // Evento para eliminar incidencia
                $(".eliminar").click(() => {
                    // Verificar si hay una incidencia seleccionada
                    if (IdSeleccionadoTiquete) {
                        // Mostrar el modal de confirmación de eliminación
                        $("#modalEliminarIncidencia").modal("show");
                    }
                });

                // Evento para confirmar la eliminación de la incidencia
                $("#btnConfirmarEliminar").click(async () => {
                    try {
                        if (IdSeleccionadoTiquete) {
                            // Llamar a la función de eliminación
                            await onDelete(IdSeleccionadoTiquete);
                            console.log("Incidencia eliminada con éxito");
                        }

                        
                        $("#modalEliminarIncidencia").modal("hide");
                        $(".modal-backdrop").remove();
                        // Limpiar y cerrar el modal de eliminación
                        LimpiarEditar();
                    } catch (error) {
                        console.error("Error al eliminar la incidencia:", error);
                        
                    }
                });

        
                });

    });







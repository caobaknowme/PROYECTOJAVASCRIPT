"use scrict"
/*2.CREAR EL OBJECTO DE BASE DE DATOS*/
const auth = firebase.auth();
const db = firebase.firestore();

/*3.CONFIGURAR APLICACION*/
const collectionStr = "tiquetes";

/*4.CARGAR LAS FUNCIONES DE FIREBASE*/
const onFindAll = callback => db.collection(collectionStr).onSnapshot(callback);
const onInsert = obj => db.collection(collectionStr).doc().set(obj);
const onUpdate = (paramId,newObj) => db.collection(collectionStr).doc(paramId).update(newObj);
const onDelete = paramId => db.collection(collectionStr).doc(paramId).delete();
const findById = paramId => db.collection(collectionStr).doc(paramId).get();

const collectionStrUsers = "Usuarios";
const onInsertUser = (id,obj) => db.collection(collectionStrUsers).doc(id).set(obj);
const findByIdUser = paramId => db.collection(collectionStrUsers).doc(paramId).get();

const dataTable = document.querySelector("#tblDatos > tbody");

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

$(document).ready(()=>{
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

    $("#CerrarSesion").click((event)=>{
        event.preventDefault();
        auth.signOut().then(()=>{
            //console.log("Sign-Out");
        });
    });

    auth.onAuthStateChanged(async(user) =>{
        if(user){
            $(".usuarios").show("");
            //console.log("Sign-In");
            /*Oculto los botones y muestro el cerra sesión*/
            $("#InicioSesion").hide();
            $("#Registro").hide();
            $("#CerrarSesion").show();
            $(".Formulario").css("display","none");

            /*Coloco el usuario en el Nav-Bar*/
            const docSeleccionado = await findByIdUser(user.uid);
            const contactoSeleciondo = docSeleccionado.data();
            $("#Usuario").html(contactoSeleciondo.nombre);

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
                        <td>${tiquete.Fecha.toDate().toLocaleDateString()}</td>
                        <td>${horasFormato12}:${tiquete.Fecha.toDate().getMinutes()} ${amOpm}</td>
                    </tr>
                    `;

                    $(".ver-tiquete").click(async(ev)=>{
                        //console.log(ev.target.dataset.id);
                        const docSeleccionadoTiquete = await findById(ev.target.dataset.id);
                        const contactoSeleciondoTiquete = docSeleccionadoTiquete.data();
                        //console.log(contactoSeleciondoTiquete);
    
                        const horas = contactoSeleciondoTiquete.Fecha.toDate().getHours();
                        const horasFormato12 = horas % 12 || 12; 
                        const amOpm = horas < 12 ? 'AM' : 'PM';
                        const hora = horasFormato12+":"+ contactoSeleciondoTiquete.Fecha.toDate().getMinutes()+" "+amOpm;
    
                        $("#txtIdVer").html(contactoSeleciondoTiquete.Id);
                        $("#txtAsuntoVer").html(contactoSeleciondoTiquete.Asunto);
                        $("#txtDescripcionVer").html(contactoSeleciondoTiquete.Descripcion);
                        $("#txtNotasVer").html(contactoSeleciondoTiquete.Notas);
                        $("#txtOwnerVer").html(contactoSeleciondoTiquete.Owner);
                        $("#txtCreadorVer").html(contactoSeleciondoTiquete.Creador);
                        $("#txtFechaVer").html(contactoSeleciondoTiquete.Fecha.toDate().toLocaleDateString());
                        $("#txtHoraVer").html(hora);
    
                        $("#EditarIncidencia").click(async()=>{
                        
                        });
                    });
                });

                
            });
        }else{
            //console.log("Sing-Out");
            $("#CerrarSesion").hide();
            $("#InicioSesion").show();
            $("#Registro").show();

            $(".usuarios").hide();
            $("#Usuario").hide();
            $(".Formulario").show();
        }
    });

    
    

});







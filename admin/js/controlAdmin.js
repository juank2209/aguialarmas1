/********************************************************
 	PROYECTO: Control de Acceso Aguialarmas
 	MODULO: PORTERIA
 	PROGRAMA: controlPorteria.js
 	Enlaza y sincroniza las funciones de las capas Vista y Modelo
 	Es el programa principal.
 	MLM. feb/25/2019
 	ver: 1.0
	PENDIENTE: Se requiere archivo plano 'datagui.txt' para validar acceso al punto
*********************************************************/

/********** OBJETOS GLOBALES****************************/
	var posActual = '';				//Para conocer la pantalla actual
	var vista = new Vista();
	var usuario = new Usuario("", "");
	var puntoControl = new PuntoControl();	
	var idPunto	=	-1;		//el ID del punto de control activo




	var cedulaVisitaActiva = -1; //Almacena documento que se digita, para consultar visitante
	var idVisita = -1;
	var idVisitante = -1;
	var local = -1;
	var autoriza = -1; //documAutoriza de visita activa
	/*-----------------------------------------------------*/
	var estadosVisita = [];
	var tiposAutorizacion = [];
	/*-----------------------------------------------------*/
	var listaBloques = [];
	var listaLocales = [];
	var listaVisitas = [];
	var listaVisitantes = [];
	var listaResidentes = [];
	var listaResidentesTotal = []; //Todos los residentes del conjunto, para busquedas
	/*-----------------------------------------------------*/
	var listaTips = [];
	var listaMensajes = [];

	/*-----------------------------------------------------*/

//activa pooling de atencion a la BD para mensajes-------

var tCiclo = 20000;     //duracion del ciclo pooling en mseg
var ciclo = window.setInterval(verificarServidor, tCiclo);  



/***** FUNCIONES MANEJADORAS DE EVENTOS ****************/

	//----- presenta la primera pantalla: LOGIN ---------
	window.onload = function() {
//		vista.mostrarPlantilla('login','cuerpo');
//		cargarTablasAuxiliares();
vista.mostrarPlantilla('menuPal', 'cuerpo');

	}

	//Entrada de los eventos del menu principal
	function navegar(form){
		vista.mostrarPlantilla(form, "der");
		vista.mostrarAviso("");
		posActual = form;
		//Crear objetos segun opcion del menu
		switch(form) {
			case 'tfrmNotas':
				break;
				
			case 'frmReserva':
				break;

			case 'frmEventos':
				break;

			case 'frmEmpleados':
				break;

			case 'frmVisitas':
				listarVisitas();
				break;

			case 'frmCirculares':
				break;

			case 'frmPQRS':
				break;

			case 'salir':
			//PROVISIONAL, PRUEBA MENSAJES.PHP
			pedirMensajes();
				vista.mostrarPlantilla('login','cuerpo');		
		}
	}

//****** FUNCIONES AUXILIARES ****************************************

	//carga, en cadena, las tablas estadosVisita, tiposAutorizacion
	function cargarTablasAuxiliares(){
		let datos = {'opc': 'cargarEstadosVisita'};
		ejecutarAjax(datos, cargarEstadosVisitaRespuesta);
	}

	function cargarEstadosVisitaRespuesta(tabla){
		estadosVisita = tabla;
		let datos = {'opc': 'cargarTiposAutorizacion'};
		ejecutarAjax(datos, cargarTiposAutorizacionRespuesta);
	}

	function cargarTiposAutorizacionRespuesta(tabla){
		tiposAutorizacion = tabla;
	}















//id="tipoAutorizacion" - tiposAutorizacion


/* Busca datos del punto y carga en el objeto puntoControl*******************/
function cargarpuntoControl(idPunto){
	//consultar demas datos en BD
	let datos = {'opc': 'cargarDatosPunto', 'idPunto': idPunto};
	ejecutarAjax(datos, cargarpuntoControlRespuesta);
}
//FUNCION CALLBACK:
function cargarpuntoControlRespuesta(datos1){
	if(datos1.length > 0){
		idPunto = datos1[0]['idPunto'];	//ID en variable global
		let miDato = datos1[0];
		puntoControl.setData(miDato); 	//Guardar en el objeto
		//Mostrar nombre del Punto en 'nombrePunto' 
		vista.mostrarTitulo('nombrePunto', datos1[0]['nombre'])
	}else{
		vista.mostrarPlantilla('login','cuerpo');
		vista.mostrarAviso("No esta activo el Punto de Control");
		idPunto = -1; 
	}
}



//trae las Bloques y consulta los locales
function cargarBloquesPuntoRespuesta(dato1){
	listaBloques = dato1;	//Carga bloques

	let datos = {'opc': 'cargarLocalesPunto', 'idPunto': idPunto};
	ejecutarAjax(datos, cargarLocalesPuntoRespuesta);
}

//trae los locales y consulta visitantes
function cargarLocalesPuntoRespuesta(dato1){
	listaLocales = dato1;
	let datos = {'opc': 'consultarVisitantesActivos', 'idPunto': idPunto};
	ejecutarAjax(datos, consultarVisitantesActivosRespuesta);
}

//Carga visitantes activos en array
function consultarVisitantesActivosRespuesta(dato1){
	listaVisitantes = dato1;
	let datos = {'opc': 'cargarListaResidentesTotal', 'idPunto': idPunto};
	ejecutarAjax(datos, cargarListaResidentesTotalRespuesta);
}

//trae todos los residentes, para hacer busquedas por filtro
function cargarListaResidentesTotalRespuesta(tabla){
	listaResidentesTotal = tabla;
}




/****************** USUARIO ******************************************
	toma los datos del formulario login, y valida
	revisa la respuesta del servidor y el rol= Operador. 
	Si es OK, Carga datos en propiedades del usuario.
	Sino, despliega aviso
 	*********************************************************/
	function validarUsuario(){
		usuario.setData(vista.getDatosForm('formLogin'));
		var datos = usuario.getData();
		datos['opc'] = 'verificarUsuario';
		ejecutarAjax(datos, validarUsuarioRespuesta);
	}

	//FUNCION CALLBACK: 
	function validarUsuarioRespuesta(datos){
		if(datos.length > 0){
			if(datos[0]['rol']=== 3){ //Rol 3: Administrador conjunto
				usuario.setData(datos[0]);
				vista.mostrarTitulo('nombreUsuario', 'Administrador: '+ datos[0]['nombres']);
				vista.mostrarPlantilla('menuPal', 'cuerpo');
				vista.mostrarAviso("");
				cargarpuntoControl(datos[0]["idPunto"]);
				//PRUEBA: para marquesina
				
			}else{
				vista.mostrarAviso("Usuario NO Autorizado");
			}
		}else{
			vista.mostrarAviso("Usuario NO encontrado");
		}
	}

/**********************************************************************/

/*++++++++++++ BLOQUE INGRESO VISITANTES +++++++++++++++++++++++++++++*/
//cuando se digita la cedula + <ENTER>
function consultarVisitante(){
	//borrar datos anteriores
	vista.limpiarForm('frmIngreso');
	//ocultar botones
	$("#btnOculto").hide();
	//limpiar selects y ficha
	vista.limpiarDestino();
	//primero busca si ya esta en la lista
	let i = 0;
	while((i< listaVisitantes.length) && (listaVisitantes[i]['documVisitante'] != cedulaVisitaActiva))
		i++;
	if(i === listaVisitantes.length){  //No encontrado en array, consultar en BD
		autoriza = -1;
		let datos = {'opc': 'consultarVisitante', 'documVisitante': cedulaVisitaActiva};
		ejecutarAjax(datos, consultarVisitanteRespuesta);
	}else{   //Si está en array
		mostrarVisitante(i);
	}
}

function consultarVisitanteRespuesta(datos1){
	if(datos1.length > 0){
		//crear objeto en la lista 
		vis= new Visitante();
		vis.setData(datos1[0]);
		listaVisitantes.push(datos1[0]);
		let num = listaVisitantes.length -1; //toma ultimo objeto, recien ingresado
		mostrarVisitante(num);

	}else{ //caso no esta registrado el visitante
		//desplegar botones de grabar
		$("#btnOculto").show(); 
		//mostrar de nuevo cedulaVisitaActiva en documVisitante
		vista.setDatosInput('documVisitante', cedulaVisitaActiva);
	}
}

//Despiega datos del visitante listaVisitantes[num]
function mostrarVisitante(num){
	//mostrar foto visitante
	document.getElementById("imgVisitante").src = "/aguialarmas/fotoVisitante/" + listaVisitantes[num]['foto'];  
	//desplegar datos en inputs
	vista.setDatosForm(listaVisitantes[num]);
	//cargar select de bloques
	vista.cargarSelect("bloques", listaBloques, 'idBloque','nombreBloque');
	vista.cargarSelect("tipoAutorizacion", tiposAutorizacion, 'idTipoAutorizacion','descripTipoAutorizacion');
	buscaResidente = true;
	consultarResidentes();
	mostrarVisita();	//Si tiene visita activa, la muestra
}

//Cuando no encuentra la foto del visitante ---------------------------------
function sinFoto(){
	  	document.getElementById("imgVisitante").src = "img/photo.png"; 	//limpia imagen
		$("#btnOculto").show(); 
}

//Despliega datos de visita para el visitante cedulaVisitaActiva -----------------------
function mostrarVisita(){
	let i = 0;	//buscar idVisitante
	while((i< listaVisitantes.length) && (listaVisitantes[i]['documVisitante'] != cedulaVisitaActiva))
		i++;
	if(i < listaVisitantes.length){  //Encontrado...
		idVisitante = listaVisitantes[i]['idVisitante']; //toma el id

		i=  0;  //Lo busca en lista de visitas
		while((i< listaVisitas.length) && (listaVisitas[i]['idVisitante'] != idVisitante))
			i++;
		if(i < listaVisitas.length){  //Si hay una visita activa para el visitante
			idVisita = listaVisitas[i]['idVisita'];
			let idLocal = listaVisitas[i]['idLocal'];
			let tipo = listaVisitas[i]['tipo'];
			let ficha = listaVisitas[i]['numFicha'];
			autoriza = listaVisitas[i]['documAutoriza'];
			i= 0;	//buscar idBloque
			while((i< listaLocales.length) && (listaLocales[i]['idLocal'] != idLocal))
				i++;
			let idBloque = listaLocales[i]['idBloque'] ;
			document.getElementById("bloques").value = idBloque;
			//ACA, cargar select locales 
			mostrarLocales(idBloque);
			document.getElementById("locales").value = idLocal;

			document.getElementById("tipoAutorizacion").value = tipo;

			//Cargar select residentes 
			consultarResidentes(idLocal);

			//si existe, colocar ficha en #numFicha
			if(ficha > 0){
				document.getElementById("numFicha").value = ficha;
			}
		}
	}
}

/*Cuando el visitante no esta registrado, verifica los datos del form -----------------
	intenta crear, si ya existe esa cedula, modifica datos
*/
function guardarDatosVisitante(){
	let msj = vista.validarDatosForm('frmIngreso');
	if(msj === 'ok'){
		let datos = vista.getDatosForm('frmIngreso');
		datos['opc'] = 'guardarDatosVisitante';
		datos['placaVehiculo'] = datos['placaVehiculo'].toUpperCase();
		datos['foto'] = datos['documVisitante'] + '.png';
		ejecutarAjax(datos, guardarDatosVisitanteRespuesta);		
	}else{
		vista.mostrarAviso(msj);
	}
}

function guardarDatosVisitanteRespuesta(dato1){
	if(dato1['ok'] > 0){
		vista.mostrarAviso('Visitante creado o actualizado');		
	}else{
		vista.mostrarAviso('No se pudo crear el registro');		
	}
}

//Despliega ventana emergente para buscar residentes
var buscaResidente = false;

function buscarResidentes(){
	if(buscaResidente){
		$("#buscarModal").modal();
		vista.mostrarResidentesTotal(listaResidentesTotal);
	}else{
		vista.mostrarAviso('Faltan datos del visitante');		
	}
}



/* METODOS PARA FILTAR LA TABLA DE RESIDENTES */
	/*escuchador del evento */
    document.querySelector("#buscar").onkeyup = function(){
        $TableFilter("#tablaResidentes", this.value);
    }
    /* manejador del evento: oculta filas que no cumplan condicion*/
    $TableFilter = function(id, value){
        var rows = document.querySelectorAll(id + ' tbody tr');
        
        for(var i = 0; i < rows.length; i++){
            var showRow = false;
            
            var row = rows[i];
            row.style.display = 'none';
            
            for(var x = 0; x < row.childElementCount; x++){
                if(row.children[x].textContent.toLowerCase().indexOf(value.toLowerCase().trim()) > -1){
                    showRow = true;
                    break;
                }
            }
            
            if(showRow){
                row.style.display = null;
            }
        }
    }


//Se ejecuta al pulsar boton 'Aceptar' de modal. carga datos de destino
function asignarResidente(i){
	//poblar select bloques
	vista.cargarSelect("bloques", listaBloques, 'idBloque','nombreBloque');
	vista.cargarSelect("tipoAutorizacion", tiposAutorizacion, 'idTipoAutorizacion','descripTipoAutorizacion');

	//tomar datos de listaResidentesTotal y asignar a los selects 
	let idBloque = listaResidentesTotal[i]['idBloque'];
	document.getElementById("bloques").value = idBloque;
	//poblar select locales y seleccionar
	mostrarLocales(idBloque);
	document.getElementById("locales").value = listaResidentesTotal[i]['idLocal'];
	//ocultar ventana
	$("#buscarModal").modal('hide');
}

/*++++++++++++ BLOQUE VISITAS +++++++++++++++++++++++++++++*/
	//Cuando se selecciona un bloque, carga select de locales para 
	function mostrarLocales(idBloque){
		let lista = [];
		for(let j = 0; j < listaLocales.length; j++){
			if(listaLocales[j]['idBloque'] == idBloque){
				lista.push(listaLocales[j]);
			}
		}
		vista.cargarSelect('locales', lista, 'idLocal', 'nombreLocal');
	}

	//Cuando se selecciona un local, consulta las autorizaciones para ese local
	function consultarAutorizaciones(val){
		let datos = {'opc': 'consultarAutorizaciones', 'idLocal': parseInt(val)};
		ejecutarAjax(datos, consultarAutorizacionesRespuesta);
	}

	//Despliega la tabla de autorizaciones activas y consulta residentes
	function consultarAutorizacionesRespuesta(dato1){
		vista.mostrarAutorizaciones(dato1, tiposAutorizacion);
		consultarResidentes();
	}

	//Consulta los residentes del local seleccionado
	function consultarResidentes(){
		let local = parseInt($('#locales').val());
		let datos = {'opc': 'consultarResidentes', 'idLocal': parseInt(local)};
		ejecutarAjax(datos, consultarResidentesRespuesta);
	}

	//Carga select de residentes en #autorizado dato1:{documResidente, nombres}
	function consultarResidentesRespuesta(dato1){
		listaResidentes = dato1;
		vista.cargarSelect("autorizado", dato1, "docum", "nombres");
		
		//si existe visita activa, cambiar select
			if(autoriza > 0){
				document.getElementById("autorizado").value = autoriza;
			}
	}



	//----- PERMISO VISITAS --------------------------------------
	//Si no hay autorizacion en la tabla, se envia mensaje al propietario
	function pedirAutorizacion(){
		//si estan seleccionados todos los selects:
		if(vista.validarSelects(1)){
			crearRegistroVisita(1)//crear registro visita en estado 1

		}else{
			vista.mostrarAvisoModal('Debe seleccionar todos los datos')//mensaje emergente error
		}
	}

	//crea registro visita y pasa a cola  -----------------------------------
	function permitirIngreso(){
		//si hay ficha
		ficha = parseInt($('#numFicha').val());
		if (!isNaN(ficha) && ficha > 0){
			//si estan seleccionados todos los selects:
			if(vista.validarSelects(5)){
				crearRegistroVisita(5)//crear registro visita en estado 5 ( 2 a 4: automatico porpermiso)
			}else{
				vista.mostrarAvisoModal('Debe seleccionar todos los datos...')//mensaje emergente error
			}
		}else{
			vista.mostrarAvisoModal('Debe ingresar un numero de ficha...')//mensaje emergente error
		}
	}

	//Crea el registro de la nueva visita, ingresa a la lista y despliega tabla listaVisitas ++++++
	//ESTADO = 1: por autorizar, 5: autorizado
	function crearRegistroVisita(estado){
		let ficha = 0; //Para caso de estado = 1: 
		if(estado == 5){
			ficha = parseInt($('#numFicha').val());
		}

		//Busca el idVisitante en listaVisitantes
		idVisitante = -1; //inicialmente no esta
		let j = 0;
		while(j < listaVisitantes.length && listaVisitantes[j]['documVisitante'] != cedulaVisitaActiva)
			j++;

		if(j< listaVisitantes.length){ //lo encontro...
			idVisitante = listaVisitantes[j]['idVisitante']; //toma el id
		}

		if(idVisitante > 0){  		// Si visitante esta registrado, 
			//Busca reg. de visita...
			local = parseInt($('#locales').val());
			j = 0;
			while(j < listaVisitas.length && (listaVisitas[j]['idVisitante'] != idVisitante || listaVisitas[j]['idLocal'] != local))
				j++;
			
			if(j == listaVisitas.length){ 	// Si no existe, se crea registro de visita
				let datos = {};
				datos['idLocal'] = local;
				datos['idVisitante'] = idVisitante; 
				datos['fechaIngreso'] =  tomarFecha(0);
				datos['fechaSalida'] = '';
				datos['estado'] = estado;
				datos['tipo'] = parseInt($('#tipoAutorizacion').val());
				datos['numFicha'] = ficha;
				datos['placaVehiculo'] = $('#placaVehiculo').val();
				datos['documAutoriza'] = $('#autorizado').val();
				let visita = new Visita();
				visita.setData(datos);
				listaVisitas.push(visita);		//Agrega objeto a la lista
				datos["opc"] = 'crearRegistroVisita'; 	//guardar en BD
				ejecutarAjax(datos, crearRegistroVisitaRespuesta);

			}else{ 	//Si existe, se modifica el estado
				listaVisitas[j]['estado'] = estado; //Actualiza estado en el array
				//modificar en BD
				idVisita = listaVisitas[j]['idVisita'];
				let datos = {};
				datos['numFicha'] = ficha; 
				datos['idVisita'] = idVisita; 
				datos['estado'] = estado;
				datos["opc"] = 'actualizarRegistroVisita'; 	
				ejecutarAjax(datos, crearRegistroVisitaRespuesta);
			}

		}else{
			vista.mostrarAviso('No ha registrado al visitante');		
		}
	}

	function crearRegistroVisitaRespuesta(dato1){
		if(dato1['ok'] > 0){
			//LEER VISITAS
		let datos = {'opc': 'cargarVisitasPunto', 'idPunto': idPunto};
		ejecutarAjax(datos, cargarVisitasPuntoRespuesta);



			vista.mostrarAviso('Visita actualizada');
			vista.mostrarColaVisitas(listaVisitas);
		}else{
			vista.mostrarAviso('No se pudo actualizar el registro');		
		}
	}



	//----- REGISTRO DE SALIDAS --------------------------------------
	/*Al seleccionar la opcion SALIDAS, ++++++++++++++++++++++++++++++ 
		se listan las fichas activas en el select id="fichasActivas"
	*/
	function listarFichas(){
		vista.cargarSelectFichas(listaVisitas);
	}
	//Al seleccionar una ficha, se desplegan los datos del visitante 
	function mostrarDatosVisita(val){
		if(val >= 0){
			idVisitante = listaVisitas[val]['idVisitante'];
			idVisita = listaVisitas[val]['idVisita'];
			local = listaVisitas[val]['idLocal'];

			j = 0;
			while(j < listaVisitantes.length && listaVisitantes[j]['idVisitante'] != idVisitante)
				j++;
			vista.setDatosForm(listaVisitantes[j]);
			//mostrar foto visitante
			document.getElementById("imgVisitante").src = "/aguialarmas/fotoVisitante/" + listaVisitantes[j]['foto'];  
			//Cambiar leyenda del boton si no ha ingresado
			if (listaVisitas[val]['estado'] < 6){
				document.getElementById("btnRegistrarSalida").innerHTML = 'Desistir Ingreso';
			}else{
				document.getElementById("btnRegistrarSalida").innerHTML = 'Registrar Salida';
			}
		}else{
			vista.limpiarForm("frmSalida");
			document.getElementById("imgVisitante").src = "img/photo.png"; //limpiar foto
		}
	}

	//Al pulsar el boton registrar Salida , se modifica el registro
	function registrarSalida(){
		if(idVisita >= 0){
			let estado = 7;
			if(document.getElementById("btnRegistrarSalida").innerHTML == 'Registrar Salida'){
				estado = 8;
			}
			let datos = {};
			datos['fechaSalida'] = tomarFecha(0); //Ahora sale
			datos['estado'] = estado;
			datos['idVisita'] = idVisita; 
			datos["opc"] = 'registrarSalida'; 	
			ejecutarAjax(datos, registrarSalidaRespuesta);
		}
	}

	function registrarSalidaRespuesta(dato1){
		if(dato1['ok'] > 0){
			//Cargar cola de visitas activas y desplegar
			let datos = {'opc': 'cargarVisitasPunto', 'idPunto': idPunto};
			ejecutarAjax(datos, cargarVisitasPuntoRespuesta2);
		}else{
			vista.mostrarAviso('No se pudo actualizar el registro');		
		}
	}

	function cargarVisitasPuntoRespuesta2(datos1){
		llenarTablaVisitas(datos1);
		vista.cargarSelectFichas(listaVisitas); 
		vista.limpiarForm('frmSalida');
		document.getElementById("imgVisitante").src = "img/photo.png"; //limpiar foto
	}


//OJO: MODIFICAR POR idVisita
	//al pulsar el boton cancelar
	function cancelarVisita(){
		if(idVisita > 0){
		let datos = {};
		datos['idVisita'] = idVisita; 
		datos['estado'] = 7;
		datos["opc"] = 'actualizarRegistroVisita'; 	
		ejecutarAjax(datos, crearRegistroVisitaRespuesta);
		}else{
			vista.mostrarAviso('No ha registrado la visita.');		
		}
	}

	//Actualiza array y tabla con visitas activas --------------------------
	function llenarTablaVisitas(datos1){
		//cargar como objetos
		listaVisitas = [];					//limpia la lista 
		for(let i = 0; i < datos1.length; i++){
			let visita = new Visita();
			visita.setData(datos1[i]);
			listaVisitas.push(visita);		//Agrega objeto a la lista
		}
		idVisita = -1; //no hay visita seleccionada
		//Desplegar tabla visitas : nombre, local, ficha
		vista.mostrarColaVisitas(listaVisitas);
	}

/*++++++++++ DESPLEGAR DETALLES DE VISITAS ACTIVAS+++++++++++++++++++++++++*/
	function listarVisitas(){
		//Consultar los detalles de las visitas
		let datos = {'opc': 'cargarDetallesVisitasPunto', 'idPunto': idPunto};
			ejecutarAjax(datos, cargarDetallesVisitasPuntoRespuesta);
	}

	function cargarDetallesVisitasPuntoRespuesta(datos){
		vista.mostrarDatosTabla("#tblDetalleVisitas", datos, "");
	}














/*+++++++++++++ BLOQUE DE CONSULTA PERIODICA AL SERVIDOR ++++++++++++++++++++++++
	Recarga mensajes y tips en array, Se ejecutan las funciones en cascada
	*/ 
	function verificarServidor(){
		//consulta Tips del Operador a esta porteria.
/*		let fecha = tomarDia(0);
		let hora =   tomarHora(0);
		let datos = {};
		datos['idPunto'] = idPunto;
		datos['fecha'] = fecha;
		datos['hora'] = hora;
		datos["opc"] = 'consultarTipsOperador'; 	
		ejecutarAjax(datos, verificarServidor1);
*/	}

	//trae tips, consulta mensajes
	function verificarServidor1(datos1){
		listaTips= datos1; //{'idTip', 'textoTip'}
		
		let datos = {};
		datos['idPunto'] = idPunto;
		datos["opc"] = 'consultarMsjsOperador'; 	
		ejecutarAjax(datos, verificarServidor2);
	}

	//trae mensajes, Consulta modificaciones a visitas
	function verificarServidor2(datos1){
		listaMensajes = datos1; //{'idMsj', 'textoMsj'}

		let datos = {'opc': 'cargarVisitasPunto', 'idPunto': idPunto};
		ejecutarAjax(datos, verificarServidor3);
	}

	//trae visitas activas (aprobado ingreso por residente)
	function verificarServidor3(datos1){
		llenarTablaVisitas(datos1);
		actualizarMarquesina();
	}










/******* FUNCION PARA LA MARQUESINA *******************************************/

	//Inicia la marquesina
	$('.marquee').marquee({
		speed: 30, 				//desplazamiento en px/seg
		gap: 50, 				//gap in pixels between the tickers
		delayBeforeStart: 0, 	//time in milliseconds before the marquee will start animating 
		direction: 'left', 		//'left' or 'right'
		duplicated: false, 		//true or false - should the marquee be duplicated to show an effect of continues flow
		pauseOnHover:true
	});

	//Refresca los tips y mensajes en la marquesina dentro de #divMsj y #divMsj1
	var ciclosMarquesina = 3; //cada tres ciclos de consulta pooling
	function actualizarMarquesina(){
		if(--ciclosMarquesina < 0){
			ciclosMarquesina = 3;
			let txt = '';
			//listaTips
			listaTips.forEach(function(tip) {
				txt += ' -- ' + tip['textoTip'];
			});
			//listaMensajes
			listaMensajes.forEach(function(msj) {
				txt += ' -- MENSAJE: ' + msj['textoMsj'];
			});
			$('.js-marquee').html(txt);
		}
	}

	//Marca el primer mensaje de listaMensajes como leido
	 function marcarMsjLeido(){
	//	listaMensajes = datos1; //{'idMsj', 'textoMsj'}
		if(listaMensajes.length > 0){
			let datos = {'opc': 'marcarMsjLeido', 'idMsj': listaMensajes[0]['idMsj']};
			ejecutarAjax(datos, marcarMsjLeidoRespuesta);
		}
	}

	//Pendiente....
	function marcarMsjLeidoRespuesta(datos1){

	}



/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
// detecta enter keypress o TAB  en input numero de documento visitante -----------------------

	$(document).on("keypress", "input", function(e){
	    if(e.which == 13){
	    	var id = $(this).attr('id');
	    	if(id === "documVisitante"){
	    		leerCedula();
	        }
	    }
	});

   	function leerCedula(){
        cedulaVisitaActiva = $("#documVisitante").val();
        //Elimina foto anterior
        document.getElementById("imgVisitante").src = "img/photo.png";
        buscaResidente = false;
        consultarVisitante();
   	}




/******* CONSULTA A LA BD *****************************************************************
	realiza la conexion al php del servidor y devuelve un resultado
	los datos se convierten a Json
	@datos: array con datos al servidor, incluye
	@funcionRetorno: Se ejecuta al responder AJAX
	return @resp: datos de respuesta en array 
	*/
function ejecutarAjax(datos, funcionRetorno){
	$.ajax({
		url: 'php/despachador.php',
		//data: dataJson,
		data: datos,
		type: 'post',

		success : function(response){
			if(IsValidJSONString(response)){
				vista.mostrarAviso("");
				var resp = JSON.parse(response);

				funcionRetorno(resp);

			}else{
				vista.mostrarAviso("Error en los datos de respuesta");
			}
		},

		error : function(xhr, status){
			alert('error: ' + status)
		}
	});
}

//-----------------------------------------------------------------------
//Verifica si str tiene estructura JSON valida
function IsValidJSONString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

//----------------------------------------------------------------------
function limpiar(){
	vista.limpiar("der");
}

//----- Despliega modal con elementos de camara ------------------------
function capturarFoto(){
	//Validar ingreso de datos en formulario
	let msj = vista.validarDatosForm('frmIngreso');
	if(msj === 'ok'){
		let datos = vista.getDatosForm('frmIngreso');
		datos['opc'] = 'guardarDatosVisitante';
		datos['placaVehiculo'] = datos['placaVehiculo'].toUpperCase();
		datos['foto'] = datos['documVisitante'] + '.png';
		ejecutarAjax(datos, guardarDatosVisitanteRespuesta);		
		//desplegar datos del punto
		consultarVisitante();

		$("#myModal").modal();

	}else{
		vista.mostrarAviso(msj);
	}
}

/* tomarFecha  ********************************************************* 
	 * Funcion auxiliar para tomar la fecha y la hora actual,
	 * a la que le agrega el numero del parametro 'dias' 
	 * devuelve una cadena con formato "aaaa-mm-ddThh-min"
	 *********************************************************************/
	function tomarFecha(dias){
		var ahora = new Date();
		ahora.setDate(ahora.getDate() + dias);
		var dd = ahora.getDate();
		var mm = ahora.getMonth()+1; //January is 0!
		var hh = ahora.getHours();
		var min = ahora.getMinutes();
		var yyyy = ahora.getFullYear();
		if(dd<10) dd='0'+ dd;
		if(mm<10)mm='0'+ mm;
		if(hh<10)hh='0'+ hh;
		if(min<10)min='0'+ min;
		var fecha = yyyy +'-' + mm +'-' + dd + 'T' + hh +':' + min;
		return fecha;	
	}

	 /* devuelve una cadena con formato "aaaa-mm-dd" */
	function tomarDia(dias){
		let txt = tomarFecha(dias);
		return txt.substring(0, 10);
	}

	 /* devuelve una cadena con formato "hh:mm:00" */
	function tomarHora(dias){
		let txt = tomarFecha(dias);
		return (txt.substring(11)+':00');
	}

/************************** FIN DEL CODIGO **********************************************/
//PROVISIONAL PRUEBA
function pedirMensajes(){
	let datos = {'opc': 'enviarMsj'};
	
	$.ajax({
		url: 'php/mensajes.php',
		//data: dataJson,
		data: datos, 
		type: 'get',

		success : function(response){
			if(IsValidJSONString(response)){
				vista.mostrarAviso("");
				var resp = JSON.parse(response);


			}else{
				vista.mostrarAviso("Error en los datos de respuesta");
			}
		},

		error : function(xhr, status){
			alert('error: ' + status)
		}
	});
}
